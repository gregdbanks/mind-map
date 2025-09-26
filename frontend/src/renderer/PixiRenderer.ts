import * as PIXI from 'pixi.js'
import { 
  RendererAPI, 
  Node, 
  Connection, 
  Viewport, 
  ExportOptions, 
  PerformanceMetrics,
  InteractionEvent,
  BatchUpdate
} from './types'
import { SimplePixiNode } from './SimplePixiNode'
import { PixiConnection } from './PixiConnection'
import { SimpleConnection } from './SimpleConnection'
import { ViewportController } from './ViewportController'
import { InteractionManager } from './InteractionManager'
import { PerformanceMonitor } from './PerformanceMonitor'

export class PixiRenderer implements RendererAPI {
  private app: PIXI.Application<HTMLCanvasElement>
  private container: HTMLElement
  private nodeContainer: PIXI.Container
  private connectionContainer: PIXI.Container
  private nodes: Map<string, SimplePixiNode>
  private connections: Map<string, SimpleConnection>
  private viewport: ViewportController
  private interactionManager: InteractionManager
  private performanceMonitor: PerformanceMonitor
  private selectedNodes: Set<string>
  private eventHandlers: Map<string, Set<Function>>
  private renderMode: 'webgl' | 'canvas2d'
  private worldBounds?: { minX: number; minY: number; maxX: number; maxY: number }
  private gridSnapping: number = 0

  constructor() {
    this.nodes = new Map()
    this.connections = new Map()
    this.selectedNodes = new Set()
    this.eventHandlers = new Map()
    this.renderMode = 'webgl'
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    
    // Check WebGL support
    const webglSupported = PIXI.utils.isWebGLSupported()
    
    // Create PIXI application
    this.app = new PIXI.Application({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0xf5f5f5, // Light gray background
      backgroundAlpha: 1, // Fully opaque
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      forceCanvas: !webglSupported || localStorage.getItem('forceCanvas2D') === 'true'
    })
    
    // PixiJS v7 only supports WebGL
    this.renderMode = 'webgl'
    
    // Add canvas to container
    container.appendChild(this.app.view)
    
    // Expose app for debugging
    ;(window as any).__PIXI_APP__ = this.app
    ;(this.app.view as any).__pixi_app__ = this.app
    
    // Create containers - nodes should be on top of connections
    this.connectionContainer = new PIXI.Container()
    this.nodeContainer = new PIXI.Container()
    
    // Add connections first, then nodes on top
    this.app.stage.addChild(this.connectionContainer)
    this.app.stage.addChild(this.nodeContainer)
    
    
    // Initialize modules
    this.viewport = new ViewportController(this.app, this.container)
    this.interactionManager = new InteractionManager(this.app, this.viewport)
    this.performanceMonitor = new PerformanceMonitor(this.app)
    
    // Initial viewport will be set after nodes are loaded
    
    // Setup interaction events
    this.setupInteractionHandlers()
    
    // Handle resize
    window.addEventListener('resize', this.handleResize)
    
    // Start render loop
    this.app.ticker.add(this.render)
  }

  private setupInteractionHandlers(): void {
    this.interactionManager.on('nodeClick', (event) => {
      console.log('Node clicked:', event.nodeId, 'multi:', event.multi, 'shift:', event.originalEvent?.shiftKey)
      // Auto zoom to node on click (not multi-select)
      if (!event.multi) {
        console.log('Zooming to node:', event.nodeId)
        this.zoomToNode(event.nodeId)
      }
      this.emit('nodeClick', event)
    })
    
    this.interactionManager.on('nodeDoubleClick', (event) => {
      console.log('Node double-clicked:', event.nodeId)
      // Zoom to node on double-click as backup
      this.zoomToNode(event.nodeId)
      this.emit('nodeDoubleClick', event)
    })
    
    this.interactionManager.on('nodeDragStart', (event) => {
      this.emit('nodeDragStart', event)
    })
    
    this.interactionManager.on('nodeDrag', (event) => {
      this.emit('nodeDrag', event)
    })
    
    this.interactionManager.on('nodeDragEnd', (event) => {
      this.emit('nodeDragEnd', event)
    })
    
    this.interactionManager.on('canvasClick', (event) => {
      this.emit('canvasClick', event)
    })
    
    this.interactionManager.on('canvasDoubleClick', (event) => {
      this.emit('canvasDoubleClick', event)
    })
  }

