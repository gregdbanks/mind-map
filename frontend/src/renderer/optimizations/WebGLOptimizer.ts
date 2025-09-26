import * as PIXI from 'pixi.js'

export class WebGLOptimizer {
  private app: PIXI.Application
  private textureCache: Map<string, PIXI.Texture> = new Map()
  private batchSize: number = 100
  private atlasTextures: Map<string, PIXI.Texture> = new Map()
  
  constructor(app: PIXI.Application) {
    this.app = app
    this.setupOptimizations()
  }
  
  private setupOptimizations(): void {
    // Enable texture garbage collection
    PIXI.settings.GC_MODE = PIXI.GC_MODES.AUTO
    PIXI.settings.GC_MAX_IDLE = 3600 // 1 hour
    PIXI.settings.GC_MAX_CHECK_COUNT = 600 // Check every 10 seconds
    
    // Optimize sprite batching
    PIXI.settings.SPRITE_BATCH_SIZE = this.batchSize
    
    // Enable resolution adaptation
    PIXI.settings.RESOLUTION = window.devicePixelRatio || 1
    
    // Optimize filter resolution for performance
    PIXI.settings.FILTER_RESOLUTION = Math.min(window.devicePixelRatio || 1, 2)
    
    // Enable round pixels for sharper rendering
    PIXI.settings.ROUND_PIXELS = true
  }
  
  /**
   * Create texture atlas for common shapes
   */
  createTextureAtlas(): void {
    const graphics = new PIXI.Graphics()
    
    // Create node background texture
    graphics.clear()
    graphics.beginFill(0xffffff)
    graphics.drawRoundedRect(0, 0, 200, 60, 8)
    graphics.endFill()
    const nodeTexture = this.app.renderer.generateTexture(graphics)
    this.atlasTextures.set('node-bg', nodeTexture)
    
    // Create node shadow texture
    graphics.clear()
    graphics.beginFill(0x000000, 0.1)
    graphics.drawRoundedRect(2, 2, 200, 60, 8)
    graphics.endFill()
    const shadowTexture = this.app.renderer.generateTexture(graphics)
    this.atlasTextures.set('node-shadow', shadowTexture)
    
    // Create selection outline texture
    graphics.clear()
    graphics.lineStyle(2, 0x0066ff)
    graphics.drawRoundedRect(0, 0, 200, 60, 8)
    const selectionTexture = this.app.renderer.generateTexture(graphics)
    this.atlasTextures.set('node-selection', selectionTexture)
    
    graphics.destroy()
  }
  
  /**
   * Get or create cached texture
   */
  getCachedTexture(key: string, createFn: () => PIXI.Texture): PIXI.Texture {
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!
    }
    
    const texture = createFn()
    this.textureCache.set(key, texture)
    return texture
  }
  
  /**
   * Optimize container for better performance
   */
  optimizeContainer(container: PIXI.Container): void {
    // Enable culling for large containers
    container.cullable = true
    
    // Sort children by zIndex for better batching
    container.sortableChildren = true
    
    // Cache as bitmap for static content
    if (container.children.length > 50) {
      container.cacheAsBitmap = true
    }
  }
  
  /**
   * Create optimized text
   */
  createOptimizedText(text: string, style: Partial<PIXI.ITextStyle>): PIXI.Text {
    // Use bitmap fonts for better performance with many text objects
    const pixiText = new PIXI.Text(text, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0x000000,
      ...style,
      // Optimize text rendering
      trim: true,
      padding: 2,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    })
    
    // Cache text as bitmap if it's static
    pixiText.cacheAsBitmap = true
    
    return pixiText
  }
  
  /**
   * Batch render operations
   */
  batchRender(operations: Array<() => void>): void {
    // Pause rendering
    this.app.ticker.stop()
    
    // Execute all operations
    operations.forEach(op => op())
    
    // Force single render
    this.app.renderer.render(this.app.stage)
    
    // Resume rendering
    this.app.ticker.start()
  }
  
  /**
   * Optimize draw calls by merging geometry
   */
  mergeGeometry(graphics: PIXI.Graphics[]): PIXI.Graphics {
    const merged = new PIXI.Graphics()
    
    graphics.forEach(g => {
      // Copy geometry
      merged.geometry = g.geometry.clone()
    })
    
    // Clean up originals
    graphics.forEach(g => g.destroy())
    
    return merged
  }
  
  /**
   * Enable GPU instancing for repeated elements
   */
  enableInstancing(sprite: PIXI.Sprite, instances: Array<{x: number, y: number, scale?: number}>): PIXI.Container {
    const container = new PIXI.Container()
    
    // Create particle container for better performance
    const particles = new PIXI.ParticleContainer(instances.length, {
      scale: true,
      position: true,
      rotation: false,
      uvs: false,
      tint: false
    })
    
    instances.forEach(instance => {
      const clone = new PIXI.Sprite(sprite.texture)
      clone.position.set(instance.x, instance.y)
      if (instance.scale) {
        clone.scale.set(instance.scale)
      }
      particles.addChild(clone)
    })
    
    container.addChild(particles)
    return container
  }
  
  /**
   * Profile render performance
   */
  profilePerformance(): {
    drawCalls: number
    textureCount: number
    bufferCount: number
  } {
    const gl = (this.app.renderer as any).gl
    
    if (!gl) {
      return {
        drawCalls: 0,
        textureCount: this.textureCache.size,
        bufferCount: 0
      }
    }
    
    // Get WebGL stats
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    
    return {
      drawCalls: (this.app.renderer as any).drawCount || 0,
      textureCount: this.textureCache.size + this.atlasTextures.size,
      bufferCount: (this.app.renderer as any).buffer?.count || 0
    }
  }
  
  /**
   * Clear unused textures
   */
  clearTextureCache(): void {
    this.textureCache.forEach((texture, key) => {
      // Only destroy if not in use
      if (!texture.baseTexture || texture.baseTexture.referenceCount <= 1) {
        texture.destroy(true)
        this.textureCache.delete(key)
      }
    })
  }
  
  /**
   * Optimize for mobile devices
   */
  optimizeForMobile(): void {
    if (!this.isMobile()) return
    
    // Reduce resolution on mobile
    this.app.renderer.resolution = 1
    
    // Reduce sprite batch size
    PIXI.settings.SPRITE_BATCH_SIZE = 1000
    
    // Disable antialiasing
    (this.app.renderer as any).context.antialias = false
    
    // Reduce filter quality
    PIXI.settings.FILTER_RESOLUTION = 1
  }
  
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
  
  destroy(): void {
    // Clean up textures
    this.textureCache.forEach(texture => texture.destroy(true))
    this.textureCache.clear()
    
    this.atlasTextures.forEach(texture => texture.destroy(true))
    this.atlasTextures.clear()
  }
}