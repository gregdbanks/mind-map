import * as PIXI from 'pixi.js'

// SIMPLEST POSSIBLE NODE - JUST A COLORED SQUARE WITH TEXT
export class SimplePixiNode extends PIXI.Container {
  private id: string
  private backgroundColor: number
  
  constructor(id: string, text: string, x: number, y: number, color?: number | string) {
    super()
    this.id = id
    
    // Convert color to number if it's a string
    if (typeof color === 'string') {
      this.backgroundColor = parseInt(color.replace('#', '0x'), 16)
    } else {
      this.backgroundColor = color || 0xff0000 // Default to red if no color
    }
    
    // Colored square with border - made slightly larger for visibility
    const graphics = new PIXI.Graphics()
    graphics.lineStyle(3, 0x000000, 1) // Black border (thicker)
    graphics.beginFill(this.backgroundColor)
    graphics.drawRect(-75, -30, 150, 60) // Larger rectangle
    graphics.endFill()
    
    // White text
    const textObj = new PIXI.Text(text, {
      fontSize: 16,
      fill: 0xffffff
    })
    textObj.anchor.set(0.5)
    
    this.addChild(graphics)
    this.addChild(textObj)
    
    // Position
    this.position.set(x, y)
    
    // Make interactive
    this.eventMode = 'static'
    this.cursor = 'pointer'
    // Set hitArea to match the rectangle
    this.hitArea = new PIXI.Rectangle(-75, -30, 150, 60)
  }
  
  getId(): string {
    return this.id
  }
  
  setSelected(selected: boolean): void {
    // For now, just change color
    const graphics = this.children[0] as PIXI.Graphics
    graphics.clear()
    graphics.lineStyle(3, 0x000000, 1) // Keep border
    graphics.beginFill(selected ? 0x0066ff : this.backgroundColor)
    graphics.drawRect(-75, -30, 150, 60) // Match new size
    graphics.endFill()
  }
  
  setDragging(dragging: boolean): void {
    this.alpha = dragging ? 0.7 : 1
  }
  
  getData(): any {
    return {
      id: this.id,
      positionX: this.x,
      positionY: this.y
    }
  }
  
  updateData(data: any): void {
    // Simple update
    if (data.text) {
      const text = this.children[1] as PIXI.Text
      text.text = data.text
    }
  }
  
  visible: boolean = true
  
  isInBounds(bounds: any): boolean {
    return true // Always visible for now
  }
  
  clone(): SimplePixiNode {
    const text = this.children[1] as PIXI.Text
    return new SimplePixiNode(this.id, text.text, this.x, this.y, this.backgroundColor)
  }
  
  updateStyle(style: any): void {
    // Ignore for now
  }
}