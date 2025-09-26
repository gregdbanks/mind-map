import * as PIXI from 'pixi.js'

interface AtlasRegion {
  texture: PIXI.Texture
  x: number
  y: number
  width: number
  height: number
}

export class TextureAtlas {
  private atlas: PIXI.RenderTexture
  private regions: Map<string, AtlasRegion> = new Map()
  private packer: BinPacker
  private renderer: PIXI.Renderer
  private dirty: boolean = false
  
  constructor(renderer: PIXI.Renderer, size: number = 2048) {
    this.renderer = renderer
    this.atlas = PIXI.RenderTexture.create({
      width: size,
      height: size,
      resolution: 1
    })
    this.packer = new BinPacker(size, size)
  }
  
  /**
   * Add texture to atlas
   */
  addTexture(key: string, source: PIXI.DisplayObject | PIXI.Texture): PIXI.Texture | null {
    // Check if already exists
    if (this.regions.has(key)) {
      return this.regions.get(key)!.texture
    }
    
    // Get bounds
    let width: number, height: number
    if (source instanceof PIXI.Texture) {
      width = source.width
      height = source.height
    } else {
      const bounds = source.getLocalBounds()
      width = Math.ceil(bounds.width)
      height = Math.ceil(bounds.height)
    }
    
    // Find space in atlas
    const rect = this.packer.pack(width + 2, height + 2) // Add padding
    if (!rect) {
      console.warn(`No space in atlas for texture: ${key}`)
      return null
    }
    
    // Create sub-texture
    const region: AtlasRegion = {
      texture: new PIXI.Texture(
        this.atlas.baseTexture,
        new PIXI.Rectangle(rect.x + 1, rect.y + 1, width, height)
      ),
      x: rect.x + 1,
      y: rect.y + 1,
      width,
      height
    }
    
    this.regions.set(key, region)
    this.dirty = true
    
    // Render to atlas
    this.renderToAtlas(source, region)
    
    return region.texture
  }
  
  /**
   * Get texture from atlas
   */
  getTexture(key: string): PIXI.Texture | null {
    const region = this.regions.get(key)
    return region ? region.texture : null
  }
  
  /**
   * Remove texture from atlas
   */
  removeTexture(key: string): void {
    const region = this.regions.get(key)
    if (region) {
      region.texture.destroy()
      this.regions.delete(key)
      // Note: We don't reclaim the space in the atlas
    }
  }
  
  /**
   * Render source to atlas
   */
  private renderToAtlas(source: PIXI.DisplayObject | PIXI.Texture, region: AtlasRegion): void {
    const container = new PIXI.Container()
    
    if (source instanceof PIXI.Texture) {
      const sprite = new PIXI.Sprite(source)
      sprite.position.set(region.x, region.y)
      container.addChild(sprite)
    } else {
      source.position.set(region.x, region.y)
      container.addChild(source)
    }
    
    this.renderer.render(container, {
      renderTexture: this.atlas,
      clear: false
    })
    
    container.destroy({ children: true })
  }
  
  /**
   * Clear atlas
   */
  clear(): void {
    this.regions.forEach(region => {
      region.texture.destroy()
    })
    this.regions.clear()
    this.packer.reset()
    
    // Clear render texture
    this.renderer.render(new PIXI.Container(), {
      renderTexture: this.atlas,
      clear: true
    })
  }
  
  /**
   * Get atlas usage statistics
   */
  getStats(): {
    usage: number
    textureCount: number
    wastedSpace: number
  } {
    const totalArea = this.atlas.width * this.atlas.height
    let usedArea = 0
    
    this.regions.forEach(region => {
      usedArea += region.width * region.height
    })
    
    return {
      usage: (usedArea / totalArea) * 100,
      textureCount: this.regions.size,
      wastedSpace: totalArea - usedArea
    }
  }
  
  /**
   * Debug: Export atlas as image
   */
  async debugExport(): Promise<Blob> {
    const canvas = this.renderer.extract.canvas(this.atlas)
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to export atlas'))
      })
    })
  }
  
  destroy(): void {
    this.clear()
    this.atlas.destroy(true)
  }
}

/**
 * Simple bin packing algorithm for texture atlas
 */
class BinPacker {
  private root: PackNode
  
  constructor(width: number, height: number) {
    this.root = { x: 0, y: 0, width, height }
  }
  
  pack(width: number, height: number): PackNode | null {
    return this.findNode(this.root, width, height) || this.growNode(width, height)
  }
  
  private findNode(root: PackNode, width: number, height: number): PackNode | null {
    if (root.used) {
      return this.findNode(root.right!, width, height) || 
             this.findNode(root.down!, width, height)
    } else if (width <= root.width && height <= root.height) {
      return this.splitNode(root, width, height)
    }
    return null
  }
  
  private splitNode(node: PackNode, width: number, height: number): PackNode {
    node.used = true
    node.down = {
      x: node.x,
      y: node.y + height,
      width: node.width,
      height: node.height - height
    }
    node.right = {
      x: node.x + width,
      y: node.y,
      width: node.width - width,
      height: height
    }
    return node
  }
  
  private growNode(width: number, height: number): PackNode | null {
    // For simplicity, we don't grow the atlas
    return null
  }
  
  reset(): void {
    this.root = { 
      x: 0, 
      y: 0, 
      width: this.root.width, 
      height: this.root.height 
    }
  }
}

interface PackNode {
  x: number
  y: number
  width: number
  height: number
  used?: boolean
  right?: PackNode
  down?: PackNode
}