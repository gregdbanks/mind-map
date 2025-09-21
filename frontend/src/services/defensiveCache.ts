import { apiCache } from './cache'

export interface CacheMetadata {
  version: number
  timestamp: number
  etag?: string
}

export interface CachedData<T> {
  data: T
  metadata: CacheMetadata
}

export class ConflictError extends Error {
  constructor(
    message: string,
    public serverData: any,
    public localData: any,
    public operation: string
  ) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class StaleDataError extends Error {
  constructor(message: string, public cachedVersion: number, public serverVersion: number) {
    super(message)
    this.name = 'StaleDataError'
  }
}

// Track ongoing requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

// Version tracking for optimistic updates
const versionTracker = new Map<string, number>()

export function getCachedVersion(key: string): number {
  return versionTracker.get(key) || 0
}

export function updateCachedVersion(key: string, version: number): void {
  versionTracker.set(key, version)
}

// Defensive wrapper for cache operations
export async function safeCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    validateVersion?: (data: T) => number
    onConflict?: (error: ConflictError) => void
    onStaleData?: (error: StaleDataError) => void
  } = {}
): Promise<T> {
  // Check if we have a pending request for this key
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending
  }

  // Check cache first
  const cached = apiCache.get<CachedData<T>>(key)
  if (cached && !cached.isStale) {
    // For already cached data, we still need to validate version if requested
    if (options.validateVersion && cached.data.metadata) {
      const cachedVersion = cached.data.metadata.version
      const currentTrackedVersion = getCachedVersion(key)
      
      // Only return cached if version is current
      if (currentTrackedVersion > 0 && cachedVersion >= currentTrackedVersion) {
        return cached.data.data
      }
    } else {
      return cached.data.data
    }
  }

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      const data = await fetcher()
      
      // Validate version if provided
      if (options.validateVersion) {
        const serverVersion = options.validateVersion(data)
        const cachedVersion = getCachedVersion(key)
        
        if (cachedVersion > 0 && serverVersion < cachedVersion) {
          const error = new StaleDataError(
            'Server data is older than cached version',
            cachedVersion,
            serverVersion
          )
          if (options.onStaleData) {
            options.onStaleData(error)
          }
          throw error
        }
        
        updateCachedVersion(key, serverVersion)
      }

      // Cache the result with metadata
      const cachedData: CachedData<T> = {
        data,
        metadata: {
          version: options.validateVersion ? options.validateVersion(data) : 0,
          timestamp: Date.now(),
        }
      }
      
      apiCache.set(key, cachedData, { ttl: options.ttl })
      return data
    } finally {
      // Clean up pending request
      pendingRequests.delete(key)
    }
  })()

  // Track the pending request
  pendingRequests.set(key, fetchPromise)
  
  return fetchPromise
}

// Defensive optimistic update
export async function defensiveOptimisticUpdate<T extends { version?: number }>(
  key: string,
  updater: (current: T) => T,
  validator: () => Promise<T>,
  options: {
    onRollback?: (error: Error) => void
    onConflict?: (serverData: T, localData: T) => T
  } = {}
): Promise<T> {
  const cached = apiCache.get<CachedData<T>>(key)
  if (!cached) {
    // No cached data, just perform the update
    return validator()
  }

  const originalData = cached.data.data
  const optimisticData = updater(originalData)
  
  // Store optimistic update
  const optimisticCached: CachedData<T> = {
    data: optimisticData,
    metadata: {
      ...cached.data.metadata,
      timestamp: Date.now(),
    }
  }
  apiCache.set(key, optimisticCached, { ttl: 60000 }) // Short TTL for optimistic updates

  try {
    // Validate with server
    const serverData = await validator()
    
    // Check for conflicts
    if (serverData.version && originalData.version && 
        serverData.version !== originalData.version + 1) {
      
      if (options.onConflict) {
        // Allow custom conflict resolution
        const resolved = options.onConflict(serverData, optimisticData)
        const resolvedCached: CachedData<T> = {
          data: resolved,
          metadata: {
            version: resolved.version || 0,
            timestamp: Date.now(),
          }
        }
        apiCache.set(key, resolvedCached)
        return resolved
      } else {
        throw new ConflictError(
          'Version conflict detected',
          serverData,
          optimisticData,
          'update'
        )
      }
    }
    
    // Update cache with server response
    const serverCached: CachedData<T> = {
      data: serverData,
      metadata: {
        version: serverData.version || 0,
        timestamp: Date.now(),
      }
    }
    apiCache.set(key, serverCached)
    return serverData
  } catch (error) {
    // Rollback optimistic update
    const rollbackCached: CachedData<T> = {
      data: originalData,
      metadata: cached.data.metadata,
    }
    apiCache.set(key, rollbackCached)
    
    if (options.onRollback) {
      options.onRollback(error as Error)
    }
    
    throw error
  }
}

// Batch invalidation with safety checks
export function safeBatchInvalidate(patterns: string[]): Set<string> {
  const invalidatedKeys = new Set<string>()
  
  patterns.forEach(pattern => {
    // Track what we're invalidating for debugging
    const regex = new RegExp(pattern)
    pendingRequests.forEach((_, key) => {
      if (regex.test(key)) {
        invalidatedKeys.add(key)
      }
    })
    
    apiCache.invalidatePattern(pattern)
  })
  
  // Clear any pending requests for invalidated keys
  invalidatedKeys.forEach(key => {
    pendingRequests.delete(key)
  })
  
  return invalidatedKeys
}

// Network state detection
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true
    // Could trigger background sync here
  })

  window.addEventListener('offline', () => {
    isOnline = false
  })
}

export function getNetworkState(): boolean {
  // Always check current navigator state in test environment
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return isOnline
}

// Retry logic for failed requests
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    shouldRetry?: (error: Error) => boolean
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3
  const initialDelay = options.initialDelay ?? 1000
  const maxDelay = options.maxDelay ?? 10000
  const shouldRetry = options.shouldRetry ?? ((error) => !isOnline || error.message.includes('Network'))

  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (!shouldRetry(lastError) || attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}