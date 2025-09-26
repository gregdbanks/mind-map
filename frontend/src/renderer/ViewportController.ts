import * as PIXI from 'pixi.js'
import { Viewport } from './types'

export class ViewportController {
  private app: PIXI.Application
  private container: HTMLElement
  private viewport: Viewport
  private minZoom: number = 0.1
  private maxZoom: number = 10
  private zoomSpeed: number = 1.2
  private panSpeed: number = 1
  private isPanning: boolean = false
  private lastPanPosition: { x: number; y: number } = { x: 0, y: 0 }

  constructor(app: PIXI.Application, container: HTMLElement) {
    this.app = app
    this.container = container
    
    // Initialize viewport
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0
    }
    
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Mouse wheel for zoom
    this.container.addEventListener('wheel', this.onWheel, { passive: false })
    
    // Space + drag for pan
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    
    // Mouse events for panning
    this.container.addEventListener('pointerdown', this.onPointerDown)
    this.container.addEventListener('pointermove', this.onPointerMove)
    this.container.addEventListener('pointerup', this.onPointerUp)
    this.container.addEventListener('pointercancel', this.onPointerUp)
  }

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault()
    
    // Get mouse position relative to container
    const rect = this.container.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    // Determine if zooming or panning
    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const delta = -event.deltaY * this.zoomSpeed * 0.01
      this.zoomBy(delta, { x: mouseX, y: mouseY })
    } else {
      // Pan
      this.panBy(event.deltaX, event.deltaY)
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space' && !event.repeat) {
      this.container.style.cursor = 'grab'
    }
  }

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space') {
      this.container.style.cursor = 'auto'
      this.isPanning = false
    }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.shiftKey || (event as any).spaceKey || 
        (event.target as HTMLElement).closest('[data-pan-mode="true"]')) {
      this.isPanning = true
      this.lastPanPosition = { x: event.clientX, y: event.clientY }
      this.container.style.cursor = 'grabbing'
      event.preventDefault()
    }
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isPanning) return
    
    const dx = event.clientX - this.lastPanPosition.x
    const dy = event.clientY - this.lastPanPosition.y
    
    this.panBy(-dx, -dy)
    
    this.lastPanPosition = { x: event.clientX, y: event.clientY }
  }

  private onPointerUp = (event: PointerEvent): void => {
    if (this.isPanning) {
      this.isPanning = false
      this.container.style.cursor = 'grab'
    }
  }

  getViewport(): Viewport {
    return { ...this.viewport }
  }

  setViewport(viewport: Viewport, animate: boolean = false): void {
    if (animate) {
      this.animateToViewport(viewport)
    } else {
      this.viewport = { ...viewport }
      this.applyViewport()
    }
  }
  
  private animateToViewport(targetViewport: Viewport, duration: number = 150): void {
    const startViewport = { ...this.viewport }
    const startTime = performance.now()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      
      this.viewport = {
        x: startViewport.x + (targetViewport.x - startViewport.x) * eased,
        y: startViewport.y + (targetViewport.y - startViewport.y) * eased,
        zoom: startViewport.zoom + (targetViewport.zoom - startViewport.zoom) * eased,
        rotation: startViewport.rotation + (targetViewport.rotation - startViewport.rotation) * eased
      }
      
      this.applyViewport()
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }

  panBy(deltaX: number, deltaY: number): void {
    this.viewport.x += deltaX * this.panSpeed / this.viewport.zoom
    this.viewport.y += deltaY * this.panSpeed / this.viewport.zoom
    this.applyViewport()
  }

  zoomBy(delta: number, center?: { x: number; y: number }): void {
    const oldZoom = this.viewport.zoom
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, oldZoom * (1 + delta)))
    
    if (center) {
      // Zoom to mouse position
      const worldX = (center.x - this.container.clientWidth / 2) / oldZoom - this.viewport.x
      const worldY = (center.y - this.container.clientHeight / 2) / oldZoom - this.viewport.y
      
      this.viewport.zoom = newZoom
      
      this.viewport.x = (center.x - this.container.clientWidth / 2) / newZoom - worldX
      this.viewport.y = (center.y - this.container.clientHeight / 2) / newZoom - worldY
    } else {
      // Zoom to center
      this.viewport.zoom = newZoom
    }
    
    this.applyViewport()
  }

  reset(): void {
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0
    }
    this.applyViewport()
  }

  resize(width: number, height: number): void {
    // Viewport adjustments on resize if needed
    this.applyViewport()
  }

  getVisibleBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfWidth = this.container.clientWidth / 2 / this.viewport.zoom
    const halfHeight = this.container.clientHeight / 2 / this.viewport.zoom
    
    return {
      minX: -this.viewport.x - halfWidth,
      minY: -this.viewport.y - halfHeight,
      maxX: -this.viewport.x + halfWidth,
      maxY: -this.viewport.y + halfHeight
    }
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX + this.viewport.x) * this.viewport.zoom + this.container.clientWidth / 2,
      y: (worldY + this.viewport.y) * this.viewport.zoom + this.container.clientHeight / 2
    }
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.container.clientWidth / 2) / this.viewport.zoom - this.viewport.x,
      y: (screenY - this.container.clientHeight / 2) / this.viewport.zoom - this.viewport.y
    }
  }

  private applyViewport(): void {
    const stage = this.app.stage
    
    // Apply transformations
    stage.scale.set(this.viewport.zoom)
    stage.position.set(
      this.viewport.x * this.viewport.zoom + this.container.clientWidth / 2,
      this.viewport.y * this.viewport.zoom + this.container.clientHeight / 2
    )
    stage.rotation = this.viewport.rotation
  }

  destroy(): void {
    this.container.removeEventListener('wheel', this.onWheel)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    this.container.removeEventListener('pointerdown', this.onPointerDown)
    this.container.removeEventListener('pointermove', this.onPointerMove)
    this.container.removeEventListener('pointerup', this.onPointerUp)
    this.container.removeEventListener('pointercancel', this.onPointerUp)
  }
}