import * as PIXI from 'pixi.js'
import { Connection } from './types'

export class PixiConnection extends PIXI.Graphics {
  private data: Connection
  private startPoint: { x: number; y: number } = { x: 0, y: 0 }
  private endPoint: { x: number; y: number } = { x: 0, y: 0 }
  private app: PIXI.Application
  
  // Style properties - made VERY visible for debugging
  private lineColor: number = 0x0000FF // Blue for visibility
  private lineWidth: number = 10 // Very thick line
  private lineAlpha: number = 1 // Fully opaque
  private curveStrength: number = 0.5

  constructor(data: Connection, app: PIXI.Application) {
    super()
    this.data = { ...data }
    this.app = app
    
    // Make non-interactive by default
    this.eventMode = 'none'
  }

  updateEndpoints(start: { x: number; y: number }, end: { x: number; y: number }): void {
    this.startPoint = { ...start }
    this.endPoint = { ...end }
    this.render()
  }

  private render(): void {
    this.clear()
    
    console.log('🔥 Rendering connection:', {
      start: this.startPoint,
      end: this.endPoint,
      color: this.lineColor.toString(16),
      width: this.lineWidth
    })
    
    // Calculate control points for bezier curve
    const dx = this.endPoint.x - this.startPoint.x
    const dy = this.endPoint.y - this.startPoint.y
    
    // Control points for smooth curve
    const cp1x = this.startPoint.x + dx * this.curveStrength
    const cp1y = this.startPoint.y
    const cp2x = this.endPoint.x - dx * this.curveStrength
    const cp2y = this.endPoint.y
    
    // Draw simple straight line for debugging
    this.lineStyle({
      width: this.lineWidth,
      color: this.lineColor,
      alpha: this.lineAlpha,
      cap: PIXI.LINE_CAP.ROUND,
      join: PIXI.LINE_JOIN.ROUND
    })
    
    this.moveTo(this.startPoint.x, this.startPoint.y)
    this.lineTo(this.endPoint.x, this.endPoint.y)
    
    // Also draw a filled circle at start point to verify position
    this.beginFill(0xFF0000, 1)
    this.drawCircle(this.startPoint.x, this.startPoint.y, 20)
    this.endFill()
    
    // Optional: Add arrow head at the end
    // this.drawArrowHead()
  }

  private drawArrowHead(): void {
    const arrowSize = 8
    const angle = Math.atan2(
      this.endPoint.y - this.startPoint.y,
      this.endPoint.x - this.startPoint.x
    )
    
    // Calculate arrow points
    const arrowPoint1 = {
      x: this.endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
      y: this.endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
    }
    
    const arrowPoint2 = {
      x: this.endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
      y: this.endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
    }
    
    // Draw arrow
    this.beginFill(this.lineColor, this.lineAlpha)
    this.moveTo(this.endPoint.x, this.endPoint.y)
    this.lineTo(arrowPoint1.x, arrowPoint1.y)
    this.lineTo(arrowPoint2.x, arrowPoint2.y)
    this.closePath()
    this.endFill()
  }

  updateData(updates: Partial<Connection>): void {
    this.data = { ...this.data, ...updates }
    
    if (updates.style) {
      if (updates.style.color !== undefined) {
        this.lineColor = updates.style.color
      }
      if (updates.style.width !== undefined) {
        this.lineWidth = updates.style.width
      }
      if (updates.style.alpha !== undefined) {
        this.lineAlpha = updates.style.alpha
      }
      if (updates.style.curveStrength !== undefined) {
        this.curveStrength = updates.style.curveStrength
      }
    }
    
    this.render()
  }

  getData(): Connection {
    return { ...this.data }
  }

  getParentId(): string {
    return this.data.parentId
  }

  getChildId(): string {
    return this.data.childId
  }

  isInBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
    // For now, always show connections to avoid culling issues
    return true
    
    // TODO: Properly implement connection bounds checking
    // const minX = Math.min(this.startPoint.x, this.endPoint.x)
    // const maxX = Math.max(this.startPoint.x, this.endPoint.x)
    // const minY = Math.min(this.startPoint.y, this.endPoint.y)
    // const maxY = Math.max(this.startPoint.y, this.endPoint.y)
    
    // return !(
    //   maxX < bounds.minX ||
    //   minX > bounds.maxX ||
    //   maxY < bounds.minY ||
    //   minY > bounds.maxY
    // )
  }

  clone(): PixiConnection {
    const clone = new PixiConnection(this.getData(), this.app)
    clone.updateEndpoints(this.startPoint, this.endPoint)
    clone.lineColor = this.lineColor
    clone.lineWidth = this.lineWidth
    clone.lineAlpha = this.lineAlpha
    clone.curveStrength = this.curveStrength
    clone.render()
    return clone
  }

  destroy(): void {
    this.clear()
    super.destroy()
  }
}