  private handleResize = (): void => {
    if (!this.app || !this.container) return
    
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.app.renderer.resize(width, height)
    this.viewport.resize(width, height)
  }

  private render = (delta: number): void => {
    // Update performance metrics
    this.performanceMonitor.update(delta)
    
    // Update viewport culling
    const visibleBounds = this.viewport.getVisibleBounds()
    
    // Cull nodes
    this.nodes.forEach((node) => {
      node.visible = node.isInBounds(visibleBounds)
    })
    
    // Don't cull connections for now
    // this.connections.forEach((connection) => {
    //   connection.visible = connection.isInBounds(visibleBounds)
    // })
  }

  createNode(node: Node): void {
    
    if (this.nodes.has(node.id)) {
      console.warn(`Node ${node.id} already exists`)
      return
    }
    
    // Get backgroundColor from node (it's a direct property, not in style)
    let backgroundColor = (node as any).backgroundColor || node.style?.backgroundColor
    
    
    // If still no color, use a default
    if (!backgroundColor) {
      backgroundColor = '#4ECDC4' // Default teal color
    }
    
    const pixiNode = new SimplePixiNode(node.id, node.text, node.positionX, node.positionY, backgroundColor)
    
    // Apply grid snapping if enabled
    if (this.gridSnapping > 0) {
      node.positionX = Math.round(node.positionX / this.gridSnapping) * this.gridSnapping
      node.positionY = Math.round(node.positionY / this.gridSnapping) * this.gridSnapping
    }
    
    // Apply world bounds if set
    if (this.worldBounds) {
      node.positionX = Math.max(this.worldBounds.minX, Math.min(this.worldBounds.maxX, node.positionX))
      node.positionY = Math.max(this.worldBounds.minY, Math.min(this.worldBounds.maxY, node.positionY))
    }
    
    pixiNode.position.set(node.positionX, node.positionY)
    
    this.nodeContainer.addChild(pixiNode)
    this.nodes.set(node.id, pixiNode)
    
    
    // Setup node interactions
    this.interactionManager.registerNode(pixiNode)
    
    // Update performance metrics
    this.performanceMonitor.setNodeCount(this.nodes.size)
    
    // Create connection if node has parent
    if (node.parentId && this.nodes.has(node.parentId)) {
      this.createConnection({
        id: `${node.parentId}-${node.id}`,
        parentId: node.parentId,
        childId: node.id
      })
    }

    // Auto-fit viewport when we have enough nodes loaded
    if (this.nodes.size === 10) {
      // Use a simple, aggressive zoom setting that will definitely work
      setTimeout(() => {
        console.log('Setting viewport to 0.5 zoom for better interaction')
        this.app.stage.scale.set(0.5)
        this.app.stage.position.set(640, 360) // Center on screen
      }, 100)
    }
  }

  updateNode(id: string, updates: Partial<Node>): void {
    const pixiNode = this.nodes.get(id)
    if (!pixiNode) {
      console.warn(`Node ${id} not found`)
      return
    }
    
    pixiNode.updateData(updates)
    
    if (updates.positionX !== undefined || updates.positionY !== undefined) {
      let x = updates.positionX ?? pixiNode.x
      let y = updates.positionY ?? pixiNode.y
      
      // Apply grid snapping
      if (this.gridSnapping > 0) {
        x = Math.round(x / this.gridSnapping) * this.gridSnapping
        y = Math.round(y / this.gridSnapping) * this.gridSnapping
      }
      
      // Apply world bounds
      if (this.worldBounds) {
        x = Math.max(this.worldBounds.minX, Math.min(this.worldBounds.maxX, x))
        y = Math.max(this.worldBounds.minY, Math.min(this.worldBounds.maxY, y))
      }
      
      pixiNode.position.set(x, y)
      
      // Update connected connections
      this.connections.forEach((connection) => {
        if (connection.getParentId() === id || connection.getChildId() === id) {
          this.updateConnectionPosition(connection)
        }
      })
    }
  }

