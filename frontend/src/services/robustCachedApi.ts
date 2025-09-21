import { mindMapApi, nodeApi, canvasApi } from './api'
import { cacheKeys } from './cache'
import { 
  safeCache, 
  defensiveOptimisticUpdate, 
  safeBatchInvalidate,
  retryWithBackoff,
  ConflictError,
  getNetworkState
} from './defensiveCache'
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

// Error recovery strategies
const handleNetworkError = (error: Error, operation: string) => {
  if (!getNetworkState()) {
    throw new Error(`Cannot ${operation} while offline. Please check your connection.`)
  }
  throw error
}

// Robust Cached Mind Map API
export const robustCachedMindMapApi = {
  getAll: async (): Promise<MindMap[]> => {
    const result = await safeCache(
      cacheKeys.mindMaps.all(),
      async () => {
        const response = await retryWithBackoff(
          () => mindMapApi.getAll(),
          { maxRetries: 3 }
        )
        return Array.isArray(response) ? response : response.data
      },
      { ttl: 5 * 60 * 1000 }
    )
    return result as MindMap[]
  },

  getById: async (id: string, includes?: string[]): Promise<MindMap> => {
    return safeCache(
      cacheKeys.mindMaps.byId(id),
      async () => {
        return retryWithBackoff(
          () => mindMapApi.getById(id, includes),
          { maxRetries: 2 }
        )
      },
      { 
        ttl: 2 * 60 * 1000,
        validateVersion: (data) => data.version
      }
    )
  },

  create: async (data: CreateMindMapDto): Promise<MindMap> => {
    try {
      const result = await retryWithBackoff(
        () => mindMapApi.create(data),
        { maxRetries: 2 }
      )
      
      // Invalidate list cache
      safeBatchInvalidate([cacheKeys.mindMaps.all()])
      
      return result
    } catch (error) {
      handleNetworkError(error as Error, 'create mind map')
      throw error
    }
  },

  update: async (id: string, data: UpdateMindMapDto): Promise<MindMap> => {
    const key = cacheKeys.mindMaps.byId(id)
    
    return defensiveOptimisticUpdate(
      key,
      (current) => ({
        ...current,
        ...data,
        version: (current.version || 0) + 1,
        updatedAt: new Date().toISOString()
      }),
      async () => {
        const result = await retryWithBackoff(
          () => mindMapApi.update(id, data),
          { maxRetries: 2 }
        )
        safeBatchInvalidate([cacheKeys.mindMaps.all()])
        return result
      },
      {
        onConflict: (serverData, localData) => {
          // Prefer server data but preserve any local-only fields
          console.warn('Mind map version conflict detected, using server version')
          return {
            ...localData,
            ...serverData,
            _localChanges: localData
          }
        },
        onRollback: (error) => {
          console.error('Failed to update mind map, rolling back:', error)
        }
      }
    )
  },

  delete: async (id: string): Promise<void> => {
    try {
      await retryWithBackoff(
        () => mindMapApi.delete(id),
        { maxRetries: 2 }
      )
      
      // Clear all related caches
      safeBatchInvalidate([
        cacheKeys.mindMaps.byId(id),
        cacheKeys.mindMaps.all(),
        `nodes:${id}`,
        `canvas:${id}`
      ])
    } catch (error) {
      handleNetworkError(error as Error, 'delete mind map')
      throw error
    }
  },
}

