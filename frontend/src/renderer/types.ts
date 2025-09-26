// Core data types
export interface Node {
  id: string
  text: string
  positionX: number
  positionY: number
  parentId?: string
  children?: string[]
  style?: NodeStyle
  metadata?: Record<string, any>
}

export interface NodeStyle {
  fontSize?: number
  color?: string | number
  backgroundColor?: string | number
  fontWeight?: string
  fontStyle?: string
  borderColor?: string | number
  borderWidth?: number
}

export interface Connection {
  id: string
  parentId: string
  childId: string
  style?: ConnectionStyle
}

export interface ConnectionStyle {
  color?: number
  width?: number
  alpha?: number
  curveStrength?: number
}

export interface Viewport {
  x: number
  y: number
  zoom: number
  rotation: number
}

// Performance metrics
export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  nodeCount: number
  visibleNodeCount: number
  memoryUsage: number
}

// Export options
export interface ExportOptions {
  format?: 'png' | 'jpg' | 'svg'
  quality?: number
  background?: 'white' | 'transparent' | string
  scale?: number
  bounds?: 'viewport' | 'all' | 'selection'
}

// Interaction events
export interface InteractionEvent {
  nodeId?: string
  position: { x: number; y: number }
  worldPosition?: { x: number; y: number }
  delta?: { x: number; y: number }
  multi?: boolean
  selectedNodes?: string[]
  originalEvent?: any
}

// Batch update
export interface BatchUpdate extends Partial<Node> {
  id?: string
}

// Renderer API
export interface RendererAPI {
  // Initialization
  initialize(container: HTMLElement): Promise<void>
  destroy(): void
  
  // Node operations
  createNode(node: Node): void
  updateNode(id: string, updates: Partial<Node>): void
  deleteNode(id: string): void
  selectNode(id: string, multi?: boolean): void
  clearSelection(): void
  
  // Connection operations
  createConnection(connection: Connection): void
  updateConnection(id: string, updates: Partial<Connection>): void
  deleteConnection(id: string): void
  
  // Batch operations
  batchUpdateNodes(updates: BatchUpdate[]): void
  
  // Viewport operations
  getViewport(): Viewport
  setViewport(viewport: Viewport): void
  panBy(deltaX: number, deltaY: number): void
  zoomBy(delta: number, center?: { x: number; y: number }): void
  resetViewport(): void
  
  // Export
  exportCanvas(options: ExportOptions): Promise<Blob>
  
  // Performance
  getPerformanceMetrics(): PerformanceMetrics
  
  // Events
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
}

// Factory function type
export type RendererFactory = () => RendererAPI