  deleteNode(id: string): void {
    const pixiNode = this.nodes.get(id)
    if (!pixiNode) return
    
    // Remove from interaction manager
    this.interactionManager.unregisterNode(pixiNode)
    
    // Remove connected connections
    const connectionsToRemove: string[] = []
    this.connections.forEach((connection, connId) => {
      if (connection.getParentId() === id || connection.getChildId() === id) {
        connectionsToRemove.push(connId)
      }
    })
    
    connectionsToRemove.forEach((connId) => this.deleteConnection(connId))
    
    // Remove node
    this.nodeContainer.removeChild(pixiNode)
    pixiNode.destroy()
    this.nodes.delete(id)
    
    // Update selection
    this.selectedNodes.delete(id)
    
    // Update performance metrics
    this.performanceMonitor.setNodeCount(this.nodes.size)
  }

  selectNode(id: string, multi?: boolean): void {
    if (!multi) {
      this.clearSelection()
    }
    
    const pixiNode = this.nodes.get(id)
    if (pixiNode) {
      pixiNode.setSelected(true)
      this.selectedNodes.add(id)
      
      // Zoom to node
      this.zoomToNode(id)
    }
  }
  
  zoomToNode(id: string, targetZoom: number = 3.0): void {
    const node = this.nodes.get(id)
    if (!node) {
      console.warn('zoomToNode: Node not found:', id)
      return
    }
    
    // Get node position
    const nodeX = node.x
    const nodeY = node.y
    
    // Calculate target viewport to center the node
    const centerX = this.container.clientWidth / 2
    const centerY = this.container.clientHeight / 2
    
    // Animate to the node with a fast, snappy animation
    this.viewport.setViewport({
      x: centerX / targetZoom - nodeX,
      y: centerY / targetZoom - nodeY,
      zoom: targetZoom,
      rotation: 0
    }, true) // animate = true
  }

  clearSelection(): void {
    this.selectedNodes.forEach((id) => {
      const pixiNode = this.nodes.get(id)
      if (pixiNode) {
        pixiNode.setSelected(false)
      }
    })
    this.selectedNodes.clear()
  }

  createConnection(connection: Connection): void {
    
    if (this.connections.has(connection.id)) {
      console.warn(`Connection ${connection.id} already exists`)
      return
    }
    
    const parentNode = this.nodes.get(connection.parentId)
    const childNode = this.nodes.get(connection.childId)
    
    if (!parentNode || !childNode) {
      console.warn(`Cannot create connection: nodes not found`, {
        parentId: connection.parentId,
        hasParent: this.nodes.has(connection.parentId),
        childId: connection.childId,
        hasChild: this.nodes.has(connection.childId)
      })
      return
    }
    
    // Use SimpleConnection instead
    const simpleConnection = new SimpleConnection(connection.parentId, connection.childId)
    this.updateConnectionPosition(simpleConnection)
    
    this.connectionContainer.addChild(simpleConnection)
    this.connections.set(connection.id, simpleConnection)
    
  }

  private updateConnectionPosition(connection: SimpleConnection): void {
    const parentNode = this.nodes.get(connection.getParentId())
    const childNode = this.nodes.get(connection.getChildId())
    
    if (parentNode && childNode) {
      const startPos = { x: parentNode.x, y: parentNode.y }
      const endPos = { x: childNode.x, y: childNode.y }
      
      
      connection.updateEndpoints(startPos, endPos)
    }
  }

  updateConnection(id: string, updates: Partial<Connection>): void {
    const pixiConnection = this.connections.get(id)
    if (!pixiConnection) {
      console.warn(`Connection ${id} not found`)
      return
    }
    
    pixiConnection.updateData(updates)
    this.updateConnectionPosition(pixiConnection)
  }

  deleteConnection(id: string): void {
    const pixiConnection = this.connections.get(id)
    if (!pixiConnection) return
    
    this.connectionContainer.removeChild(pixiConnection)
    pixiConnection.destroy()
    this.connections.delete(id)
  }

  batchUpdateNodes(updates: BatchUpdate[]): void {
    // Pause rendering during batch update
    this.app.ticker.stop()
    
    updates.forEach((update) => {
      if (update.id) {
        this.updateNode(update.id, update)
      }
    })
    
    // Resume rendering
    this.app.ticker.start()
  }

  getViewport(): Viewport {
    return this.viewport.getViewport()
  }

  setViewport(viewport: Viewport): void {
    this.viewport.setViewport(viewport)
  }

  panBy(deltaX: number, deltaY: number): void {
    this.viewport.panBy(deltaX, deltaY)
  }

  zoomBy(delta: number, center?: { x: number; y: number }): void {
    this.viewport.zoomBy(delta, center)
  }

  resetViewport(): void {
    this.viewport.reset()
  }

