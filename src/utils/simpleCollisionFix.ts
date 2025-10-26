/**
 * Simple but effective collision detection and resolution
 * Focuses on preventing node overlaps without artificial boundaries
 */

export interface SimpleNode {
  id: string;
  x: number;
  y: number;
}

/**
 * Detect and resolve overlapping nodes using iterative separation
 */
export function fixOverlaps(
  nodes: SimpleNode[],
  _nodeRadius: number = 60, // Underscore prefix for unused parameter
  minDistance: number = 130,
  maxIterations: number = 50
): Map<string, { x: number; y: number }> {
  
  const result = new Map<string, { x: number; y: number }>();
  
  if (nodes.length === 0) return result;
  
  // Create working copies
  const workingNodes = nodes.map(node => ({
    ...node,
    vx: 0,
    vy: 0
  }));
  
  // Iterative collision resolution
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasCollisions = false;
    
    // Reset velocities
    workingNodes.forEach(node => {
      node.vx = 0;
      node.vy = 0;
    });
    
    // Check all pairs for overlaps
    for (let i = 0; i < workingNodes.length; i++) {
      for (let j = i + 1; j < workingNodes.length; j++) {
        const nodeA = workingNodes[i];
        const nodeB = workingNodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance && distance > 0) {
          hasCollisions = true;
          
          // Calculate separation needed
          const overlap = minDistance - distance;
          const separationForce = overlap / distance * 0.5; // 50% separation per iteration
          
          const forceX = dx * separationForce;
          const forceY = dy * separationForce;
          
          // Apply repulsion forces
          nodeA.vx -= forceX;
          nodeA.vy -= forceY;
          nodeB.vx += forceX;
          nodeB.vy += forceY;
        }
      }
    }
    
    // Apply velocities to positions
    workingNodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
    });
    
    // Early exit if no more collisions
    if (!hasCollisions) {
      break;
    }
  }
  
  // Store final positions
  workingNodes.forEach(node => {
    result.set(node.id, { x: node.x, y: node.y });
  });
  
  return result;
}

/**
 * Specialized collision fix for radial layouts
 * Maintains radial structure while preventing overlaps
 */
export function fixRadialOverlaps(
  nodes: SimpleNode[],
  centerX: number,
  centerY: number,
  nodeRadius: number = 60,
  minDistance: number = 130
): Map<string, { x: number; y: number }> {
  
  if (nodes.length === 0) return new Map();
  
  // First apply basic collision detection
  const basicFixed = fixOverlaps(nodes, nodeRadius, minDistance, 30);
  
  // Group nodes by distance from center for radial refinement
  const nodesWithDistance = Array.from(basicFixed.entries()).map(([id, pos]) => {
    const distance = Math.sqrt(
      Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2)
    );
    return { id, x: pos.x, y: pos.y, distance };
  }).sort((a, b) => a.distance - b.distance);
  
  // Group into rings based on distance
  const rings = new Map<number, typeof nodesWithDistance>();
  const ringSize = 150;
  
  nodesWithDistance.forEach(node => {
    const ring = Math.floor(node.distance / ringSize);
    if (!rings.has(ring)) {
      rings.set(ring, []);
    }
    rings.get(ring)!.push(node);
  });
  
  const finalResult = new Map<string, { x: number; y: number }>();
  
  // Spread nodes within each ring to avoid angular clustering
  rings.forEach((ringNodes, ringIndex) => {
    if (ringNodes.length <= 1) {
      ringNodes.forEach(node => {
        finalResult.set(node.id, { x: node.x, y: node.y });
      });
      return;
    }
    
    // Calculate target radius for this ring
    const targetRadius = Math.max(120, ringIndex * ringSize + ringSize / 2);
    
    // Calculate minimum angle between nodes to prevent overlap
    const circumference = 2 * Math.PI * targetRadius;
    const minAngleForSeparation = (minDistance / circumference) * 2 * Math.PI;
    const requiredTotalAngle = minAngleForSeparation * ringNodes.length;
    
    // If we need more space than a full circle, expand the radius
    let adjustedRadius = targetRadius;
    if (requiredTotalAngle > 2 * Math.PI) {
      adjustedRadius = (minDistance * ringNodes.length) / (2 * Math.PI);
    }
    
    // Distribute nodes evenly around the adjusted ring
    const angleStep = (2 * Math.PI) / ringNodes.length;
    
    ringNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = centerX + adjustedRadius * Math.cos(angle);
      const y = centerY + adjustedRadius * Math.sin(angle);
      
      finalResult.set(node.id, { x, y });
    });
  });
  
  return finalResult;
}