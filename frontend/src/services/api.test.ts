import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MindMap, Node, CanvasState } from '../types'
import { mindMapApi, nodeApi, canvasApi } from './api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('mindMapApi', () => {
    it('should get all mind maps', async () => {
      const mockMindMaps: MindMap[] = [
        {
          id: '1',
          title: 'Test Mind Map',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMindMaps,
      })

      const result = await mindMapApi.getAll()
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockMindMaps)
    })

    it('should get mind map by id with includes', async () => {
      const mockMindMap: MindMap = {
        id: '1',
        title: 'Test Mind Map',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [],
        canvasState: {} as CanvasState,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMindMap,
      })

      const result = await mindMapApi.getById('1', ['nodes', 'canvas'])
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1?include=nodes%2Ccanvas', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockMindMap)
    })

    it('should create a mind map', async () => {
      const createData = { title: 'New Mind Map', description: 'Test description' }
      const mockResponse: MindMap = {
        id: '1',
        ...createData,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await mindMapApi.create(createData)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should update a mind map', async () => {
      const updateData = { title: 'Updated Title', version: 1 }
      const mockResponse: MindMap = {
        id: '1',
        title: updateData.title,
        version: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await mindMapApi.update('1', updateData)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should delete a mind map', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await mindMapApi.delete('1')
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await expect(mindMapApi.getById('1')).rejects.toThrow('HTTP error! status: 404')
    })
  })

  describe('nodeApi', () => {
    it('should get hierarchical nodes', async () => {
      const mockNodes: Node[] = [{
        id: '1',
        mindMapId: '1',
        text: 'Root Node',
        positionX: 0,
        positionY: 0,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      }]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNodes,
      })

      const result = await nodeApi.getAll('1', true)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1/nodes?hierarchical=true', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockNodes)
    })

    it('should create a node', async () => {
      const createData = {
        text: 'New Node',
        positionX: 100,
        positionY: 100,
      }
      const mockResponse: Node = {
        id: '1',
        mindMapId: '1',
        ...createData,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await nodeApi.create('1', createData)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1/nodes', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockResponse)
    })

    it('should batch update nodes', async () => {
      const updates = [
        { id: '1', positionX: 100, positionY: 100 },
        { id: '2', positionX: 200, positionY: 200 },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await nodeApi.batchUpdate('1', updates)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1/nodes/batch-update', {
        method: 'POST',
        body: JSON.stringify({ updates }),
        headers: { 'Content-Type': 'application/json' },
      })
    })
  })

  describe('canvasApi', () => {
    it('should get canvas state', async () => {
      const mockCanvas: CanvasState = {
        id: '1',
        mindMapId: '1',
        zoom: 1,
        panX: 0,
        panY: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCanvas,
      })

      const result = await canvasApi.get('1')
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1/canvas', {
        headers: { 'Content-Type': 'application/json' },
      })
      expect(result).toEqual(mockCanvas)
    })

    it('should reset canvas with center on nodes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await canvasApi.reset('1', true)
      
      expect(mockFetch).toHaveBeenCalledWith('/api/mindmaps/1/canvas/reset', {
        method: 'POST',
        body: JSON.stringify({ centerOnNodes: true }),
        headers: { 'Content-Type': 'application/json' },
      })
    })
  })
})