  async exportCanvas(options: ExportOptions): Promise<Blob> {
    const { format = 'png', quality = 0.9, background = 'white', scale = 1 } = options
    
    // Create temporary renderer for export
    const exportApp = new PIXI.Application({
      width: this.app.view.width * scale,
      height: this.app.view.height * scale,
      backgroundColor: background === 'transparent' ? undefined : 0xffffff,
      transparent: background === 'transparent',
      resolution: scale,
      preserveDrawingBuffer: true
    })
    
    // Clone current stage
    const exportStage = new PIXI.Container()
    
    // Copy connections
    this.connections.forEach((connection) => {
      const clone = connection.clone()
      exportStage.addChild(clone)
    })
    
    // Copy nodes
    this.nodes.forEach((node) => {
      const clone = node.clone()
      exportStage.addChild(clone)
    })
    
    // Apply viewport transform
    const viewport = this.viewport.getViewport()
    exportStage.scale.set(viewport.zoom * scale)
    exportStage.position.set(
      viewport.x * scale,
      viewport.y * scale
    )
    
    exportApp.stage.addChild(exportStage)
    
    // Render
    exportApp.render()
    
    // Get canvas and create blob
    const canvas = exportApp.view
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            exportApp.destroy(true)
            resolve(blob)
          } else {
            exportApp.destroy(true)
            reject(new Error('Failed to create blob'))
          }
        },
        `image/${format === 'jpg' ? 'jpeg' : format}`,
        quality
      )
    })
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics()
  }

  destroy(): void {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    
    // Destroy all nodes
    this.nodes.forEach((node) => {
      this.interactionManager.unregisterNode(node)
      node.destroy()
    })
    this.nodes.clear()
    
    // Destroy all connections
    this.connections.forEach((connection) => {
      connection.destroy()
    })
    this.connections.clear()
    
    // Clear selection
    this.selectedNodes.clear()
    
    // Destroy modules
    this.interactionManager.destroy()
    this.performanceMonitor.destroy()
    this.viewport.destroy()
    
    // Destroy PIXI app
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
    
    // Clear event handlers
    this.eventHandlers.clear()
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  // Additional helper methods
  getNode(id: string): Node | undefined {
    const pixiNode = this.nodes.get(id)
    return pixiNode?.getData()
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values()).map((node) => node.getData())
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values()).map((conn) => conn.getData())
  }

  getSelectedNode(): Node | undefined {
    if (this.selectedNodes.size === 0) return undefined
    const firstId = Array.from(this.selectedNodes)[0]
    return this.getNode(firstId)
  }

  getRenderMode(): 'webgl' | 'canvas2d' {
    return this.renderMode
  }

  enableGridSnapping(gridSize: number): void {
    this.gridSnapping = gridSize
  }

  setWorldBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    this.worldBounds = bounds
  }

  updateNodeStyle(id: string, style: any): void {
    const pixiNode = this.nodes.get(id)
    if (pixiNode) {
      pixiNode.updateStyle(style)
    }
  }

  resetMetrics(): void {
    this.performanceMonitor.reset()
  }

  // Auto-fit viewport to show nodes at a reasonable scale
  fitNodesToView(): void {
    if (this.nodes.size === 0) return

    // Find bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    this.nodes.forEach(node => {
      const x = node.x
      const y = node.y
      minX = Math.min(minX, x - 75) // Account for node size
      minY = Math.min(minY, y - 30)
      maxX = Math.max(maxX, x + 75)
      maxY = Math.max(maxY, y + 30)
    })

    // Calculate bounds
    const boundsWidth = maxX - minX
    const boundsHeight = maxY - minY
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // Calculate zoom to fit with padding
    const containerWidth = this.container.clientWidth
    const containerHeight = this.container.clientHeight
    const padding = 50 // pixels
    
    const zoomX = (containerWidth - padding * 2) / boundsWidth
    const zoomY = (containerHeight - padding * 2) / boundsHeight
    const zoom = Math.min(zoomX, zoomY, 1.0) // Cap at 100% zoom

    // Set viewport to center and fit nodes
    this.viewport.setViewport({
      x: -centerX,
      y: -centerY, 
      zoom: Math.max(0.1, zoom), // Minimum zoom of 10%
      rotation: 0
    })

    console.log(`Auto-fit viewport: center=(${centerX}, ${centerY}), zoom=${zoom}`)
  }
}