import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SimpleCache, cacheKeys, optimisticUpdate } from './cache'

describe('SimpleCache', () => {
  let cache: SimpleCache

  beforeEach(() => {
    cache = new SimpleCache()
  })

  it('should store and retrieve data', () => {
    const data = { id: '1', name: 'Test' }
    cache.set('test-key', data)

    const result = cache.get('test-key')
    expect(result).not.toBeNull()
    expect(result?.data).toEqual(data)
    expect(result?.isStale).toBe(false)
  })

  it('should expire data after TTL', () => {
    vi.useFakeTimers()
    
    const data = { id: '1', name: 'Test' }
    cache.set('test-key', data, { ttl: 1000 }) // 1 second TTL

    // Data should be fresh immediately
    expect(cache.get('test-key')).not.toBeNull()

    // Advance time past TTL
    vi.advanceTimersByTime(1001)

    // Data should be expired
    expect(cache.get('test-key')).toBeNull()

    vi.useRealTimers()
  })

  it('should invalidate specific keys', () => {
    cache.set('key1', { data: 1 })
    cache.set('key2', { data: 2 })

    cache.invalidate('key1')

    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).not.toBeNull()
  })

  it('should invalidate by pattern', () => {
    cache.set('mindmaps:1', { data: 1 })
    cache.set('mindmaps:2', { data: 2 })
    cache.set('nodes:1', { data: 3 })

    cache.invalidatePattern('mindmaps:')

    expect(cache.get('mindmaps:1')).toBeNull()
    expect(cache.get('mindmaps:2')).toBeNull()
    expect(cache.get('nodes:1')).not.toBeNull()
  })

  it('should clear all data', () => {
    cache.set('key1', { data: 1 })
    cache.set('key2', { data: 2 })

    cache.clear()

    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBeNull()
  })
})

describe('cacheKeys', () => {
  it('should generate correct cache keys', () => {
    expect(cacheKeys.mindMaps.all()).toBe('mindmaps:all')
    expect(cacheKeys.mindMaps.byId('123')).toBe('mindmaps:123')
    expect(cacheKeys.nodes.byMindMapId('123', true)).toBe('nodes:123:hierarchical')
    expect(cacheKeys.nodes.byMindMapId('123', false)).toBe('nodes:123:flat')
    expect(cacheKeys.canvas.byMindMapId('123')).toBe('canvas:123')
  })
})

describe('optimisticUpdate', () => {
  let cache: SimpleCache

  beforeEach(() => {
    // Create a new cache instance for testing
    cache = new SimpleCache()
  })

  it('should perform optimistic updates', () => {
    const original = { id: '1', name: 'Original' }
    cache.set('test-key', original)

    const updated = optimisticUpdate<typeof original>('test-key', (current) => ({
      ...current,
      name: 'Updated'
    }), cache)

    expect(updated).toEqual({ id: '1', name: 'Updated' })
    
    // Should update cache
    const cached = cache.get('test-key')
    expect(cached?.data).toEqual({ id: '1', name: 'Updated' })
  })

  it('should return null if no cached data', () => {
    const updated = optimisticUpdate<any>('non-existent', (current) => ({
      ...current,
      updated: true
    }))

    expect(updated).toBeNull()
  })
})