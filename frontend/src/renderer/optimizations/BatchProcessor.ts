import { Node, Connection, BatchUpdate } from '../types'

interface BatchOperation {
  type: 'create' | 'update' | 'delete'
  target: 'node' | 'connection'
  data: any
  timestamp: number
}

export class BatchProcessor {
  private queue: BatchOperation[] = []
  private batchSize: number = 50
  private batchDelay: number = 16 // ~1 frame at 60fps
  private timeoutId: number | null = null
  private processing: boolean = false
  private onBatchProcess: (operations: BatchOperation[]) => void
  
  constructor(onBatchProcess: (operations: BatchOperation[]) => void, options?: {
    batchSize?: number
    batchDelay?: number
  }) {
    this.onBatchProcess = onBatchProcess
    this.batchSize = options?.batchSize || this.batchSize
    this.batchDelay = options?.batchDelay || this.batchDelay
  }
  
  /**
   * Add operation to batch queue
   */
  add(operation: BatchOperation): void {
    this.queue.push(operation)
    
    // Process immediately if queue is full
    if (this.queue.length >= this.batchSize) {
      this.processBatch()
    } else {
      // Otherwise, schedule batch processing
      this.scheduleBatch()
    }
  }
  
  /**
   * Add multiple operations
   */
  addMany(operations: BatchOperation[]): void {
    this.queue.push(...operations)
    
    if (this.queue.length >= this.batchSize) {
      this.processBatch()
    } else {
      this.scheduleBatch()
    }
  }
  
  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.timeoutId !== null) return
    
    this.timeoutId = window.setTimeout(() => {
      this.processBatch()
    }, this.batchDelay)
  }
  
  /**
   * Process queued operations
   */
  private processBatch(): void {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    
    // Take operations from queue
    const operations = this.queue.splice(0, this.batchSize)
    
    // Optimize operations
    const optimized = this.optimizeOperations(operations)
    
    // Process batch
    this.onBatchProcess(optimized)
    
    this.processing = false
    
    // Process remaining items if any
    if (this.queue.length > 0) {
      this.scheduleBatch()
    }
  }
  
  /**
   * Optimize operations by removing redundant updates
   */
  private optimizeOperations(operations: BatchOperation[]): BatchOperation[] {
    const nodeOps = new Map<string, BatchOperation>()
    const connOps = new Map<string, BatchOperation>()
    const optimized: BatchOperation[] = []
    
    // Process operations in order
    for (const op of operations) {
      if (op.target === 'node') {
        const nodeId = op.data.id
        
        if (op.type === 'delete') {
          // Delete cancels all previous operations
          nodeOps.delete(nodeId)
          nodeOps.set(nodeId, op)
        } else if (op.type === 'create') {
          // Create replaces any previous operations
          nodeOps.set(nodeId, op)
        } else if (op.type === 'update') {
          const existing = nodeOps.get(nodeId)
          
          if (!existing) {
            nodeOps.set(nodeId, op)
          } else if (existing.type === 'create') {
            // Merge update into create
            existing.data = { ...existing.data, ...op.data }
          } else if (existing.type === 'update') {
            // Merge updates
            existing.data = { ...existing.data, ...op.data }
          }
          // If existing is delete, ignore update
        }
      } else if (op.target === 'connection') {
        const connId = op.data.id
        
        if (op.type === 'delete') {
          connOps.delete(connId)
          connOps.set(connId, op)
        } else {
          connOps.set(connId, op)
        }
      }
    }
    
    // Convert back to array, preserving order
    nodeOps.forEach(op => optimized.push(op))
    connOps.forEach(op => optimized.push(op))
    
    return optimized
  }
  
  /**
   * Force immediate processing
   */
  flush(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    
    while (this.queue.length > 0) {
      this.processBatch()
    }
  }
  
  /**
   * Clear pending operations
   */
  clear(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    
    this.queue = []
  }
  
  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }
  
  /**
   * Create batch operations for nodes
   */
  static createNodeBatch(nodes: Node[], type: 'create' | 'update' | 'delete'): BatchOperation[] {
    return nodes.map(node => ({
      type,
      target: 'node' as const,
      data: node,
      timestamp: Date.now()
    }))
  }
  
  /**
   * Create batch operations for connections
   */
  static createConnectionBatch(connections: Connection[], type: 'create' | 'update' | 'delete'): BatchOperation[] {
    return connections.map(conn => ({
      type,
      target: 'connection' as const,
      data: conn,
      timestamp: Date.now()
    }))
  }
  
  /**
   * Merge multiple batch updates
   */
  static mergeBatchUpdates(updates: BatchUpdate[]): BatchUpdate[] {
    const merged = new Map<string, BatchUpdate>()
    
    for (const update of updates) {
      if (!update.id) continue
      
      const existing = merged.get(update.id)
      if (existing) {
        // Merge updates
        merged.set(update.id, { ...existing, ...update })
      } else {
        merged.set(update.id, update)
      }
    }
    
    return Array.from(merged.values())
  }
}