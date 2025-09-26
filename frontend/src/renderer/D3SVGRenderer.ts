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

export class D3SVGRenderer implements RendererAPI {
  private container: HTMLElement
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  private g: d3.Selection<SVGGElement, unknown, null, undefined>
  private nodes: Map<string, D3Node>
  private connections: Map<string, D3Link>
  private selectedNodes: Set<string>
  private eventHandlers: Map<string, Set<Function>>
  
  // D3 specific
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown>
  private simulation: d3.Simulation<D3Node, D3Link> | null
  
  // Interaction state
  private hoveredNode: D3Node | null
  private draggedNode: D3Node | null
  private spacePressed: boolean
  
  constructor() {
    this.nodes = new Map()
    this.connections = new Map()
    this.selectedNodes = new Set()
    this.eventHandlers = new Map()
    this.simulation = null
    this.hoveredNode = null
    this.draggedNode = null
    this.spacePressed = false
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    
    // Clear any existing content
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    
    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('background', '#ffffff')
    
    // Create a group for zoom/pan
    this.g = this.svg.append('g')
    
    // Define gradients and filters
    const defs = this.svg.append('defs')
    
    // Shadow filter
    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
    
    filter.append('feOffset')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('result', 'offsetblur')
    
    const feComponentTransfer = filter.append('feComponentTransfer')
    feComponentTransfer.append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', 0.2)
    
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode')
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic')
    
    // Setup zoom behavior
    this.zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 20])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform)
      })
      .filter((event) => {
        // Allow zoom with mouse wheel
        if (event.type === 'wheel') return true
        // Allow pan only with space bar held
        if (event.type === 'mousedown' || event.type === 'mousemove') {
          return this.spacePressed
        }
        return false
      })
    
    this.svg.call(this.zoom)
    
    // Setup keyboard events
    this.setupKeyboardEvents()
    
    // Create groups for connections and nodes
    this.g.append('g').attr('class', 'connections')
    this.g.append('g').attr('class', 'nodes')
  }
  
  private setupKeyboardEvents(): void {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && !this.spacePressed) {
        event.preventDefault()
        this.spacePressed = true
        this.svg.style('cursor', 'grab')
      }
    })
    
    window.addEventListener('keyup', (event) => {
      if (event.code === 'Space') {
        event.preventDefault()
        this.spacePressed = false
        this.svg.style('cursor', 'default')
      }
    })
  }

  createNode(node: Node): void {
    const d3Node: D3Node = {
      ...node,
      x: node.positionX,
      y: node.positionY
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
    
    this.render()
    
    // Auto-fit after initial load
    if (this.nodes.size === 10) {
      setTimeout(() => this.fitNodesToView(), 100)
    }
  }

  private render(): void {
    // Render connections
    const connectionsGroup = this.g.select('.connections')
    const connectionData = Array.from(this.connections.values())
    
    const connections = connectionsGroup.selectAll<SVGLineElement, D3Link>('line')
      .data(connectionData, d => d.id)
    
    connections.enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .merge(connections)
      .attr('x1', d => {
        const source = typeof d.source === 'string' ? this.nodes.get(d.source) : d.source
        return source?.x || 0
      })
      .attr('y1', d => {
        const source = typeof d.source === 'string' ? this.nodes.get(d.source) : d.source
        return source?.y || 0
      })
      .attr('x2', d => {
        const target = typeof d.target === 'string' ? this.nodes.get(d.target) : d.target
        return target?.x || 0
      })
      .attr('y2', d => {
        const target = typeof d.target === 'string' ? this.nodes.get(d.target) : d.target
        return target?.y || 0
      })
    
    connections.exit().remove()
    
    // Render nodes
    const nodesGroup = this.g.select('.nodes')
    const nodeData = Array.from(this.nodes.values())
    
    const nodeGroups = nodesGroup.selectAll<SVGGElement, D3Node>('g.node')
      .data(nodeData, d => d.id)
    
    const nodeEnter = nodeGroups.enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .style('filter', 'url(#node-shadow)')
    
    // Calculate dynamic width for each node
    const calculateNodeWidth = (text: string): number => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      context.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      const metrics = context.measureText(text)
      const padding = 60
      const minWidth = 120
      const maxWidth = 300
      return Math.max(minWidth, Math.min(maxWidth, metrics.width + padding))
    }
    
    // Add gradient for each color
    const self = this
    nodeEnter.each(function(d) {
      const node = d3.select(this)
      const width = calculateNodeWidth(d.text)
      const gradientId = `gradient-${d.id}`
      
      // Create gradient for this node
      const gradient = self.svg.select('defs')
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
      
      const baseColor = d.backgroundColor || '#4ECDC4'
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(baseColor)!.brighter(0.3).toString())
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', baseColor)
      
      // Background rectangle with gradient
      node.append('rect')
        .attr('x', -width / 2)
        .attr('y', -30)
        .attr('width', width)
        .attr('height', 60)
        .attr('rx', 12)
        .attr('ry', 12)
        .attr('fill', `url(#${gradientId})`)
        .attr('stroke', 'rgba(0, 0, 0, 0.1)')
        .attr('stroke-width', 1)
      
      // Text
      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('fill', d.textColor || '#ffffff')
        .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .style('font-size', '18px')
        .style('user-select', 'none')
        .text(d.text)
    })
    
    // Setup floating animation for new nodes
    nodeEnter
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', function() {
        const node = d3.select(this)
        const nodeData = node.datum() as D3Node
        const floatOffset = Math.random() * Math.PI * 2
        const floatSpeed = 2000 + Math.random() * 2000 // 2-4 seconds per cycle
        
        // Create smooth floating animation
        const float = () => {
          node.transition()
            .duration(floatSpeed)
            .ease(d3.easeSinInOut)
            .attr('transform', `translate(${nodeData.x}, ${nodeData.y + 5})`)
            .transition()
            .duration(floatSpeed)
            .ease(d3.easeSinInOut)
            .attr('transform', `translate(${nodeData.x}, ${nodeData.y - 5})`)
            .on('end', float)
        }
        
        // Start with a delay based on the offset
        setTimeout(float, floatOffset * 500)
      })
    
    // Update positions
    const allNodes = nodeEnter.merge(nodeGroups)
    allNodes.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
    
    // Setup interactions
    this.setupNodeInteractions(allNodes)
    
    // Remove old nodes
    nodeGroups.exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .remove()
  }
  
  private setupNodeInteractions(nodes: d3.Selection<SVGGElement, D3Node, SVGGElement, unknown>): void {
    const self = this
    
    nodes
      .on('mouseenter', function(event, d) {
        if (!self.spacePressed) {
          d3.select(this).select('rect')
            .transition()
            .duration(200)
            .attr('stroke', '#FFD700')
            .attr('stroke-width', 2)
        }
        self.hoveredNode = d
        self.emit('nodeHover', { nodeId: d.id })
      })
      .on('mouseleave', function(event, d) {
        if (!self.selectedNodes.has(d.id)) {
          d3.select(this).select('rect')
            .transition()
            .duration(200)
            .attr('stroke', 'rgba(0, 0, 0, 0.1)')
            .attr('stroke-width', 1)
        }
        self.hoveredNode = null
      })
      .on('click', function(event, d) {
        event.stopPropagation()
        
        // Stop any ongoing animations for smooth zoom
        d3.select(this).interrupt()
        
        self.zoomToNode(d.id)
        self.emit('nodeClick', {
          nodeId: d.id,
          multi: event.ctrlKey || event.metaKey
        })
      })
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', function(event, d) {
          // Stop floating animation
          d3.select(this).interrupt()
          
          self.draggedNode = d
          d3.select(this).raise()
          d3.select(this).select('rect')
            .attr('stroke', '#FF0000')
            .attr('stroke-width', 3)
          
          self.emit('nodeDragStart', { nodeId: d.id })
        })
        .on('drag', function(event, d) {
          d.x = event.x
          d.y = event.y
          
          d3.select(this)
            .attr('transform', `translate(${d.x}, ${d.y})`)
          
          // Update connections
          self.render()
          
          self.emit('nodeDrag', { 
            nodeId: d.id,
            position: { x: d.x!, y: d.y! }
          })
        })
        .on('end', function(event, d) {
          self.draggedNode = null
          
          d3.select(this).select('rect')
            .attr('stroke', self.selectedNodes.has(d.id) ? '#0066FF' : 'rgba(0, 0, 0, 0.1)')
            .attr('stroke-width', self.selectedNodes.has(d.id) ? 3 : 1)
          
          self.emit('nodePositionUpdate', {
            nodeId: d.id,
            position: { x: d.x!, y: d.y! }
          })
          
          self.emit('nodeDragEnd', { nodeId: d.id })
          
          // Restart floating animation after a delay
          setTimeout(() => {
            if (!self.draggedNode || self.draggedNode.id !== d.id) {
              const node = d3.select(this)
              const float = () => {
                node.transition()
                  .duration(3000)
                  .ease(d3.easeSinInOut)
                  .attr('transform', `translate(${d.x}, ${d.y! + 5})`)
                  .transition()
                  .duration(3000)
                  .ease(d3.easeSinInOut)
                  .attr('transform', `translate(${d.x}, ${d.y! - 5})`)
                  .on('end', float)
              }
              float()
            }
          }, 1000)
        })
      )
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
    
    // Update visual
    this.g.selectAll<SVGGElement, D3Node>('g.node')
      .filter(d => d.id === id)
      .select('rect')
      .attr('stroke', '#0066FF')
      .attr('stroke-width', 3)
    
    this.zoomToNode(id)
  }

  clearSelection(): void {
    this.selectedNodes.clear()
    
    this.g.selectAll<SVGGElement, D3Node>('g.node')
      .select('rect')
      .attr('stroke', 'rgba(0, 0, 0, 0.1)')
      .attr('stroke-width', 1)
  }

  zoomToNode(id: string, targetZoom: number = 0.5): void {
    const node = this.nodes.get(id)
    if (!node) return
    
    const x = node.x || node.positionX
    const y = node.y || node.positionY
    
    const transform = d3.zoomIdentity
      .translate(this.container.clientWidth / 2, this.container.clientHeight / 2)
      .scale(targetZoom)
      .translate(-x, -y)
    
    this.svg.transition()
      .duration(300)
      .call(this.zoom.transform, transform)
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
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    this.nodes.forEach(node => {
      const x = node.x || node.positionX
      const y = node.y || node.positionY
      minX = Math.min(minX, x - 75)
      minY = Math.min(minY, y - 30)
      maxX = Math.max(maxX, x + 75)
      maxY = Math.max(maxY, y + 30)
    })
    
    const padding = 50
    const boundsWidth = maxX - minX
    const boundsHeight = maxY - minY
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    const scaleX = (this.container.clientWidth - padding * 2) / boundsWidth
    const scaleY = (this.container.clientHeight - padding * 2) / boundsHeight
    const scale = Math.min(scaleX, scaleY, 1)
    
    const transform = d3.zoomIdentity
      .translate(this.container.clientWidth / 2, this.container.clientHeight / 2)
      .scale(scale)
      .translate(-centerX, -centerY)
    
    this.svg.call(this.zoom.transform, transform)
  }

  getViewport(): Viewport {
    const transform = d3.zoomTransform(this.svg.node()!)
    return {
      x: transform.x,
      y: transform.y,
      zoom: transform.k,
      rotation: 0
    }
  }

  setViewport(viewport: Viewport): void {
    const transform = d3.zoomIdentity
      .translate(viewport.x, viewport.y)
      .scale(viewport.zoom)
    
    this.svg.call(this.zoom.transform, transform)
  }

  panBy(deltaX: number, deltaY: number): void {
    const currentTransform = d3.zoomTransform(this.svg.node()!)
    const newTransform = currentTransform.translate(deltaX, deltaY)
    this.svg.call(this.zoom.transform, newTransform)
  }

  zoomBy(delta: number, center?: { x: number; y: number }): void {
    const currentTransform = d3.zoomTransform(this.svg.node()!)
    const newScale = currentTransform.k * (1 + delta)
    
    if (center) {
      const transform = currentTransform
        .translate(center.x, center.y)
        .scale(1 + delta)
        .translate(-center.x, -center.y)
      this.svg.call(this.zoom.transform, transform)
    } else {
      this.svg.call(this.zoom.scaleTo, newScale)
    }
  }

  resetViewport(): void {
    this.svg.call(this.zoom.transform, d3.zoomIdentity)
  }
  
  fitToView(): void {
    this.fitNodesToView()
  }

  async exportCanvas(options: ExportOptions): Promise<Blob> {
    // Convert SVG to blob
    const svgData = new XMLSerializer().serializeToString(this.svg.node()!)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    
    // If PNG/JPG requested, convert using canvas
    if (options.format !== 'svg') {
      // Would need canvas conversion logic here
      return blob
    }
    
    return blob
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      nodeCount: this.nodes.size,
      connectionCount: this.connections.size,
      renderTime: 0,
      memoryUsage: 0
    }
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    
    if (this.svg) {
      this.svg.remove()
    }
    
    this.nodes.clear()
    this.connections.clear()
    this.selectedNodes.clear()
    this.eventHandlers.clear()
  }
  
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space' && !this.spacePressed) {
      event.preventDefault()
      this.spacePressed = true
      this.svg.style('cursor', 'grab')
    }
  }
  
  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault()
      this.spacePressed = false
      this.svg.style('cursor', 'default')
    }
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

  getRenderMode(): 'webgl' | 'canvas2d' | 'svg' {
    return 'svg'
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