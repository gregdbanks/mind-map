interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
}

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.defaultTTL
    const now = Date.now()
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const isStale = now > entry.expiresAt

    // If stale, we could return stale data while revalidating
    if (isStale) {
      this.cache.delete(key)
      return null
    }

    return {
      data: entry.data,
      isStale: false,
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

// Singleton instance
export const apiCache = new SimpleCache()

// Cache key builders
export const cacheKeys = {
  mindMaps: {
    all: () => 'mindmaps:all',
    byId: (id: string) => `mindmaps:${id}`,
  },
  nodes: {
    byMindMapId: (mindMapId: string, hierarchical = false) => 
      `nodes:${mindMapId}:${hierarchical ? 'hierarchical' : 'flat'}`,
    byId: (id: string) => `nodes:${id}`,
  },
  canvas: {
    byMindMapId: (mindMapId: string) => `canvas:${mindMapId}`,
  },
}

// Helper for optimistic updates
export function optimisticUpdate<T>(
  key: string,
  updater: (current: T) => T,
  cache: SimpleCache = apiCache
): T | null {
  const cached = cache.get<T>(key)
  if (!cached) return null

  const updated = updater(cached.data)
  cache.set(key, updated, { ttl: 60000 }) // Short TTL for optimistic updates
  return updated
}