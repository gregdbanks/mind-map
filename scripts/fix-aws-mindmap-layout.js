// First, let's delete the old mind map and create a new one with better spacing
async function fixAWSMindMapLayout() {
  try {
    // Get the existing mind map
    const response = await fetch('http://localhost:3001/api/mindmaps/681d4506-bde3-43e9-b63d-518861e45bc7/nodes')
    const nodes = await response.json()
    
    console.log(`Found ${nodes.length} nodes to reposition`)
    
    // Create a map of node relationships
    const nodeMap = new Map()
    const rootNode = nodes.find(n => !n.parentId)
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] })
    })
    
    // Build tree structure
    nodes.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).children.push(node.id)
      }
    })
    
    // Calculate new positions with better spacing
    const positioned = new Map()
    const LEVEL_RADIUS = [0, 400, 650, 900, 1150] // Distance from center for each level
    const MIN_ANGLE = Math.PI / 8 // Minimum angle between siblings
    
    function positionNode(nodeId, centerX = 800, centerY = 600, level = 0, startAngle = 0, angleSpan = 2 * Math.PI) {
      const node = nodeMap.get(nodeId)
      if (!node) return
      
      // Position this node
      if (level === 0) {
        // Root node at center
        positioned.set(nodeId, { x: centerX, y: centerY })
      } else {
        // Calculate position based on angle
        const angle = startAngle + angleSpan / 2
        const radius = LEVEL_RADIUS[Math.min(level, LEVEL_RADIUS.length - 1)]
        positioned.set(nodeId, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        })
      }
      
      // Position children
      const children = node.children
      if (children.length > 0) {
        // Calculate angle for each child
        const totalAngleNeeded = children.length * MIN_ANGLE
        const actualAngleSpan = level === 0 ? 2 * Math.PI : Math.min(angleSpan * 0.8, totalAngleNeeded)
        const anglePerChild = actualAngleSpan / children.length
        const childStartAngle = startAngle + (angleSpan - actualAngleSpan) / 2
        
        children.forEach((childId, index) => {
          const childAngle = childStartAngle + anglePerChild * index
          positionNode(childId, centerX, centerY, level + 1, childAngle, anglePerChild)
        })
      }
    }
    
    // Start positioning from root
    positionNode(rootNode.id)
    
    // Update all node positions
    const updates = []
    positioned.forEach((pos, nodeId) => {
      updates.push({
        id: nodeId,
        positionX: Math.round(pos.x),
        positionY: Math.round(pos.y)
      })
    })
    
    console.log('Updating node positions...')
    
    // Batch update
    const updateResponse = await fetch(
      'http://localhost:3001/api/mindmaps/681d4506-bde3-43e9-b63d-518861e45bc7/nodes/batch-update',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      }
    )
    
    if (!updateResponse.ok) {
      throw new Error('Failed to update node positions')
    }
    
    // Update canvas to show the full mind map
    await fetch('http://localhost:3001/api/mindmaps/681d4506-bde3-43e9-b63d-518861e45bc7/canvas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoom: 0.5,
        panX: -200,
        panY: -100
      })
    })
    
    console.log('Successfully repositioned all nodes!')
    console.log('Refresh the browser to see the updated layout')
    
  } catch (error) {
    console.error('Error fixing layout:', error)
  }
}

fixAWSMindMapLayout()