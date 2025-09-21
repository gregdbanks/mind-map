import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MindMapProvider, useMindMap } from './MindMapContext'
import { NotificationProvider } from '../components/NotificationProvider'
import type { MindMap, Node, CanvasState } from '../types'

// Mock the robust cached API
vi.mock('../services/robustCachedApi', () => ({
  robustCachedMindMapApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  robustCachedNodeApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    batchUpdate: vi.fn(),
  },
  robustCachedCanvasApi: {
    get: vi.fn(),
    update: vi.fn(),
    reset: vi.fn(),
  },
  apiNotifications: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  wrapWithNotifications: vi.fn((fn) => fn),
}))

// Import the mocked APIs
import { 
  robustCachedMindMapApi, 
  robustCachedNodeApi, 
  robustCachedCanvasApi 
} from '../services/robustCachedApi'

describe('MindMapContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NotificationProvider>
      <MindMapProvider>{children}</MindMapProvider>
    </NotificationProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide initial state', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper })

    expect(result.current.state).toEqual({
      mindMaps: [],
      selectedMindMap: null,
      nodes: [],
      canvasState: null,
      loading: false,
      error: null,
    })
  })

  it('should throw error when used outside provider', () => {
    expect(() => renderHook(() => useMindMap())).toThrow(
      'useMindMap must be used within a MindMapProvider'
    )
  })

  describe('MindMap actions', () => {
    it('should fetch mind maps', async () => {
      const mockMindMaps: MindMap[] = [
        {
          id: '1',
          title: 'Test Mind Map',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)

      const { result } = renderHook(() => useMindMap(), { wrapper })

      await act(async () => {
        await result.current.actions.fetchMindMaps()
      })

      expect(result.current.state.mindMaps).toEqual(mockMindMaps)
      expect(result.current.state.loading).toBe(false)
      expect(result.current.state.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      const error = new Error('Network error')
      vi.mocked(robustCachedMindMapApi.getAll).mockRejectedValue(error)

      const { result } = renderHook(() => useMindMap(), { wrapper })

      await act(async () => {
        await result.current.actions.fetchMindMaps()
      })

      expect(result.current.state.mindMaps).toEqual([])
      expect(result.current.state.loading).toBe(false)
      expect(result.current.state.error).toBe('Network error')
    })

    it('should select a mind map and fetch related data', async () => {
      const mockMindMap: MindMap = {
        id: '1',
        title: 'Test Mind Map',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const mockNodes: Node[] = [
        {
          id: 'node1',
          mindMapId: '1',
          text: 'Test Node',
          positionX: 0,
          positionY: 0,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      const mockCanvas: CanvasState = {
        id: 'canvas1',
        mindMapId: '1',
        zoom: 1,
        panX: 0,
        panY: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue(mockMindMap)
      vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue(mockNodes)
      vi.mocked(robustCachedCanvasApi.get).mockResolvedValue(mockCanvas)

      const { result } = renderHook(() => useMindMap(), { wrapper })

      await act(async () => {
        await result.current.actions.selectMindMap('1')
      })

      expect(result.current.state.selectedMindMap).toEqual(mockMindMap)
      expect(result.current.state.nodes).toEqual(mockNodes)
      expect(result.current.state.canvasState).toEqual(mockCanvas)
    })

    it('should create a new mind map', async () => {
      const createData = { title: 'New Mind Map', description: 'Test' }
      const mockResponse: MindMap = {
        id: '2',
        ...createData,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(robustCachedMindMapApi.create).mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useMindMap(), { wrapper })

      let createdMindMap: MindMap | undefined
      await act(async () => {
        createdMindMap = await result.current.actions.createMindMap(createData)
      })

      expect(createdMindMap).toEqual(mockResponse)
      expect(result.current.state.mindMaps).toContainEqual(mockResponse)
    })

    it('should delete a mind map', async () => {
      const initialMindMaps: MindMap[] = [
        {
          id: '1',
          title: 'To Delete',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(initialMindMaps)
      vi.mocked(robustCachedMindMapApi.delete).mockResolvedValue()

      const { result } = renderHook(() => useMindMap(), { wrapper })

      // First fetch mind maps
      await act(async () => {
        await result.current.actions.fetchMindMaps()
      })

      // Then delete one
      await act(async () => {
        await result.current.actions.deleteMindMap('1')
      })

      expect(result.current.state.mindMaps).toHaveLength(0)
    })
  })

  describe('Node actions', () => {
    it('should create a node', async () => {
      const { result } = renderHook(() => useMindMap(), { wrapper })

      // Set selected mind map first
      await act(async () => {
        vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue({
          id: '1',
          title: 'Test',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue([])
        vi.mocked(robustCachedCanvasApi.get).mockRejectedValue(new Error('Not found'))
        
        await result.current.actions.selectMindMap('1')
      })

      const createData = {
        text: 'New Node',
        positionX: 100,
        positionY: 100,
      }

      const mockResponse: Node = {
        id: 'node1',
        mindMapId: '1',
        ...createData,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(robustCachedNodeApi.create).mockResolvedValue(mockResponse)

      let createdNode: Node | undefined
      await act(async () => {
        createdNode = await result.current.actions.createNode(createData)
      })

      expect(createdNode).toEqual(mockResponse)
      expect(result.current.state.nodes).toContainEqual(mockResponse)
    })

    it('should delete a node and its children', async () => {
      const { result } = renderHook(() => useMindMap(), { wrapper })

      // Set up initial nodes with parent-child relationship
      const initialNodes: Node[] = [
        {
          id: 'parent',
          mindMapId: '1',
          text: 'Parent',
          positionX: 0,
          positionY: 0,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'child1',
          mindMapId: '1',
          text: 'Child 1',
          parentId: 'parent',
          positionX: 100,
          positionY: 0,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'child2',
          mindMapId: '1',
          text: 'Child 2',
          parentId: 'parent',
          positionX: -100,
          positionY: 0,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      // Set selected mind map and nodes
      await act(async () => {
        vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue({
          id: '1',
          title: 'Test',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue(initialNodes)
        vi.mocked(robustCachedCanvasApi.get).mockRejectedValue(new Error('Not found'))
        
        await result.current.actions.selectMindMap('1')
      })

      vi.mocked(robustCachedNodeApi.delete).mockResolvedValue()

      await act(async () => {
        await result.current.actions.deleteNode('parent')
      })

      expect(result.current.state.nodes).toHaveLength(0)
    })

    it('should batch update nodes', async () => {
      const { result } = renderHook(() => useMindMap(), { wrapper })

      const initialNodes: Node[] = [
        {
          id: 'node1',
          mindMapId: '1',
          text: 'Node 1',
          positionX: 0,
          positionY: 0,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'node2',
          mindMapId: '1',
          text: 'Node 2',
          positionX: 0,
          positionY: 0,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      // Set selected mind map and nodes
      await act(async () => {
        vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue({
          id: '1',
          title: 'Test',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue(initialNodes)
        vi.mocked(robustCachedCanvasApi.get).mockRejectedValue(new Error('Not found'))
        
        await result.current.actions.selectMindMap('1')
      })

      const updates = [
        { id: 'node1', positionX: 100, positionY: 100 },
        { id: 'node2', positionX: 200, positionY: 200 },
      ]

      const mockResponse = initialNodes.map((node, index) => ({
        ...node,
        positionX: updates[index].positionX!,
        positionY: updates[index].positionY!,
      }))

      vi.mocked(robustCachedNodeApi.batchUpdate).mockResolvedValue(mockResponse)

      await act(async () => {
        await result.current.actions.batchUpdateNodes(updates)
      })

      const updatedNodes = result.current.state.nodes
      expect(updatedNodes[0].positionX).toBe(100)
      expect(updatedNodes[0].positionY).toBe(100)
      expect(updatedNodes[1].positionX).toBe(200)
      expect(updatedNodes[1].positionY).toBe(200)
    })
  })

  describe('Canvas actions', () => {
    it('should update canvas state', async () => {
      const { result } = renderHook(() => useMindMap(), { wrapper })

      const initialCanvas: CanvasState = {
        id: 'canvas1',
        mindMapId: '1',
        zoom: 1,
        panX: 0,
        panY: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Set selected mind map and canvas
      await act(async () => {
        vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue({
          id: '1',
          title: 'Test',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue([])
        vi.mocked(robustCachedCanvasApi.get).mockResolvedValue(initialCanvas)
        
        await result.current.actions.selectMindMap('1')
      })

      const updateData = { zoom: 1.5, panX: 100, panY: 50 }
      const mockResponse: CanvasState = {
        ...initialCanvas,
        ...updateData,
      }

      vi.mocked(robustCachedCanvasApi.update).mockResolvedValue(mockResponse)

      await act(async () => {
        await result.current.actions.updateCanvas(updateData)
      })

      const canvas = result.current.state.canvasState
      expect(canvas?.zoom).toBe(1.5)
      expect(canvas?.panX).toBe(100)
      expect(canvas?.panY).toBe(50)
    })

    it('should reset canvas centering on nodes', async () => {
      const { result } = renderHook(() => useMindMap(), { wrapper })

      // Set selected mind map
      await act(async () => {
        vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue({
          id: '1',
          title: 'Test',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue([])
        vi.mocked(robustCachedCanvasApi.get).mockRejectedValue(new Error('Not found'))
        
        await result.current.actions.selectMindMap('1')
      })

      const mockResponse: CanvasState = {
        id: 'canvas1',
        mindMapId: '1',
        zoom: 1,
        panX: 0,
        panY: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(robustCachedCanvasApi.reset).mockResolvedValue(mockResponse)

      await act(async () => {
        await result.current.actions.resetCanvas(true)
      })

      expect(vi.mocked(robustCachedCanvasApi.reset)).toHaveBeenCalledWith('1', true)
      expect(result.current.state.canvasState).toEqual(mockResponse)
    })
  })

  describe('Error handling', () => {
    it('should set and clear errors', async () => {
      const { result } = renderHook(() => useMindMap(), { wrapper })
      
      act(() => {
        result.current.actions.setError('Test error')
      })
      expect(result.current.state.error).toBe('Test error')
      
      act(() => {
        result.current.actions.clearError()
      })
      expect(result.current.state.error).toBeNull()
    })
  })
})