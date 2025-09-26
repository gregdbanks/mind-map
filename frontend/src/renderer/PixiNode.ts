import * as PIXI from 'pixi.js'
import { Node } from './types'

export class PixiNode extends PIXI.Container {
  private data: Node
  private background: PIXI.Graphics
  private text: PIXI.Text
  private selected: boolean = false
  private hover: boolean = false
  private dragging: boolean = false
  private app: PIXI.Application
  
  // Style properties
  private backgroundColor: number = 0xffffff
  private borderColor: number = 0x333333
  private selectedBorderColor: number = 0x0066ff
  private hoverBorderColor: number = 0x666666
  private borderWidth: number = 2
  private padding: number = 16
  private cornerRadius: number = 8

  constructor(data: Node, app: PIXI.Application) {
    super()
    this.data = { ...data }
    this.app = app
    
    // Make interactive
    this.eventMode = 'static'
    this.cursor = 'pointer'
    
    // Create background
    this.background = new PIXI.Graphics()
    this.addChild(this.background)
    
    // Create text
    this.text = new PIXI.Text(data.text, {
      fontFamily: 'Arial',
      fontSize: data.style?.fontSize || 16,
      fill: data.style?.color || 0x000000,
      fontWeight: data.style?.fontWeight || 'normal',
      fontStyle: data.style?.fontStyle || 'normal',
      align: 'center'
    })
    this.text.anchor.set(0.5)
    this.addChild(this.text)
    
    // Set up hit area
    this.updateHitArea()
    
    // Initial render
    this.render()
    
    // Set up events
    this.setupEvents()
  }

  private setupEvents(): void {
    this.on('pointerover', this.onPointerOver)
    this.on('pointerout', this.onPointerOut)
    this.on('pointerdown', this.onPointerDown)
    this.on('pointerup', this.onPointerUp)
    this.on('pointermove', this.onPointerMove)
  }

  private onPointerOver = (): void => {
    this.hover = true
    this.render()
  }

  private onPointerOut = (): void => {
    this.hover = false
    this.render()
  }

  private onPointerDown = (event: PIXI.FederatedPointerEvent): void => {
    this.dragging = true
    this.render()
  }

  private onPointerUp = (): void => {
    this.dragging = false
    this.render()
  }

  private onPointerMove = (event: PIXI.FederatedPointerEvent): void => {
    if (this.dragging) {
      // Dragging is handled by InteractionManager
    }
  }

  private updateHitArea(): void {
    const bounds = this.text.getLocalBounds()
    this.hitArea = new PIXI.Rectangle(
      bounds.x - this.padding,
      bounds.y - this.padding,
      bounds.width + this.padding * 2,
      bounds.height + this.padding * 2
    )
  }

  private render(): void {
    this.background.clear()
    
    // Determine colors based on state
    let bgColor = this.backgroundColor
    let borderColor = this.borderColor
    let borderAlpha = 0.2
    
    if (this.selected) {
      borderColor = this.selectedBorderColor
      borderAlpha = 1
      bgColor = 0xf0f8ff
    } else if (this.hover) {
      borderColor = this.hoverBorderColor
      borderAlpha = 0.5
      bgColor = 0xf5f5f5
    }
    
    if (this.dragging) {
      borderAlpha = 1
      bgColor = 0xfafafa
    }
    
    // Get text bounds
    const bounds = this.text.getLocalBounds()
    const width = bounds.width + this.padding * 2
    const height = bounds.height + this.padding * 2
    
    // Draw background
    this.background.beginFill(bgColor, 0.95)
    this.background.lineStyle({
      width: this.borderWidth,
      color: borderColor,
      alpha: borderAlpha,
      alignment: 0
    })
    
    // Draw rounded rectangle
    this.background.drawRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      this.cornerRadius
    )
    
    this.background.endFill()
    
    // Skip shadow effects for now - DropShadowFilter requires separate package
    // TODO: Add @pixi/filter-drop-shadow if shadows are needed
    this.filters = []
  }

  updateData(updates: Partial<Node>): void {
    this.data = { ...this.data, ...updates }
    
    if (updates.text !== undefined) {
      this.text.text = updates.text
      this.updateHitArea()
    }
    
    if (updates.style) {
      this.updateStyle(updates.style)
    }
    
    this.render()
  }

  updateStyle(style: any): void {
    if (style.fontSize !== undefined) {
      this.text.style.fontSize = style.fontSize
    }
    if (style.color !== undefined) {
      this.text.style.fill = style.color
    }
    if (style.fontWeight !== undefined) {
      this.text.style.fontWeight = style.fontWeight
    }
    if (style.fontStyle !== undefined) {
      this.text.style.fontStyle = style.fontStyle
    }
    
    this.data.style = { ...this.data.style, ...style }
    this.updateHitArea()
    this.render()
  }

  setSelected(selected: boolean): void {
    if (this.selected !== selected) {
      this.selected = selected
      this.render()
    }
  }

  isSelected(): boolean {
    return this.selected
  }

  setDragging(dragging: boolean): void {
    if (this.dragging !== dragging) {
      this.dragging = dragging
      this.render()
      
      if (dragging) {
        // Bring to front when dragging
        if (this.parent) {
          this.parent.setChildIndex(this, this.parent.children.length - 1)
        }
      }
    }
  }

  getData(): Node {
    return {
      ...this.data,
      positionX: this.x,
      positionY: this.y
    }
  }

  getId(): string {
    return this.data.id
  }

  isInBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): boolean {
    const nodeBounds = this.getBounds()
    return !(
      nodeBounds.right < bounds.minX ||
      nodeBounds.left > bounds.maxX ||
      nodeBounds.bottom < bounds.minY ||
      nodeBounds.top > bounds.maxY
    )
  }

  clone(): PixiNode {
    const clone = new PixiNode(this.getData(), this.app)
    clone.position.set(this.x, this.y)
    clone.setSelected(this.selected)
    return clone
  }

  destroy(): void {
    this.removeAllListeners()
    super.destroy({ children: true })
  }
}