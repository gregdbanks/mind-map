import * as PIXI from 'pixi.js'

interface CullableObject {
  visible: boolean
  getBounds(): PIXI.Rectangle
  worldTransform: PIXI.Matrix
}

interface SpatialNode<T> {
  bounds: PIXI.Rectangle
  objects: T[]
  children?: SpatialNode<T>[]
}

export class ViewportCuller {
  private quadTree: QuadTree<CullableObject>
  private frustumPadding: number = 100
  private cullingEnabled: boolean = true
  private stats = {
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0,
    lastCullTime: 0
  }
  
  constructor(worldBounds: PIXI.Rectangle, maxDepth: number = 6) {
    this.quadTree = new QuadTree(worldBounds, maxDepth)
  }
  
  /**
   * Add object to spatial index
   */
  addObject(object: CullableObject): void {
    this.quadTree.insert(object)
    this.stats.totalObjects++
  }
  
  /**
   * Remove object from spatial index
   */
  removeObject(object: CullableObject): void {
    this.quadTree.remove(object)
    this.stats.totalObjects--
  }
  
  /**
   * Update object position in spatial index
   */
  updateObject(object: CullableObject): void {
    this.quadTree.remove(object)
    this.quadTree.insert(object)
  }
  
  /**
   * Cull objects outside viewport
   */
  cull(viewport: PIXI.Rectangle): void {
    if (!this.cullingEnabled) return
    
    const startTime = performance.now()
    
    // Expand viewport by padding
    const cullBounds = new PIXI.Rectangle(
      viewport.x - this.frustumPadding,
      viewport.y - this.frustumPadding,
      viewport.width + this.frustumPadding * 2,
      viewport.height + this.frustumPadding * 2
    )
    
    // Get all objects
    const allObjects = this.quadTree.getAllObjects()
    
    // Reset stats
    this.stats.visibleObjects = 0
    this.stats.culledObjects = 0
    
    // Test each object
    allObjects.forEach(object => {
      const bounds = object.getBounds()
      const isVisible = this.intersectsViewport(bounds, cullBounds)
      
      object.visible = isVisible
      
      if (isVisible) {
        this.stats.visibleObjects++
      } else {
        this.stats.culledObjects++
      }
    })
    
    this.stats.lastCullTime = performance.now() - startTime
  }
  
  /**
   * Cull with frustum culling (for rotated viewports)
   */
  cullWithFrustum(corners: PIXI.Point[]): void {
    if (!this.cullingEnabled) return
    
    const startTime = performance.now()
    const allObjects = this.quadTree.getAllObjects()
    
    this.stats.visibleObjects = 0
    this.stats.culledObjects = 0
    
    allObjects.forEach(object => {
      const bounds = object.getBounds()
      const isVisible = this.boundsInFrustum(bounds, corners)
      
      object.visible = isVisible
      
      if (isVisible) {
        this.stats.visibleObjects++
      } else {
        this.stats.culledObjects++
      }
    })
    
    this.stats.lastCullTime = performance.now() - startTime
  }
  
  /**
   * Test if bounds intersect viewport
   */
  private intersectsViewport(bounds: PIXI.Rectangle, viewport: PIXI.Rectangle): boolean {
    return !(
      bounds.right < viewport.left ||
      bounds.left > viewport.right ||
      bounds.bottom < viewport.top ||
      bounds.top > viewport.bottom
    )
  }
  
  /**
   * Test if bounds are within frustum
   */
  private boundsInFrustum(bounds: PIXI.Rectangle, frustum: PIXI.Point[]): boolean {
    // Simple point-in-polygon test for rectangle corners
    const corners = [
      new PIXI.Point(bounds.left, bounds.top),
      new PIXI.Point(bounds.right, bounds.top),
      new PIXI.Point(bounds.right, bounds.bottom),
      new PIXI.Point(bounds.left, bounds.bottom)
    ]
    
    // If any corner is inside frustum, object is visible
    return corners.some(corner => this.pointInPolygon(corner, frustum))
  }
  
  /**
   * Point in polygon test
   */
  private pointInPolygon(point: PIXI.Point, polygon: PIXI.Point[]): boolean {
    let inside = false
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y
      const xj = polygon[j].x, yj = polygon[j].y
      
      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
      
      if (intersect) inside = !inside
    }
    
    return inside
  }
  
  /**
   * Enable/disable culling
   */
  setEnabled(enabled: boolean): void {
    this.cullingEnabled = enabled
    
    if (!enabled) {
      // Make all objects visible
      const allObjects = this.quadTree.getAllObjects()
      allObjects.forEach(object => {
        object.visible = true
      })
    }
  }
  
  /**
   * Set frustum padding
   */
  setPadding(padding: number): void {
    this.frustumPadding = padding
  }
  
  /**
   * Get culling statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats }
  }
  
  /**
   * Clear spatial index
   */
  clear(): void {
    this.quadTree.clear()
    this.stats.totalObjects = 0
    this.stats.visibleObjects = 0
    this.stats.culledObjects = 0
  }
  
  /**
   * Rebuild spatial index
   */
  rebuild(objects: CullableObject[]): void {
    this.clear()
    objects.forEach(object => this.addObject(object))
  }
}

