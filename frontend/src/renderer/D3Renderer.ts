import * as d3 from 'd3'
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

interface D3Node extends Node {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface D3Link extends Connection {
  source: string | D3Node
  target: string | D3Node
}

export class D3Renderer implements RendererAPI {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private nodes: Map<string, D3Node>
  private connections: Map<string, D3Link>
  private selectedNodes: Set<string>
  private eventHandlers: Map<string, Set<Function>>
  
  // D3 specific
  private simulation: d3.Simulation<D3Node, D3Link> | null
  private zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown>
  private transform: d3.ZoomTransform
  
  // Interaction state
  private hoveredNode: D3Node | null
  private draggedNode: D3Node | null
  private clickTimeout: number | null
  private hasAutoFit: boolean
  private isPanning: boolean
  private spacePressed: boolean
  private hasLoggedRender: boolean
  private hasLoggedNode: boolean
  
  // Animation state
  private animationTime: number
  private animationFrame: number | null
  private nodeFloatOffsets: Map<string, { x: number; y: number; targetX: number; targetY: number }>
  private lastFloatUpdate: number
  private devicePixelRatio: number
  
  constructor() {
    this.nodes = new Map()
    this.connections = new Map()
    this.selectedNodes = new Set()
    this.eventHandlers = new Map()
    this.simulation = null
    this.transform = d3.zoomIdentity
    this.hoveredNode = null
    this.draggedNode = null
    this.clickTimeout = null
    this.hasAutoFit = false
    this.isPanning = false
    this.spacePressed = false
    this.hasLoggedRender = false
    this.hasLoggedNode = false
    this.animationTime = 0
    this.animationFrame = null
    this.nodeFloatOffsets = new Map()
    this.lastFloatUpdate = 0
    this.devicePixelRatio = 1
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    
    // Clear any existing canvas elements more safely
    const existingCanvas = container.querySelector('canvas')
    if (existingCanvas) {
      existingCanvas.remove()
    }
    
    // Wait for container to have dimensions
    let attempts = 0
    let rect = container.getBoundingClientRect()
    while (attempts < 20 && (rect.width === 0 || rect.height === 0)) {
      await new Promise(resolve => setTimeout(resolve, 100))
      rect = container.getBoundingClientRect()
      console.log(`Attempt ${attempts + 1}: Container size:`, rect.width, 'x', rect.height)
      attempts++
    }
    
    // Create canvas
    this.canvas = document.createElement('canvas')
    
    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1
    
    // Set canvas internal resolution based on container size and device pixel ratio
    // Use container's actual dimensions, but ensure reasonable minimums
    let width = rect.width || container.offsetWidth || window.innerWidth
    let height = rect.height || container.offsetHeight || (window.innerHeight - 80)
    
    // If height is suspiciously small (less than 100px), use viewport calculation
    if (height < 100) {
      console.log('Container height too small:', height, 'Using viewport calculation')
      height = window.innerHeight - 80 // Account for header
    }
    
    // Set canvas internal size to match the actual display size * device pixel ratio
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    
    console.log('Canvas initialization:', {
      containerRect: { width: rect.width, height: rect.height },
      containerOffset: { width: container.offsetWidth, height: container.offsetHeight },
      canvasSize: { width: this.canvas.width, height: this.canvas.height },
      dpr
    })
    
    // Set CSS size to fill container (responsive)
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.canvas.style.cursor = 'grab'
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'auto'
    this.canvas.style.zIndex = '1'
    
    // Important: parent container should have pointer-events: none
    // so UI elements above can be clicked
    container.appendChild(this.canvas)
    
    // Get context without scaling yet
    this.context = this.canvas.getContext('2d')!
    
    // Store the DPR for use in render
    this.devicePixelRatio = dpr
    
    // Setup D3 zoom behavior
    this.zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 20])
      .filter((event) => {
        // Allow zoom with mouse wheel
        if (event.type === 'wheel') return true
        // Allow pan only with space bar held
        if (event.type === 'mousedown' || event.type === 'mousemove') {
          return this.spacePressed && !this.draggedNode
        }
        return false
      })
      .on('zoom', (event) => {
        this.transform = event.transform
        this.render()
      })
    
