import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  safeCache, 
  defensiveOptimisticUpdate, 
  ConflictError, 
  StaleDataError,
  safeBatchInvalidate,
  retryWithBackoff,
  getNetworkState
} from './defensiveCache'
import { apiCache } from './cache'

describe('Defensive Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiCache.clear()
  })

  describe('safeCache', () => {
    it('should prevent duplicate requests for the same key', async () => {
      const fetcher = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 1, data: 'test' }), 100))
      )

      // Start two requests simultaneously
      const promise1 = safeCache('test-key', fetcher)
      const promise2 = safeCache('test-key', fetcher)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Should only call fetcher once
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('should validate version and throw on stale data', async () => {
      const onStaleData = vi.fn()
      
      // First, cache some data with version 2
      await safeCache('version-test', 
        () => Promise.resolve({ id: 1, version: 2 }),
        { validateVersion: (data) => data.version }
      )

      // Clear cache to force re-fetch
      apiCache.invalidate('version-test')

      // Now try to cache older version
      await expect(
        safeCache('version-test',
          () => Promise.resolve({ id: 1, version: 1 }),
          { 
            validateVersion: (data) => data.version,
            onStaleData
          }
        )
      ).rejects.toThrow(StaleDataError)

      expect(onStaleData).toHaveBeenCalled()
    })

    it('should handle cache miss gracefully', async () => {
      const fetcher = vi.fn().mockResolvedValue({ id: 1, data: 'fresh' })

      const result = await safeCache('new-key', fetcher, { ttl: 5000 })

      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ id: 1, data: 'fresh' })
    })

    it('should use cached data when available', async () => {
      const fetcher = vi.fn().mockResolvedValue({ id: 1, data: 'test' })

      // First call should fetch
      await safeCache('cached-key', fetcher, { ttl: 10000 })
      
      // Second call should use cache
      const result = await safeCache('cached-key', fetcher)

      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ id: 1, data: 'test' })
    })
  })

  describe('defensiveOptimisticUpdate', () => {
    it('should apply optimistic update and validate', async () => {
      const key = 'optimistic-test'
      const originalData = { id: 1, name: 'Original', version: 1 }
      
      // Set up initial cache
      apiCache.set(key, {
        data: originalData,
        metadata: { version: 1, timestamp: Date.now() }
      })

      const validator = vi.fn().mockResolvedValue({ 
        id: 1, 
        name: 'Updated', 
        version: 2 
      })

      const result = await defensiveOptimisticUpdate(
        key,
        (current) => ({ ...current, name: 'Updated', version: 2 }),
        validator
      )

      expect(result).toEqual({ id: 1, name: 'Updated', version: 2 })
      expect(validator).toHaveBeenCalled()
    })

    it('should rollback on validation failure', async () => {
      const key = 'rollback-test'
      const originalData = { id: 1, name: 'Original', version: 1 }
      const onRollback = vi.fn()
      
      apiCache.set(key, {
        data: originalData,
        metadata: { version: 1, timestamp: Date.now() }
      })

      const validator = vi.fn().mockRejectedValue(new Error('Validation failed'))

      await expect(
        defensiveOptimisticUpdate(
          key,
          (current) => ({ ...current, name: 'Updated' }),
          validator,
          { onRollback }
        )
      ).rejects.toThrow('Validation failed')

      expect(onRollback).toHaveBeenCalled()
      
      // Check that cache was rolled back
      const cached = apiCache.get(key)
      expect(cached?.data.data).toEqual(originalData)
    })

    it('should detect and handle version conflicts', async () => {
      const key = 'conflict-test'
      const originalData = { id: 1, name: 'Original', version: 1 }
      
      apiCache.set(key, {
        data: originalData,
        metadata: { version: 1, timestamp: Date.now() }
      })

      // Server returns version 3 (skipping version 2)
      const validator = vi.fn().mockResolvedValue({ 
        id: 1, 
        name: 'Server Update', 
        version: 3 
      })

      await expect(
        defensiveOptimisticUpdate(
          key,
          (current) => ({ ...current, name: 'Client Update', version: 2 }),
          validator
        )
      ).rejects.toThrow(ConflictError)
    })

    it('should use custom conflict resolver', async () => {
      const key = 'conflict-resolver-test'
      const originalData = { id: 1, name: 'Original', count: 5, version: 1 }
      
      apiCache.set(key, {
        data: originalData,
        metadata: { version: 1, timestamp: Date.now() }
      })

      const validator = vi.fn().mockResolvedValue({ 
        id: 1, 
        name: 'Server', 
        count: 10,
        version: 3 
      })

      const onConflict = vi.fn().mockImplementation((serverData, localData) => ({
        ...serverData,
        count: serverData.count + (localData.count - originalData.count)
      }))

      const result = await defensiveOptimisticUpdate(
        key,
        (current) => ({ ...current, name: 'Client', count: 8, version: 2 }),
        validator,
        { onConflict }
      )

      expect(onConflict).toHaveBeenCalled()
      expect(result.count).toBe(13) // 10 + (8 - 5)
    })
  })

  describe('safeBatchInvalidate', () => {
    it('should invalidate multiple patterns', () => {
      // Set up some cache entries
      apiCache.set('nodes:1:flat', { data: 'test1' })
      apiCache.set('nodes:1:hierarchical', { data: 'test2' })
      apiCache.set('nodes:2:flat', { data: 'test3' })
      apiCache.set('canvas:1', { data: 'test4' })

      safeBatchInvalidate(['nodes:1:', 'canvas:'])

      expect(apiCache.get('nodes:1:flat')).toBeNull()
      expect(apiCache.get('nodes:1:hierarchical')).toBeNull()
      expect(apiCache.get('nodes:2:flat')).not.toBeNull()
      expect(apiCache.get('canvas:1')).toBeNull()
    })
  })

  describe('retryWithBackoff', () => {
    it('should retry failed operations', async () => {
      let attempts = 0
      const operation = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ success: true })
      })

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10
      })

      expect(operation).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ success: true })
    })

    it('should respect maxRetries limit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        retryWithBackoff(operation, {
          maxRetries: 2,
          initialDelay: 10
        })
      ).rejects.toThrow('Network error')

      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Invalid input'))

      await expect(
        retryWithBackoff(operation, {
          maxRetries: 3,
          initialDelay: 10,
          shouldRetry: (error) => error.message.includes('Network')
        })
      ).rejects.toThrow('Invalid input')

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should apply exponential backoff', async () => {
      let attempts = 0
      const delays: number[] = []
      const startTime = Date.now()
      
      const operation = vi.fn().mockImplementation(() => {
        attempts++
        delays.push(Date.now() - startTime)
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ success: true })
      })

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100
      })

      expect(operation).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ success: true })
      
      // Check that delays are increasing (roughly exponential)
      expect(delays[1]).toBeGreaterThanOrEqual(10) // First retry after ~10ms
      expect(delays[2]).toBeGreaterThanOrEqual(20) // Second retry after ~20ms
    })
  })

  describe('Network state detection', () => {
    it('should detect online state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      expect(getNetworkState()).toBe(true)
    })

    it('should detect offline state', () => {
      // Mock navigator.onLine as false
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        writable: true,
        value: false
      })

      // The defensive cache checks navigator.onLine directly
      expect(getNetworkState()).toBe(false)
      
      // Clean up
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        writable: true,
        value: true
      })
    })
  })
})

