import { mindMapApi, nodeApi, canvasApi } from './api'
import { apiCache, cacheKeys, optimisticUpdate } from './cache'
import type {
  MindMap,
  Node,
  CanvasState,
  CreateMindMapDto,
  UpdateMindMapDto,
  CreateNodeDto,
  UpdateNodeDto,
  UpdateCanvasDto,
} from '../types'

// Cached Mind Map API
export const cachedMindMapApi = {
  getAll: async (): Promise<MindMap[]> => {
    const cacheKey = cacheKeys.mindMaps.all()
    const cached = apiCache.get<MindMap[]>(cacheKey)
    
    if (cached && !cached.isStale) {
      return cached.data
    }

    const response = await mindMapApi.getAll()
    const data = Array.isArray(response) ? response : response.data
    apiCache.set(cacheKey, data, { ttl: 5 * 60 * 1000 }) // 5 min cache
    return data
  },

  getById: async (id: string, includes?: string[]): Promise<MindMap> => {
    const cacheKey = cacheKeys.mindMaps.byId(id)
    const cached = apiCache.get<MindMap>(cacheKey)
    
    if (cached && !cached.isStale) {
      return cached.data
    }

    const data = await mindMapApi.getById(id, includes)
    apiCache.set(cacheKey, data, { ttl: 2 * 60 * 1000 }) // 2 min cache
    return data
  },

  create: async (data: CreateMindMapDto): Promise<MindMap> => {
    const result = await mindMapApi.create(data)
    
    // Invalidate list cache
    apiCache.invalidate(cacheKeys.mindMaps.all())
    
    // Cache the new mind map
    apiCache.set(cacheKeys.mindMaps.byId(result.id), result)
    
    return result
  },

  update: async (id: string, data: UpdateMindMapDto): Promise<MindMap> => {
    // Optimistic update
    const optimistic = optimisticUpdate<MindMap>(
      cacheKeys.mindMaps.byId(id),
      (current) => ({ ...current, ...data, updatedAt: new Date().toISOString() })
    )

    try {
      const result = await mindMapApi.update(id, data)
      
      // Update caches
      apiCache.set(cacheKeys.mindMaps.byId(id), result)
      apiCache.invalidate(cacheKeys.mindMaps.all())
      
      return result
    } catch (error) {
      // Revert optimistic update on error
      if (optimistic) {
        apiCache.invalidate(cacheKeys.mindMaps.byId(id))
      }
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    await mindMapApi.delete(id)
    
    // Clear related caches
    apiCache.invalidate(cacheKeys.mindMaps.byId(id))
    apiCache.invalidate(cacheKeys.mindMaps.all())
    apiCache.invalidate(cacheKeys.nodes.byMindMapId(id))
    apiCache.invalidate(cacheKeys.canvas.byMindMapId(id))
  },
}

// Cached Node API
export const cachedNodeApi = {
  getAll: async (mindMapId: string, hierarchical = false): Promise<Node[]> => {
    const cacheKey = cacheKeys.nodes.byMindMapId(mindMapId, hierarchical)
    const cached = apiCache.get<Node[]>(cacheKey)
    
    if (cached && !cached.isStale) {
      return cached.data
    }

    const data = await nodeApi.getAll(mindMapId, hierarchical)
    apiCache.set(cacheKey, data, { ttl: 2 * 60 * 1000 }) // 2 min cache
    return data
  },

  create: async (mindMapId: string, data: CreateNodeDto): Promise<Node> => {
    const result = await nodeApi.create(mindMapId, data)
    
    // Invalidate nodes list cache
    apiCache.invalidatePattern(`nodes:${mindMapId}:`)
    
    // Optimistically add to cached list if exists
    const cacheKey = cacheKeys.nodes.byMindMapId(mindMapId)
    const cached = apiCache.get<Node[]>(cacheKey)
    if (cached) {
      apiCache.set(cacheKey, [...cached.data, result])
    }
    
    return result
  },

  update: async (id: string, data: UpdateNodeDto): Promise<Node> => {
    const result = await nodeApi.update(id, data)
    
    // Update node in any cached lists
    apiCache.invalidatePattern('nodes:.*:')
    
    return result
  },

  delete: async (id: string): Promise<void> => {
    await nodeApi.delete(id)
    
    // Invalidate all node caches (since we need to handle parent-child relationships)
    apiCache.invalidatePattern('nodes:')
  },

  batchUpdate: async (
    mindMapId: string,
    updates: Array<{ id: string; positionX?: number; positionY?: number }>
  ): Promise<Node[]> => {
    const result = await nodeApi.batchUpdate(mindMapId, updates)
    
    // Invalidate node caches for this mind map
    apiCache.invalidatePattern(`nodes:${mindMapId}:`)
    
    return result
  },
}

// Cached Canvas API
export const cachedCanvasApi = {
  get: async (mindMapId: string): Promise<CanvasState> => {
    const cacheKey = cacheKeys.canvas.byMindMapId(mindMapId)
    const cached = apiCache.get<CanvasState>(cacheKey)
    
    if (cached && !cached.isStale) {
      return cached.data
    }

    const data = await canvasApi.get(mindMapId)
    apiCache.set(cacheKey, data, { ttl: 10 * 60 * 1000 }) // 10 min cache
    return data
  },

  update: async (mindMapId: string, data: UpdateCanvasDto): Promise<CanvasState> => {
    // Optimistic update for smooth pan/zoom
    const cacheKey = cacheKeys.canvas.byMindMapId(mindMapId)
    const optimistic = optimisticUpdate<CanvasState>(
      cacheKey,
      (current) => ({ ...current, ...data, updatedAt: new Date().toISOString() })
    )

    try {
      const result = await canvasApi.update(mindMapId, data)
      apiCache.set(cacheKey, result, { ttl: 10 * 60 * 1000 })
      return result
    } catch (error) {
      if (optimistic) {
        apiCache.invalidate(cacheKey)
      }
      throw error
    }
  },

  reset: async (mindMapId: string, centerOnNodes = false): Promise<CanvasState> => {
    const result = await canvasApi.reset(mindMapId, centerOnNodes)
    apiCache.set(cacheKeys.canvas.byMindMapId(mindMapId), result)
    return result
  },
}