// Robust Cached Node API
export const robustCachedNodeApi = {
  getAll: async (mindMapId: string, hierarchical = false): Promise<Node[]> => {
    return safeCache(
      cacheKeys.nodes.byMindMapId(mindMapId, hierarchical),
      async () => {
        return retryWithBackoff(
          () => nodeApi.getAll(mindMapId, hierarchical),
          { maxRetries: 2 }
        )
      },
      { ttl: 2 * 60 * 1000 }
    )
  },

  create: async (mindMapId: string, data: CreateNodeDto): Promise<Node> => {
    try {
      const result = await retryWithBackoff(
        () => nodeApi.create(mindMapId, data),
        { maxRetries: 2 }
      )
      
      // Invalidate nodes list cache
      safeBatchInvalidate([`nodes:${mindMapId}:`])
      
      // Update parent mind map version
      safeBatchInvalidate([cacheKeys.mindMaps.byId(mindMapId)])
      
      return result
    } catch (error) {
      handleNetworkError(error as Error, 'create node')
      throw error
    }
  },

  update: async (id: string, data: UpdateNodeDto): Promise<Node> => {
    // For node updates, we don't do optimistic updates because
    // they can affect the visual layout significantly
    try {
      const result = await retryWithBackoff(
        () => nodeApi.update(id, data),
        { 
          maxRetries: 2,
          shouldRetry: (error) => {
            // Don't retry validation errors
            if (error.message.includes('Invalid') || 
                error.message.includes('Validation')) {
              return false
            }
            return true
          }
        }
      )
      
      // Invalidate all node caches
      safeBatchInvalidate(['nodes:'])
      
      return result
    } catch (error) {
      handleNetworkError(error as Error, 'update node')
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await retryWithBackoff(
        () => nodeApi.delete(id),
        { maxRetries: 2 }
      )
      
      // Invalidate all node caches (handles parent-child relationships)
      safeBatchInvalidate(['nodes:'])
    } catch (error) {
      handleNetworkError(error as Error, 'delete node')
      throw error
    }
  },

  batchUpdate: async (
    mindMapId: string,
    updates: Array<{ id: string; positionX?: number; positionY?: number }>
  ): Promise<Node[]> => {
    // Batch updates are critical for performance, so we use optimistic updates
    const key = cacheKeys.nodes.byMindMapId(mindMapId, false)
    
    return defensiveOptimisticUpdate(
      key,
      (currentNodes: any) => {
        const updateMap = new Map(updates.map(u => [u.id, u]))
        return currentNodes.map((node: any) => {
          const update = updateMap.get(node.id)
          if (update) {
            return {
              ...node,
              positionX: update.positionX ?? node.positionX,
              positionY: update.positionY ?? node.positionY,
              updatedAt: new Date().toISOString()
            }
          }
          return node
        })
      },
      async () => {
        return retryWithBackoff(
          () => nodeApi.batchUpdate(mindMapId, updates),
          { maxRetries: 1 } // Less retries for batch operations
        )
      },
      {
        onRollback: (error) => {
          console.error('Failed to batch update nodes, positions rolled back:', error)
        }
      }
    )
  },
}

// Robust Cached Canvas API
export const robustCachedCanvasApi = {
  get: async (mindMapId: string): Promise<CanvasState> => {
    return safeCache(
      cacheKeys.canvas.byMindMapId(mindMapId),
      async () => {
        return retryWithBackoff(
          () => canvasApi.get(mindMapId),
          { maxRetries: 2 }
        )
      },
      { ttl: 10 * 60 * 1000 }
    )
  },

  update: async (mindMapId: string, data: UpdateCanvasDto): Promise<CanvasState> => {
    // Canvas updates (pan/zoom) should be highly responsive
    const key = cacheKeys.canvas.byMindMapId(mindMapId)
    
    // Don't retry canvas updates - they're frequent and non-critical
    return defensiveOptimisticUpdate(
      key,
      (current: any) => ({
        ...current,
        ...data,
        updatedAt: new Date().toISOString()
      }),
      async () => {
        // No retry for canvas updates - if it fails, user can just pan/zoom again
        return canvasApi.update(mindMapId, data)
      },
      {
        onRollback: () => {
          // Silent rollback for canvas - user will just see the old position
        }
      }
    )
  },

  reset: async (mindMapId: string, centerOnNodes = false): Promise<CanvasState> => {
    try {
      const result = await retryWithBackoff(
        () => canvasApi.reset(mindMapId, centerOnNodes),
        { maxRetries: 2 }
      )
      
      // Update cache with reset state
      safeBatchInvalidate([cacheKeys.canvas.byMindMapId(mindMapId)])
      
      return result
    } catch (error) {
      handleNetworkError(error as Error, 'reset canvas')
      throw error
    }
  },
}

// Notification helpers for the UI layer
export interface ApiNotification {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: any
}

export class ApiNotificationEmitter extends EventTarget {
  emit(notification: ApiNotification) {
    this.dispatchEvent(new CustomEvent('notification', { detail: notification }))
  }
}

export const apiNotifications = new ApiNotificationEmitter()

// Wrap API errors with user-friendly messages
export function wrapWithNotifications<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  successMessage?: string,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await fn(...args)
      if (successMessage) {
        apiNotifications.emit({
          type: 'success',
          message: successMessage
        })
      }
      return result
    } catch (error) {
      const message = errorMessage || 'An error occurred'
      
      if (error instanceof ConflictError) {
        apiNotifications.emit({
          type: 'warning',
          message: 'Your changes conflicted with another update. The latest version has been loaded.',
          details: error
        })
      } else if (!getNetworkState()) {
        apiNotifications.emit({
          type: 'error',
          message: 'You are currently offline. Please check your connection.',
          details: error
        })
      } else {
        apiNotifications.emit({
          type: 'error',
          message,
          details: error
        })
      }
      
      throw error
    }
  }) as T
}