/**
 * QuadTree implementation for spatial indexing
 */
class QuadTree<T extends CullableObject> {
  private root: QuadNode<T>
  private maxDepth: number
  private maxObjects: number = 10
  
  constructor(bounds: PIXI.Rectangle, maxDepth: number = 6) {
    this.root = new QuadNode(bounds, 0)
    this.maxDepth = maxDepth
  }
  
  insert(object: T): void {
    this.root.insert(object, this.maxDepth, this.maxObjects)
  }
  
  remove(object: T): void {
    this.root.remove(object)
  }
  
  query(bounds: PIXI.Rectangle): T[] {
    return this.root.query(bounds)
  }
  
  getAllObjects(): T[] {
    return this.root.getAllObjects()
  }
  
  clear(): void {
    this.root.clear()
  }
}

/**
 * QuadTree node
 */
class QuadNode<T extends CullableObject> {
  private bounds: PIXI.Rectangle
  private depth: number
  private objects: T[] = []
  private children: QuadNode<T>[] | null = null
  
  constructor(bounds: PIXI.Rectangle, depth: number) {
    this.bounds = bounds
    this.depth = depth
  }
  
  insert(object: T, maxDepth: number, maxObjects: number): void {
    if (this.children !== null) {
      const index = this.getIndex(object.getBounds())
      if (index !== -1) {
        this.children[index].insert(object, maxDepth, maxObjects)
        return
      }
    }
    
    this.objects.push(object)
    
    if (this.objects.length > maxObjects && this.depth < maxDepth && this.children === null) {
      this.subdivide()
      
      // Re-insert objects into children
      const objects = this.objects.slice()
      this.objects = []
      
      objects.forEach(obj => {
        const index = this.getIndex(obj.getBounds())
        if (index !== -1) {
          this.children![index].insert(obj, maxDepth, maxObjects)
        } else {
          this.objects.push(obj)
        }
      })
    }
  }
  
  remove(object: T): boolean {
    const index = this.objects.indexOf(object)
    if (index !== -1) {
      this.objects.splice(index, 1)
      return true
    }
    
    if (this.children !== null) {
      for (const child of this.children) {
        if (child.remove(object)) return true
      }
    }
    
    return false
  }
  
  query(bounds: PIXI.Rectangle): T[] {
    const result: T[] = []
    
    if (!this.intersects(bounds)) return result
    
    result.push(...this.objects)
    
    if (this.children !== null) {
      this.children.forEach(child => {
        result.push(...child.query(bounds))
      })
    }
    
    return result
  }
  
  getAllObjects(): T[] {
    const result: T[] = [...this.objects]
    
    if (this.children !== null) {
      this.children.forEach(child => {
        result.push(...child.getAllObjects())
      })
    }
    
    return result
  }
  
  private subdivide(): void {
    const x = this.bounds.x
    const y = this.bounds.y
    const hw = this.bounds.width / 2
    const hh = this.bounds.height / 2
    
    this.children = [
      new QuadNode(new PIXI.Rectangle(x, y, hw, hh), this.depth + 1), // NW
      new QuadNode(new PIXI.Rectangle(x + hw, y, hw, hh), this.depth + 1), // NE
      new QuadNode(new PIXI.Rectangle(x, y + hh, hw, hh), this.depth + 1), // SW
      new QuadNode(new PIXI.Rectangle(x + hw, y + hh, hw, hh), this.depth + 1) // SE
    ]
  }
  
  private getIndex(bounds: PIXI.Rectangle): number {
    if (this.children === null) return -1
    
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2
    
    const topQuadrant = bounds.y + bounds.height < horizontalMidpoint
    const bottomQuadrant = bounds.y > horizontalMidpoint
    const leftQuadrant = bounds.x + bounds.width < verticalMidpoint
    const rightQuadrant = bounds.x > verticalMidpoint
    
    if (leftQuadrant) {
      if (topQuadrant) return 0 // NW
      if (bottomQuadrant) return 2 // SW
    } else if (rightQuadrant) {
      if (topQuadrant) return 1 // NE
      if (bottomQuadrant) return 3 // SE
    }
    
    return -1 // Object crosses boundaries
  }
  
  private intersects(bounds: PIXI.Rectangle): boolean {
    return !(
      bounds.right < this.bounds.left ||
      bounds.left > this.bounds.right ||
      bounds.bottom < this.bounds.top ||
      bounds.top > this.bounds.bottom
    )
  }
  
  clear(): void {
    this.objects = []
    if (this.children !== null) {
      this.children.forEach(child => child.clear())
      this.children = null
    }
  }
}