describe('Edge cases and error scenarios', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  it('should handle concurrent updates to the same resource', async () => {
    const key = 'concurrent-test'
    const initialData = { id: 1, value: 0, version: 1 }
    
    apiCache.set(key, {
      data: initialData,
      metadata: { version: 1, timestamp: Date.now() }
    })

    let callCount = 0
    const validator = vi.fn().mockImplementation(async () => {
      callCount++
      // First call returns version 2, second returns version 3
      return { id: 1, value: callCount * 10, version: callCount + 1 }
    })

    // Start two updates concurrently
    const promise1 = defensiveOptimisticUpdate(
      key,
      (current) => ({ ...current, value: current.value + 1, version: 2 }),
      validator
    )

    const promise2 = defensiveOptimisticUpdate(
      key,
      (current) => ({ ...current, value: current.value + 2, version: 2 }),
      validator
    )

    const results = await Promise.allSettled([promise1, promise2])
    
    // Both calls should complete (one might have conflict)
    expect(validator).toHaveBeenCalledTimes(2)
    
    // At least one should succeed
    const successes = results.filter(r => r.status === 'fulfilled')
    expect(successes.length).toBeGreaterThan(0)
  })

  it('should handle cache expiry during optimistic update', async () => {
    const key = 'expiry-test'
    const data = { id: 1, name: 'Test', version: 1 }
    
    // Set cache with short TTL
    apiCache.set(key, {
      data,
      metadata: { version: 1, timestamp: Date.now() }
    }, { ttl: 100 })

    const validator = vi.fn().mockResolvedValue({ id: 1, name: 'Updated', version: 2 })

    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 110))

    // Now attempt update - cache should be expired
    const result = await defensiveOptimisticUpdate(
      key,
      (current) => ({ ...current, name: 'Optimistic' }),
      validator
    )

    // Should just call validator since cache was expired
    expect(validator).toHaveBeenCalled()
    expect(result).toEqual({ id: 1, name: 'Updated', version: 2 })
  })
})