    d3.select(this.canvas).call(this.zoom)
    
    // Setup interaction events
    this.setupInteractions()
    
    // Setup keyboard events
    this.setupKeyboardEvents()
    
    // Setup touch events for mobile
    this.setupTouchEvents()
    
    // Handle resize
    window.addEventListener('resize', this.handleResize)
    
    // Start render loop
    this.startRenderLoop()
  }

  private setupKeyboardEvents(): void {
    // Store event handlers for cleanup
    this.handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !this.spacePressed) {
        event.preventDefault()
        this.spacePressed = true
        if (!this.draggedNode) {
          this.canvas.style.cursor = 'grab'
        }
      }
    }
    
    this.handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        this.spacePressed = false
        // Restore cursor based on what's under the mouse
        const node = this.hoveredNode
        this.canvas.style.cursor = node ? 'pointer' : 'default'
      }
    }
    
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }
  
  private handleKeyDown: ((event: KeyboardEvent) => void) | null = null
  private handleKeyUp: ((event: KeyboardEvent) => void) | null = null
  private touchStartTime: number = 0
  private touchStartPos: { x: number, y: number } | null = null
  private longPressTimeout: number | null = null

  private setupInteractions(): void {
    const canvasSelection = d3.select(this.canvas)
    
    // Mouse move for hover
    canvasSelection.on('mousemove', (event) => {
      const [x, y] = d3.pointer(event)
      const node = this.getNodeAtPosition(x, y)
      
      if (node !== this.hoveredNode) {
        this.hoveredNode = node
        // Update cursor based on state
        if (this.spacePressed) {
          this.canvas.style.cursor = 'grab'
        } else {
          this.canvas.style.cursor = node ? 'pointer' : 'default'
        }
        this.render()
      }
      
      // Handle drag
      if (this.draggedNode) {
        const [worldX, worldY] = this.transform.invert([x, y])
        this.draggedNode.x = worldX
        this.draggedNode.y = worldY
        this.draggedNode.positionX = worldX
        this.draggedNode.positionY = worldY
        this.updateNodePosition(this.draggedNode.id, worldX, worldY)
        this.render()
        
        this.emit('nodeDrag', {
          nodeId: this.draggedNode.id,
          position: { x: worldX, y: worldY },
          originalEvent: event
        })
      }
    })
    
    // Mouse down for drag start
    canvasSelection.on('mousedown', (event) => {
      const [x, y] = d3.pointer(event)
      const node = this.getNodeAtPosition(x, y)
      
      if (node) {
        event.stopPropagation()
        this.draggedNode = node
        this.canvas.style.cursor = 'grabbing'
        
        // Handle selection
        if (!event.ctrlKey && !event.metaKey) {
          this.clearSelection()
        }
        this.selectedNodes.add(node.id)
        
        this.emit('nodeDragStart', {
          nodeId: node.id,
          position: { x: node.x || 0, y: node.y || 0 },
          selectedNodes: Array.from(this.selectedNodes),
          originalEvent: event
        })
      }
    })
    
    // Mouse up for drag end and click
    canvasSelection.on('mouseup', (event) => {
      if (this.draggedNode) {
        const node = this.draggedNode
        this.draggedNode = null
        // Restore cursor based on what's under the mouse
        const [x, y] = d3.pointer(event)
        const nodeUnderMouse = this.getNodeAtPosition(x, y)
        if (this.spacePressed) {
          this.canvas.style.cursor = 'grab'
        } else {
          this.canvas.style.cursor = nodeUnderMouse ? 'pointer' : 'default'
        }
        
        this.emit('nodeDragEnd', {
          nodeId: node.id,
          position: { x: node.x || 0, y: node.y || 0 },
          selectedNodes: Array.from(this.selectedNodes),
          originalEvent: event
        })
      }
    })
    
    // Click for node selection and zoom
    canvasSelection.on('click', (event) => {
      const [x, y] = d3.pointer(event)
      const node = this.getNodeAtPosition(x, y)
      
      if (node) {
        event.stopPropagation()
        
        // Single click - zoom to node
        if (this.clickTimeout) {
          clearTimeout(this.clickTimeout)
          this.clickTimeout = null
          
          // Double click on node
          this.emit('nodeDoubleClick', {
            nodeId: node.id,
            position: { x, y },
            originalEvent: event
          })
        } else {
          // Single click - zoom to node
          this.clickTimeout = setTimeout(() => {
            this.clickTimeout = null
            this.zoomToNode(node.id)
            
            this.emit('nodeClick', {
              nodeId: node.id,
              position: { x, y },
              multi: event.ctrlKey || event.metaKey,
              originalEvent: event
            })
          }, 250)
        }
      } else {
        // Canvas click - check for double click
        if (this.clickTimeout) {
          clearTimeout(this.clickTimeout)
          this.clickTimeout = null
          
          // Double click on canvas - create new node
          const [worldX, worldY] = this.transform.invert([x, y])
          this.emit('canvasDoubleClick', {
            position: { x: worldX, y: worldY },
            originalEvent: event
          })
        } else {
          // Single click on canvas
          this.clickTimeout = setTimeout(() => {
            this.clickTimeout = null
            this.clearSelection()
            this.emit('canvasClick', {
              position: { x, y },
              originalEvent: event
            })
          }, 250)
        }
      }
    })
  }

  private setupTouchEvents(): void {
    if (!('ontouchstart' in window)) return
    
    const canvasSelection = d3.select(this.canvas)
    
    // Handle touch start for long press
    canvasSelection.on('touchstart', (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const node = this.getNodeAtPosition(x, y)
      
      this.touchStartTime = Date.now()
      this.touchStartPos = { x, y }
      
      // Long press detection
      if (node) {
        this.longPressTimeout = window.setTimeout(() => {
          // Trigger context menu on long press
          this.emit('nodeContextMenu', {
            nodeId: node.id,
            position: { x: touch.clientX, y: touch.clientY },
            originalEvent: event
          })
        }, 500) as unknown as number
      }
    })
    
    // Handle touch end for tap/double tap
    canvasSelection.on('touchend', (event) => {
      event.preventDefault()
      
      // Clear long press timeout
      if (this.longPressTimeout) {
        clearTimeout(this.longPressTimeout)
        this.longPressTimeout = null
      }
      
      const touchDuration = Date.now() - this.touchStartTime
      const touchEndPos = this.touchStartPos
      
      if (touchDuration < 200 && touchEndPos) { // Quick tap
        const [x, y] = [touchEndPos.x, touchEndPos.y]
        const node = this.getNodeAtPosition(x, y)
        
        // Handle double tap
        if (this.clickTimeout) {
          clearTimeout(this.clickTimeout)
          this.clickTimeout = null
          
          if (node) {
            // Double tap on node
            this.emit('nodeDoubleClick', {
              nodeId: node.id,
              position: { x, y },
              originalEvent: event
            })
          } else {
            // Double tap on canvas - create node
            const [worldX, worldY] = this.transform.invert([x, y])
            this.emit('canvasDoubleClick', {
              position: { x: worldX, y: worldY },
              originalEvent: event
            })
          }
        } else {
          // Single tap
          this.clickTimeout = window.setTimeout(() => {
            this.clickTimeout = null
            if (node) {
              this.selectNode(node.id)
              this.emit('nodeClick', {
                nodeId: node.id,
                position: { x, y },
                originalEvent: event
              })
            }
          }, 300) as unknown as number
        }
      }
    })
  }

  private getNodeAtPosition(x: number, y: number): D3Node | null {
    const [worldX, worldY] = this.transform.invert([x, y])
    
    for (const node of this.nodes.values()) {
      const nodeX = node.x || node.positionX
      const nodeY = node.y || node.positionY
      
      // Calculate node width based on text
      this.context.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const textMetrics = this.context.measureText(node.text)
      const padding = 30
      const minWidth = 120
      const maxWidth = 300
      const width = Math.max(minWidth, Math.min(maxWidth, textMetrics.width + padding * 2))
      
      // Check if point is within node bounds
      if (worldX >= nodeX - width/2 && worldX <= nodeX + width/2 &&
          worldY >= nodeY - 30 && worldY <= nodeY + 30) {
        return node
      }
    }
    
    return null
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.render()
      this.animationFrame = requestAnimationFrame(animate)
    }
    this.animationFrame = requestAnimationFrame(animate)
  }

  private render(): void {
    if (!this.context) return
    
    const width = this.canvas.width
    const height = this.canvas.height
    
    // Clear entire canvas with white background
    this.context.save()
    this.context.fillStyle = '#ffffff'
    this.context.fillRect(0, 0, width, height)
    
    // Reset transformation and scale for DPR
    this.context.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0)
    
    // Apply zoom/pan transform
    this.context.translate(this.transform.x, this.transform.y)
    this.context.scale(this.transform.k, this.transform.k)
    
    // Draw connections
    this.connections.forEach(connection => {
      const source = typeof connection.source === 'string' 
        ? this.nodes.get(connection.source) 
        : connection.source
      const target = typeof connection.target === 'string'
        ? this.nodes.get(connection.target)
        : connection.target
        
      if (source && target) {
        this.drawConnection(source, target)
      }
    })
    
    // Draw nodes
    this.nodes.forEach(node => {
      this.drawNode(node)
    })
    
    this.context.restore()
    
    // Debug: Log render info
    if (this.nodes.size > 0 && !this.hasLoggedRender) {
      this.hasLoggedRender = true
      console.log('D3 Render Debug:', {
        canvasSize: { width, height },
        cssSize: { width: this.canvas.style.width, height: this.canvas.style.height },
        dpr: this.devicePixelRatio,
        nodeCount: this.nodes.size,
        transform: { x: this.transform.x, y: this.transform.y, k: this.transform.k },
        firstNode: this.nodes.values().next().value
      })
    }
  }

  private drawNode(node: D3Node): void {
    let x = node.x || node.positionX
    let y = node.y || node.positionY
    const height = 60
    const radius = 12 // Rounded corner radius
    const padding = 30 // Horizontal padding
    
    // Debug log first few nodes
    if (!this.hasLoggedNode && node.text) {
      this.hasLoggedNode = true
      console.log('Drawing node:', {
        id: node.id,
        text: node.text,
        position: { x, y },
        dimensions: { width: 0, height }, // will be calculated below
        transform: { x: this.transform.x, y: this.transform.y, k: this.transform.k }
      })
    }
    
    // Measure text to determine node width
    this.context.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const textMetrics = this.context.measureText(node.text)
    const minWidth = 120
    const maxWidth = 300
    const width = Math.max(minWidth, Math.min(maxWidth, textMetrics.width + padding * 2))
    
    // No floating animation - it causes visual issues with canvas rendering
    
    // Shadow for dragged node
    if (this.draggedNode === node) {
      this.context.shadowColor = 'rgba(0, 0, 0, 0.2)'
      this.context.shadowBlur = 15
      this.context.shadowOffsetX = 0
      this.context.shadowOffsetY = 4
    }
    
    // Draw rounded rectangle
    this.context.beginPath()
    this.context.moveTo(x - width/2 + radius, y - height/2)
    this.context.lineTo(x + width/2 - radius, y - height/2)
    this.context.arcTo(x + width/2, y - height/2, x + width/2, y - height/2 + radius, radius)
    this.context.lineTo(x + width/2, y + height/2 - radius)
    this.context.arcTo(x + width/2, y + height/2, x + width/2 - radius, y + height/2, radius)
    this.context.lineTo(x - width/2 + radius, y + height/2)
    this.context.arcTo(x - width/2, y + height/2, x - width/2, y + height/2 - radius, radius)
    this.context.lineTo(x - width/2, y - height/2 + radius)
    this.context.arcTo(x - width/2, y - height/2, x - width/2 + radius, y - height/2, radius)
    this.context.closePath()
    
    // Fill with gradient for depth
    const gradient = this.context.createLinearGradient(x - width/2, y - height/2, x - width/2, y + height/2)
    const baseColor = node.backgroundColor || '#4ECDC4'
    gradient.addColorStop(0, this.lightenColor(baseColor, 10))
    gradient.addColorStop(1, baseColor)
    this.context.fillStyle = gradient
    this.context.fill()
    
    // Reset shadow
    this.context.shadowColor = 'transparent'
    this.context.shadowBlur = 0
    this.context.shadowOffsetX = 0
    this.context.shadowOffsetY = 0
    
    // Border with matching rounded corners
    if (this.draggedNode === node) {
      this.context.strokeStyle = '#FF0000'
      this.context.lineWidth = 3
    } else if (this.selectedNodes.has(node.id)) {
      this.context.strokeStyle = '#0066FF'
      this.context.lineWidth = 3
    } else if (this.hoveredNode === node) {
      this.context.strokeStyle = '#FFD700'
      this.context.lineWidth = 2
    } else {
      this.context.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      this.context.lineWidth = 1
    }
    this.context.stroke()
    
    // Text with better typography
    this.context.fillStyle = node.textColor || '#FFFFFF'
    this.context.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'
    
    // Add text shadow for better readability
    this.context.shadowColor = 'rgba(0, 0, 0, 0.3)'
    this.context.shadowBlur = 2
    this.context.shadowOffsetX = 0
    this.context.shadowOffsetY = 1
    
    // IMPORTANT: Use the same animated x, y coordinates for text as we used for the container
    this.context.fillText(node.text, x, y)
    
    // Reset shadow
    this.context.shadowColor = 'transparent'
    this.context.shadowBlur = 0
  }
  
  private lightenColor(color: string, percent: number): string {
    // Simple color lightening function
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  private drawConnection(source: D3Node, target: D3Node): void {
    const x1 = source.x || source.positionX
    const y1 = source.y || source.positionY
    const x2 = target.x || target.positionX
    const y2 = target.y || target.positionY
    
    this.context.strokeStyle = '#999999'
    this.context.lineWidth = 2
    this.context.beginPath()
    this.context.moveTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.stroke()
  }

  createNode(node: Node): void {
    const d3Node: D3Node = {
      ...node,
      x: node.positionX,
      y: node.positionY,
      positionX: node.positionX,
      positionY: node.positionY
    }
    
    this.nodes.set(node.id, d3Node)
    
    // Create connection if parent exists
    if (node.parentId && this.nodes.has(node.parentId)) {
      this.createConnection({
        id: `${node.parentId}-${node.id}`,
        parentId: node.parentId,
        childId: node.id
      })
    }
    
    // Auto-fit viewport after initial nodes load
    // Fit to view once we have a reasonable number of nodes
    if (this.nodes.size >= 10 && !this.hasAutoFit) {
      this.hasAutoFit = true
      setTimeout(() => this.fitNodesToView(), 100)
    }
    
    this.render()
  }

  updateNode(id: string, updates: Partial<Node>): void {
    const node = this.nodes.get(id)
    if (!node) return
    
    Object.assign(node, updates)
    
    if (updates.positionX !== undefined) node.x = updates.positionX
    if (updates.positionY !== undefined) node.y = updates.positionY
    
    this.render()
  }

  deleteNode(id: string): void {
    this.nodes.delete(id)
    this.selectedNodes.delete(id)
    
    // Remove connections
    const toRemove: string[] = []
    this.connections.forEach((conn, connId) => {
      if (conn.parentId === id || conn.childId === id) {
        toRemove.push(connId)
      }
    })
    toRemove.forEach(id => this.connections.delete(id))
    
    this.render()
  }

  selectNode(id: string, multi?: boolean): void {
    if (!multi) {
      this.clearSelection()
    }
    
    this.selectedNodes.add(id)
    this.render()
    
    // Auto zoom to node
    this.zoomToNode(id)
  }

  clearSelection(): void {
    this.selectedNodes.clear()
    this.render()
  }

  zoomToNode(id: string, targetZoom: number = 0.5): void {
    const node = this.nodes.get(id)
    if (!node) return
    
    const x = node.x || node.positionX
    const y = node.y || node.positionY
    
    // Get canvas dimensions in CSS pixels
    const cssWidth = this.canvas.width / this.devicePixelRatio
    const cssHeight = this.canvas.height / this.devicePixelRatio
    
    // Animate zoom
    const canvasSelection = d3.select(this.canvas)
    canvasSelection.transition()
      .duration(300)
      .call(
        this.zoom.transform,
        d3.zoomIdentity
          .translate(cssWidth / 2, cssHeight / 2)
          .scale(targetZoom)
          .translate(-x, -y)
      )
  }

  createConnection(connection: Connection): void {
    const link: D3Link = {
      ...connection,
      source: connection.parentId,
      target: connection.childId
    }
    
    this.connections.set(connection.id, link)
    this.render()
  }

  updateConnection(id: string, updates: Partial<Connection>): void {
    const connection = this.connections.get(id)
    if (!connection) return
    
    Object.assign(connection, updates)
    this.render()
  }

  deleteConnection(id: string): void {
    this.connections.delete(id)
    this.render()
  }

  batchUpdateNodes(updates: BatchUpdate[]): void {
    updates.forEach(update => {
      if (update.id) {
        this.updateNode(update.id, update)
      }
    })
  }

  private fitNodesToView(): void {
    if (this.nodes.size === 0) return
    
    console.log('Fitting', this.nodes.size, 'nodes to view')
    
    // Get canvas dimensions in CSS pixels
    const canvasWidth = this.canvas.width / this.devicePixelRatio
    const canvasHeight = this.canvas.height / this.devicePixelRatio
    
    // Skip if canvas has no size
    if (canvasWidth <= 0 || canvasHeight <= 0) {
      console.log('Canvas has no size, skipping fit')
      return
    }
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    this.nodes.forEach(node => {
      const x = node.x || node.positionX
      const y = node.y || node.positionY
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
    
    // Add padding for node sizes
    minX -= 100
    minY -= 50
    maxX += 100
    maxY += 50
    
    console.log('Node bounds:', { minX, minY, maxX, maxY })
    
    const padding = 50
    const boundsWidth = maxX - minX
    const boundsHeight = maxY - minY
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    // Calculate scale to fit
    const scaleX = (canvasWidth - padding * 2) / boundsWidth
    const scaleY = (canvasHeight - padding * 2) / boundsHeight
    const scale = Math.min(scaleX, scaleY)
    
    // Ensure reasonable scale - don't zoom out too far
    const minScale = 0.1  // Increased from 0.05 to see nodes better
    const maxScale = 2
    const finalScale = Math.max(minScale, Math.min(maxScale, scale))
    
    console.log('Fit calculation:', { 
      centerX, centerY, scale, finalScale, 
      canvasSize: { w: canvasWidth, h: canvasHeight },
      boundsSize: { w: boundsWidth, h: boundsHeight }
    })
    
    // Apply transform
    const canvasSelection = d3.select(this.canvas)
    canvasSelection.call(
      this.zoom.transform,
      d3.zoomIdentity
        .translate(canvasWidth / 2, canvasHeight / 2)
        .scale(finalScale)
        .translate(-centerX, -centerY)
    )
  }

  private updateNodePosition(id: string, x: number, y: number): void {
    const node = this.nodes.get(id)
    if (!node) return
    
    node.positionX = x
    node.positionY = y
    
    this.emit('nodePositionUpdate', {
      nodeId: id,
      position: { x, y }
    })
  }

  private handleResize = (): void => {
    const rect = this.container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    // Get actual dimensions
    const width = rect.width || this.container.offsetWidth || window.innerWidth
    const height = rect.height || this.container.offsetHeight || (window.innerHeight - 80)
    
    // Update canvas internal resolution to match display size
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    
    // Re-create context (don't scale here, we'll do it in render)
    this.context = this.canvas.getContext('2d')!
    this.devicePixelRatio = dpr
    
    console.log('Canvas resize:', {
      containerRect: { width: rect.width, height: rect.height },
      canvasSize: { width: this.canvas.width, height: this.canvas.height },
      dpr
    })
    
    // Re-render with new dimensions
    this.render()
  }

  getViewport(): Viewport {
    return {
      x: this.transform.x,
      y: this.transform.y,
      zoom: this.transform.k,
      rotation: 0
    }
  }

  setViewport(viewport: Viewport): void {
    const canvasSelection = d3.select(this.canvas)
    canvasSelection.call(
      this.zoom.transform,
      d3.zoomIdentity
        .translate(viewport.x, viewport.y)
        .scale(viewport.zoom)
    )
  }

  panBy(deltaX: number, deltaY: number): void {
    const newTransform = this.transform.translate(deltaX, deltaY)
    d3.select(this.canvas).call(this.zoom.transform, newTransform)
  }

  zoomBy(delta: number, center?: { x: number; y: number }): void {
    const newScale = this.transform.k * (1 + delta)
    const canvasSelection = d3.select(this.canvas)
    
    if (center) {
      canvasSelection.call(
        this.zoom.scaleTo,
        newScale,
        [center.x, center.y]
      )
    } else {
      canvasSelection.call(this.zoom.scaleTo, newScale)
    }
  }

  resetViewport(): void {
    d3.select(this.canvas).call(this.zoom.transform, d3.zoomIdentity)
  }
  
  fitToView(): void {
    this.fitNodesToView()
  }

  async exportCanvas(options: ExportOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to export canvas'))
          }
        },
        `image/${options.format === 'jpg' ? 'jpeg' : options.format}`,
        options.quality || 0.9
      )
    })
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: 60, // Approximate
      nodeCount: this.nodes.size,
      connectionCount: this.connections.size,
      renderTime: 0,
      memoryUsage: 0
    }
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    window.removeEventListener('resize', this.handleResize)
    if (this.handleKeyDown) window.removeEventListener('keydown', this.handleKeyDown)
    if (this.handleKeyUp) window.removeEventListener('keyup', this.handleKeyUp)
    this.canvas.remove()
    this.nodes.clear()
    this.connections.clear()
    this.selectedNodes.clear()
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
      handlers.forEach(handler => handler(data))
    }
  }

  // Additional methods
  getNode(id: string): Node | undefined {
    return this.nodes.get(id)
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values())
  }

  getConnections(): Connection[] {
    return Array.from(this.connections.values())
  }

  getSelectedNode(): Node | undefined {
    const firstId = Array.from(this.selectedNodes)[0]
    return firstId ? this.nodes.get(firstId) : undefined
  }

  getRenderMode(): 'webgl' | 'canvas2d' {
    return 'canvas2d'
  }

  enableGridSnapping(gridSize: number): void {
    // Could implement grid snapping
  }

  setWorldBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    // Could implement world bounds
  }

  updateNodeStyle(id: string, style: any): void {
    const node = this.nodes.get(id)
    if (node) {
      Object.assign(node, style)
      this.render()
    }
  }

  resetMetrics(): void {
    // No-op for now
  }
}