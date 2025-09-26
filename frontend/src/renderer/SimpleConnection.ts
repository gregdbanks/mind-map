import * as PIXI from 'pixi.js'

export class SimpleConnection extends PIXI.Container {
  private line: PIXI.Graphics
  private parentId: string
  private childId: string
  
  constructor(parentId: string, childId: string) {
    super()
    this.parentId = parentId
    this.childId = childId
    
    // Create a graphics object as a child
    this.line = new PIXI.Graphics()
    this.addChild(this.line)
  }
  
  updateEndpoints(start: { x: number; y: number }, end: { x: number; y: number }): void {
    this.line.clear()
    
    // Draw a thin gray line
    this.line.lineStyle(2, 0x999999, 0.8)
    this.line.moveTo(start.x, start.y)
    this.line.lineTo(end.x, end.y)
  }
  
  getParentId(): string {
    return this.parentId
  }
  
  getChildId(): string {
    return this.childId
  }
}