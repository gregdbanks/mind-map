import * as PIXI from 'pixi.js'
import { SimplePixiNode } from './SimplePixiNode'
import { ViewportController } from './ViewportController'
import { InteractionEvent } from './types'

export class InteractionManager {
  private app: PIXI.Application
  private viewport: ViewportController
  private nodes: Map<string, SimplePixiNode> = new Map()
  private dragTarget: SimplePixiNode | null = null
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 }
  private lastClickTime: number = 0
  private lastClickNode: string | null = null
  private clickDelay: number = 300
  private pointerDownPos: { x: number; y: number } | null = null
  private clickThreshold: number = 5 // pixels
  private hasDragged: boolean = false
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private selectedNodes: Set<string> = new Set()

  constructor(app: PIXI.Application, viewport: ViewportController) {
    this.app = app
    this.viewport = viewport
    
    this.setupCanvasEvents()
  }

  private setupCanvasEvents(): void {
    // Canvas click events
    this.app.stage.eventMode = 'static'
    this.app.stage.hitArea = this.app.screen
    
    this.app.stage.on('pointerdown', this.onCanvasPointerDown)
    this.app.stage.on('pointerup', this.onCanvasPointerUp)
  }

  registerNode(node: SimplePixiNode): void {
    const id = node.getId()
    this.nodes.set(id, node)
    
    
    // Set up node events
    node.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      console.log('Pointer down on node:', id)
      this.onNodePointerDown(node, event)
    })
    
    node.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
      console.log('Pointer up on node:', id)
      this.onNodePointerUp(node, event)
    })
    
    node.on('pointerupoutside', (event: PIXI.FederatedPointerEvent) => {
      console.log('Pointer up outside node:', id)
      this.onNodePointerUp(node, event)
    })
    
    node.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      this.onNodePointerMove(node, event)
    })
    
    node.on('rightclick', (event: PIXI.FederatedPointerEvent) => {
      this.onNodeRightClick(node, event)
    })
  }

  unregisterNode(node: SimplePixiNode): void {
    const id = node.getId()
    this.nodes.delete(id)
    this.selectedNodes.delete(id)
    node.removeAllListeners()
  }

  private onNodePointerDown = (node: SimplePixiNode, event: PIXI.FederatedPointerEvent): void => {
    event.stopPropagation()
    
    // Store pointer down position for click detection
    this.pointerDownPos = { x: event.globalX, y: event.globalY }
    this.hasDragged = false
    
    // Check for double click
    const now = Date.now()
    const isDoubleClick = 
      this.lastClickNode === node.getId() && 
      now - this.lastClickTime < this.clickDelay
    
    if (isDoubleClick) {
      this.emit('nodeDoubleClick', {
        nodeId: node.getId(),
        position: { x: event.globalX, y: event.globalY },
        originalEvent: event
      })
      this.lastClickNode = null
      return
    }
    
    this.lastClickTime = now
    this.lastClickNode = node.getId()
    
    // Handle selection
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      if (this.selectedNodes.has(node.getId())) {
        this.selectedNodes.delete(node.getId())
        node.setSelected(false)
      } else {
        this.selectedNodes.add(node.getId())
        node.setSelected(true)
      }
    } else if (!this.selectedNodes.has(node.getId())) {
      // Single select
      this.clearSelection()
      this.selectedNodes.add(node.getId())
      node.setSelected(true)
    }
    
    // Start drag
    this.dragTarget = node
    const globalPos = event.global
    const nodePos = node.position
    this.dragOffset = {
      x: globalPos.x - nodePos.x,
      y: globalPos.y - nodePos.y
    }
    
    node.setDragging(true)
    
    // Emit drag start (click will be emitted on pointer up if no drag occurred)
    this.emit('nodeDragStart', {
      nodeId: node.getId(),
      position: { x: nodePos.x, y: nodePos.y },
      selectedNodes: Array.from(this.selectedNodes),
      originalEvent: event
    })
  }

  private onNodePointerMove = (node: SimplePixiNode, event: PIXI.FederatedPointerEvent): void => {
    if (!this.dragTarget) return
    
    // Check if we've moved enough to count as a drag
    if (this.pointerDownPos && !this.hasDragged) {
      const distance = Math.sqrt(
        Math.pow(event.globalX - this.pointerDownPos.x, 2) + 
        Math.pow(event.globalY - this.pointerDownPos.y, 2)
      )
      if (distance > this.clickThreshold) {
        this.hasDragged = true
      }
    }
    
    const globalPos = event.global
    const newX = globalPos.x - this.dragOffset.x
    const newY = globalPos.y - this.dragOffset.y
    
    // Calculate delta for all selected nodes
    const deltaX = newX - this.dragTarget.x
    const deltaY = newY - this.dragTarget.y
    
    // Move all selected nodes
    if (this.selectedNodes.size > 1) {
      this.selectedNodes.forEach((nodeId) => {
        const selectedNode = this.nodes.get(nodeId)
        if (selectedNode) {
          selectedNode.x += deltaX
          selectedNode.y += deltaY
        }
      })
    } else {
      this.dragTarget.x = newX
      this.dragTarget.y = newY
    }
    
    // Emit drag event
    this.emit('nodeDrag', {
      nodeId: node.getId(),
      position: { x: newX, y: newY },
      delta: { x: deltaX, y: deltaY },
      selectedNodes: Array.from(this.selectedNodes),
      originalEvent: event
    })
  }

  private onNodePointerUp = (node: SimplePixiNode, event: PIXI.FederatedPointerEvent): void => {
    console.log('Node pointer up:', node.getId(), 'hasDragged:', this.hasDragged)
    // Check if this was a click (not a drag)
    if (!this.hasDragged && this.pointerDownPos) {
      console.log('Emitting nodeClick event for:', node.getId())
      // Emit click event for zoom
      this.emit('nodeClick', {
        nodeId: node.getId(),
        position: { x: event.globalX, y: event.globalY },
        multi: event.ctrlKey || event.metaKey,
        originalEvent: event
      })
    }
    
    if (this.dragTarget) {
      const nodePos = this.dragTarget.position
      
      // End drag for all selected nodes
      this.selectedNodes.forEach((nodeId) => {
        const selectedNode = this.nodes.get(nodeId)
        if (selectedNode) {
          selectedNode.setDragging(false)
        }
      })
      
      // Only emit drag end if we actually dragged
      if (this.hasDragged) {
        this.emit('nodeDragEnd', {
          nodeId: node.getId(),
          position: { x: nodePos.x, y: nodePos.y },
          selectedNodes: Array.from(this.selectedNodes),
          originalEvent: event
        })
      }
      
      this.dragTarget = null
    }
    
    // Reset tracking
    this.pointerDownPos = null
    this.hasDragged = false
  }

  private onNodeRightClick = (node: SimplePixiNode, event: PIXI.FederatedPointerEvent): void => {
    event.stopPropagation()
    event.preventDefault()
    
    // Emit right click event
    this.emit('nodeRightClick', {
      nodeId: node.getId(),
      position: { x: event.globalX, y: event.globalY },
      screenPosition: { x: event.screenX, y: event.screenY },
      originalEvent: event
    })
  }

  private onCanvasPointerDown = (event: PIXI.FederatedPointerEvent): void => {
    // Clear selection if clicking on empty canvas
    if (event.target === this.app.stage) {
      this.clearSelection()
      
      this.emit('canvasClick', {
        position: { x: event.globalX, y: event.globalY },
        worldPosition: this.viewport.screenToWorld(event.globalX, event.globalY),
        originalEvent: event
      })
    }
  }

  private onCanvasPointerUp = (event: PIXI.FederatedPointerEvent): void => {
    if (event.target === this.app.stage) {
      // Check for double click
      const now = Date.now()
      const isDoubleClick = 
        this.lastClickNode === null && 
        now - this.lastClickTime < this.clickDelay
      
      if (isDoubleClick) {
        this.emit('canvasDoubleClick', {
          position: { x: event.globalX, y: event.globalY },
          worldPosition: this.viewport.screenToWorld(event.globalX, event.globalY),
          originalEvent: event
        })
        this.lastClickTime = 0
      } else {
        this.lastClickTime = now
        this.lastClickNode = null
      }
    }
  }

  private clearSelection(): void {
    this.selectedNodes.forEach((nodeId) => {
      const node = this.nodes.get(nodeId)
      if (node) {
        node.setSelected(false)
      }
    })
    this.selectedNodes.clear()
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

  private emit(event: string, data: InteractionEvent): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  destroy(): void {
    this.nodes.forEach((node) => {
      node.removeAllListeners()
    })
    this.nodes.clear()
    this.selectedNodes.clear()
    this.eventHandlers.clear()
    
    this.app.stage.removeAllListeners()
  }
}