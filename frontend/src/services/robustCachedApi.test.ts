import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  robustCachedMindMapApi, 
  robustCachedNodeApi, 
  robustCachedCanvasApi,
  apiNotifications,
  wrapWithNotifications
} from './robustCachedApi'
import { apiCache } from './cache'
import * as api from './api'
import { ConflictError } from './defensiveCache'

// Mock the base API
vi.mock('./api', () => ({
  mindMapApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  nodeApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    batchUpdate: vi.fn(),
  },
  canvasApi: {
    get: vi.fn(),
    update: vi.fn(),
    reset: vi.fn(),
  },
}))

describe('Robust Cached API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiCache.clear()
  })

  describe('MindMap API', () => {
    it('should handle network errors with retry', async () => {
      // Ensure we're "online" for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      let attempts = 0
      vi.mocked(api.mindMapApi.getAll).mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve([{ id: '1', title: 'Test', version: 1 }])
      })

      const result = await robustCachedMindMapApi.getAll()
      
      expect(attempts).toBe(3)
      expect(result).toEqual([{ id: '1', title: 'Test', version: 1 }])
    })

    it('should handle version conflicts on update', async () => {
      const key = 'mindmaps:1'
      const originalData = { 
        id: '1', 
        title: 'Original', 
        version: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      
      // Mock initial fetch
      vi.mocked(api.mindMapApi.getById).mockResolvedValue(originalData)
      await robustCachedMindMapApi.getById('1')

      // Mock server returning higher version (conflict)
      vi.mocked(api.mindMapApi.update).mockResolvedValue({
        ...originalData,
        title: 'Server Update',
        version: 3
      })

      const result = await robustCachedMindMapApi.update('1', { 
        title: 'Client Update',
        version: 1 
      })

      // Should use server version but log conflict
      expect(result.title).toBe('Server Update')
      expect(result.version).toBe(3)
    })

    it('should invalidate caches on delete', async () => {
      vi.mocked(api.mindMapApi.delete).mockResolvedValue()
      
      // Pre-populate some caches
      apiCache.set('mindmaps:1', { data: { id: '1' } })
      apiCache.set('mindmaps:all', { data: [{ id: '1' }] })
      apiCache.set('nodes:1:flat', { data: [] })
      apiCache.set('canvas:1', { data: {} })

      await robustCachedMindMapApi.delete('1')

      // All related caches should be cleared
      expect(apiCache.get('mindmaps:1')).toBeNull()
      expect(apiCache.get('mindmaps:all')).toBeNull()
      expect(apiCache.get('nodes:1:flat')).toBeNull()
      expect(apiCache.get('canvas:1')).toBeNull()
    })
  })

  describe('Node API', () => {
    it('should invalidate parent mind map on node creation', async () => {
      const newNode = { 
        id: 'node1', 
        mindMapId: '1',
        text: 'New Node',
        positionX: 0,
        positionY: 0
      }
      
      vi.mocked(api.nodeApi.create).mockResolvedValue(newNode)
      
      // Pre-populate mind map cache
      apiCache.set('mindmaps:1', { data: { id: '1', version: 1 } })
      
      await robustCachedNodeApi.create('1', {
        text: 'New Node',
        positionX: 0,
        positionY: 0
      })

      // Mind map cache should be invalidated
      expect(apiCache.get('mindmaps:1')).toBeNull()
    })

    it('should handle batch updates optimistically', async () => {
      const nodes = [
        { id: 'n1', positionX: 0, positionY: 0, mindMapId: '1' },
        { id: 'n2', positionX: 100, positionY: 100, mindMapId: '1' }
      ]
      
      // Set initial cache
      apiCache.set('nodes:1:flat', {
        data: nodes,
        metadata: { version: 1, timestamp: Date.now() }
      })

      const updates = [
        { id: 'n1', positionX: 50, positionY: 50 },
        { id: 'n2', positionX: 150, positionY: 150 }
      ]

      vi.mocked(api.nodeApi.batchUpdate).mockResolvedValue(
        nodes.map((n, i) => ({
          ...n,
          positionX: updates[i].positionX!,
          positionY: updates[i].positionY!
        }))
      )

      const result = await robustCachedNodeApi.batchUpdate('1', updates)

      expect(result[0].positionX).toBe(50)
      expect(result[1].positionX).toBe(150)
    })
  })

  describe('Canvas API', () => {
    it('should handle canvas updates silently on failure', async () => {
      const canvas = { 
        id: 'c1', 
        mindMapId: '1', 
        zoom: 1, 
        panX: 0, 
        panY: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
      
      apiCache.set('canvas:1', {
        data: canvas,
        metadata: { version: 1, timestamp: Date.now() }
      })

      vi.mocked(api.canvasApi.update).mockRejectedValue(new Error('Network error'))

      // Should not throw
      await expect(
        robustCachedCanvasApi.update('1', { zoom: 2 })
      ).rejects.toThrow()

      // Original canvas should be restored
      const cached = apiCache.get('canvas:1')
      expect(cached?.data.data.zoom).toBe(1)
    })
  })

  describe('Notification wrapper', () => {
    it('should emit success notifications', async () => {
      const notificationSpy = vi.fn()
      apiNotifications.addEventListener('notification', notificationSpy)

      const mockFn = vi.fn().mockResolvedValue('success')
      const wrapped = wrapWithNotifications(
        mockFn,
        'Operation successful',
        'Operation failed'
      )

      await wrapped()

      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            type: 'success',
            message: 'Operation successful'
          }
        })
      )
    })

    it('should emit error notifications', async () => {
      const notificationSpy = vi.fn()
      apiNotifications.addEventListener('notification', notificationSpy)

      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'))
      const wrapped = wrapWithNotifications(
        mockFn,
        'Success',
        'Custom error message'
      )

      await expect(wrapped()).rejects.toThrow()

      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            type: 'error',
            message: 'Custom error message',
            details: expect.any(Error)
          }
        })
      )
    })

    it('should handle conflict errors specially', async () => {
      const notificationSpy = vi.fn()
      apiNotifications.addEventListener('notification', notificationSpy)

      const conflictError = new ConflictError(
        'Version conflict',
        { version: 2 },
        { version: 1 },
        'update'
      )
      
      const mockFn = vi.fn().mockRejectedValue(conflictError)
      const wrapped = wrapWithNotifications(mockFn)

      await expect(wrapped()).rejects.toThrow()

      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            type: 'warning',
            message: 'Your changes conflicted with another update. The latest version has been loaded.',
            details: conflictError
          }
        })
      )
    })
  })

  describe('Offline handling', () => {
    it('should provide helpful offline message', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      window.dispatchEvent(new Event('offline'))

      const notificationSpy = vi.fn()
      apiNotifications.addEventListener('notification', notificationSpy)

      vi.mocked(api.mindMapApi.create).mockRejectedValue(new Error('Network error'))

      await expect(
        robustCachedMindMapApi.create({ title: 'Test' })
      ).rejects.toThrow('Cannot create mind map while offline')

      // Reset online state
      Object.defineProperty(navigator, 'onLine', { value: true })
      window.dispatchEvent(new Event('online'))
    })
  })
})