import { Node, Connection } from '../renderer/types'

/**
 * Test helper utilities for PixiJS renderer tests
 */
export const testHelpers = {
  /**
   * Generate a large mind map for performance testing
   */
  loadLargeMap(nodeCount: number): Promise<void> {
    return new Promise((resolve) => {
      const nodes: Node[] = []
      const connections: Connection[] = []
      
      // Create root node
      const rootId = 'root'
      nodes.push({
        id: rootId,
        text: 'Root Node',
        positionX: 0,
        positionY: 0
      })
      
      // Calculate grid dimensions
      const cols = Math.ceil(Math.sqrt(nodeCount))
      const spacing = 150
      
      // Generate nodes in a hierarchical structure
      let currentId = 1
      const levels = Math.ceil(Math.log2(nodeCount))
      const nodesPerLevel: string[][] = [[rootId]]
      
      for (let level = 1; level < levels && currentId < nodeCount; level++) {
        const parentNodes = nodesPerLevel[level - 1]
        const currentLevelNodes: string[] = []
        
        const nodesInThisLevel = Math.min(
          Math.pow(2, level),
          nodeCount - currentId
        )
        
        for (let i = 0; i < nodesInThisLevel && currentId < nodeCount; i++) {
          const nodeId = `node-${currentId}`
          const parentIndex = Math.floor(i / (nodesInThisLevel / parentNodes.length))
          const parentId = parentNodes[Math.min(parentIndex, parentNodes.length - 1)]
          
          // Calculate position in circular layout
          const angle = (i / nodesInThisLevel) * Math.PI * 2
          const radius = level * 200
          
          nodes.push({
            id: nodeId,
            text: `Node ${currentId}`,
            positionX: Math.cos(angle) * radius,
            positionY: Math.sin(angle) * radius,
            parentId: parentId
          })
          
          connections.push({
            id: `conn-${parentId}-${nodeId}`,
            parentId: parentId,
            childId: nodeId
          })
          
          currentLevelNodes.push(nodeId)
          currentId++
        }
        
        nodesPerLevel.push(currentLevelNodes)
      }
      
      // Apply nodes and connections to renderer
      if ((window as any).pixiRenderer) {
        const renderer = (window as any).pixiRenderer
        nodes.forEach(node => renderer.createNode(node))
        connections.forEach(conn => renderer.createConnection(conn))
      } else if ((window as any).konvaRenderer) {
        const renderer = (window as any).konvaRenderer
        nodes.forEach(node => renderer.createNode(node))
        connections.forEach(conn => renderer.createConnection(conn))
      }
      
      resolve()
    })
  },
  
  /**
   * Generate a complex mind map with various node types
   */
  loadComplexMap(): Promise<void> {
    return new Promise((resolve) => {
      const nodes: Node[] = []
      const connections: Connection[] = []
      
      // Central topic
      nodes.push({
        id: 'central',
        text: 'Project Planning',
        positionX: 0,
        positionY: 0,
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#2563eb'
        }
      })
      
      // Main branches
      const branches = [
        { id: 'goals', text: 'Goals', color: '#10b981', angle: 0 },
        { id: 'tasks', text: 'Tasks', color: '#f59e0b', angle: Math.PI / 2 },
        { id: 'resources', text: 'Resources', color: '#ef4444', angle: Math.PI },
        { id: 'timeline', text: 'Timeline', color: '#8b5cf6', angle: 3 * Math.PI / 2 }
      ]
      
      branches.forEach((branch, index) => {
        const radius = 200
        nodes.push({
          id: branch.id,
          text: branch.text,
          positionX: Math.cos(branch.angle) * radius,
          positionY: Math.sin(branch.angle) * radius,
          parentId: 'central',
          style: {
            fontSize: 20,
            fontWeight: 'bold',
            color: branch.color
          }
        })
        
        connections.push({
          id: `conn-central-${branch.id}`,
          parentId: 'central',
          childId: branch.id
        })
        
        // Add sub-items
        const subItemCount = 3 + Math.floor(Math.random() * 3)
        for (let i = 0; i < subItemCount; i++) {
          const subId = `${branch.id}-sub-${i}`
          const subAngle = branch.angle + (i - subItemCount / 2) * 0.3
          const subRadius = 350
          
          nodes.push({
            id: subId,
            text: `${branch.text} Item ${i + 1}`,
            positionX: Math.cos(subAngle) * subRadius,
            positionY: Math.sin(subAngle) * subRadius,
            parentId: branch.id,
            style: {
              fontSize: 16,
              color: branch.color
            }
          })
          
          connections.push({
            id: `conn-${branch.id}-${subId}`,
            parentId: branch.id,
            childId: subId
          })
          
          // Add some details
          if (Math.random() > 0.5) {
            const detailId = `${subId}-detail`
            const detailAngle = subAngle + (Math.random() - 0.5) * 0.2
            const detailRadius = 450
            
            nodes.push({
              id: detailId,
              text: 'Detail',
              positionX: Math.cos(detailAngle) * detailRadius,
              positionY: Math.sin(detailAngle) * detailRadius,
              parentId: subId,
              style: {
                fontSize: 14,
                color: '#6b7280'
              }
            })
            
            connections.push({
              id: `conn-${subId}-${detailId}`,
              parentId: subId,
              childId: detailId
            })
          }
        }
      })
      
      // Apply to renderer
      if ((window as any).pixiRenderer) {
        const renderer = (window as any).pixiRenderer
        nodes.forEach(node => renderer.createNode(node))
        connections.forEach(conn => renderer.createConnection(conn))
      } else if ((window as any).konvaRenderer) {
        const renderer = (window as any).konvaRenderer
        nodes.forEach(node => renderer.createNode(node))
        connections.forEach(conn => renderer.createConnection(conn))
      }
      
      resolve()
    })
  },
  
  /**
   * Create a simple test map
   */
  createSimpleMap(): { nodes: Node[], connections: Connection[] } {
    const nodes: Node[] = [
      { id: 'n1', text: 'Node 1', positionX: 0, positionY: 0 },
      { id: 'n2', text: 'Node 2', positionX: 200, positionY: 0, parentId: 'n1' },
      { id: 'n3', text: 'Node 3', positionX: 100, positionY: 150, parentId: 'n1' },
      { id: 'n4', text: 'Node 4', positionX: 300, positionY: 150, parentId: 'n2' }
    ]
    
    const connections: Connection[] = [
      { id: 'c1', parentId: 'n1', childId: 'n2' },
      { id: 'c2', parentId: 'n1', childId: 'n3' },
      { id: 'c3', parentId: 'n2', childId: 'n4' }
    ]
    
    return { nodes, connections }
  },
  
  /**
   * Wait for renderer to be ready
   */
  async waitForRenderer(timeout: number = 5000): Promise<any> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      if ((window as any).pixiRenderer) {
        return (window as any).pixiRenderer
      }
      if ((window as any).konvaRenderer) {
        return (window as any).konvaRenderer
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error('Renderer not found within timeout')
  },
  
  /**
   * Simulate user interactions
   */
  simulateInteractions: {
    async dragNode(nodeId: string, deltaX: number, deltaY: number): Promise<void> {
      const renderer = await testHelpers.waitForRenderer()
      const node = renderer.getNode(nodeId)
      
      if (!node) throw new Error(`Node ${nodeId} not found`)
      
      // Simulate drag
      renderer.emit('nodeDragStart', { nodeId, position: { x: node.positionX, y: node.positionY } })
      renderer.emit('nodeDrag', { 
        nodeId, 
        position: { 
          x: node.positionX + deltaX, 
          y: node.positionY + deltaY 
        },
        delta: { x: deltaX, y: deltaY }
      })
      renderer.emit('nodeDragEnd', { 
        nodeId, 
        position: { 
          x: node.positionX + deltaX, 
          y: node.positionY + deltaY 
        } 
      })
    },
    
    async selectNode(nodeId: string): Promise<void> {
      const renderer = await testHelpers.waitForRenderer()
      renderer.selectNode(nodeId)
    },
    
    async panViewport(deltaX: number, deltaY: number): Promise<void> {
      const renderer = await testHelpers.waitForRenderer()
      renderer.panBy(deltaX, deltaY)
    },
    
    async zoomViewport(delta: number, center?: { x: number, y: number }): Promise<void> {
      const renderer = await testHelpers.waitForRenderer()
      renderer.zoomBy(delta, center)
    }
  },
  
  /**
   * Performance measurement utilities
   */
  performance: {
    async measureFPS(duration: number = 1000): Promise<number> {
      const renderer = await testHelpers.waitForRenderer()
      const samples: number[] = []
      const startTime = Date.now()
      
      while (Date.now() - startTime < duration) {
        const metrics = renderer.getPerformanceMetrics()
        samples.push(metrics.fps)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      return samples.reduce((a, b) => a + b, 0) / samples.length
    },
    
    async measureRenderTime(operation: () => Promise<void>): Promise<number> {
      const renderer = await testHelpers.waitForRenderer()
      const startTime = performance.now()
      
      await operation()
      
      // Wait for next frame
      await new Promise(resolve => requestAnimationFrame(resolve))
      
      return performance.now() - startTime
    }
  }
}

// Expose globally for tests
if (typeof window !== 'undefined') {
  (window as any).testHelpers = testHelpers
}