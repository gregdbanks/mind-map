/**
 * Universal collision avoidance system for mind map layouts
 * Provides iterative force-based collision resolution for any layout algorithm
 */

export interface CollisionNode {
  id: string;
  x: number;
  y: number;
  radius?: number;
}

export interface CollisionAvoidanceOptions {
  minDistance?: number;          // Minimum distance between node centers
  iterations?: number;           // Number of collision resolution iterations
  damping?: number;              // Force damping factor (0-1)
  boundaryPadding?: number;      // Padding from viewport edges
  preserveRelativePositions?: boolean; // Try to maintain original relative positions
}

const DEFAULT_OPTIONS: Required<CollisionAvoidanceOptions> = {
  minDistance: 120,              // Enough space for node + text
  iterations: 50,                // More iterations for better results
  damping: 0.3,                  // Conservative movement
  boundaryPadding: 100,          // Safe margin from edges
  preserveRelativePositions: true
};

/**
 * Apply collision avoidance to a set of positioned nodes
 */
export function avoidCollisions(
  nodes: CollisionNode[],
  viewportWidth: number,
  viewportHeight: number,
  options: CollisionAvoidanceOptions = {}
): Map<string, { x: number; y: number }> {
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result = new Map<string, { x: number; y: number }>();
  
  if (nodes.length === 0) return result;
  
  // Create working copies of node positions
  const workingNodes = nodes.map(node => ({
    ...node,
    radius: node.radius || 60, // Default node radius
    vx: 0, // velocity
    vy: 0
  }));

  // Calculate viewport bounds with padding
  const minX = opts.boundaryPadding;
  const maxX = viewportWidth - opts.boundaryPadding;
  const minY = opts.boundaryPadding;
  const maxY = viewportHeight - opts.boundaryPadding;

  // Iterative collision resolution
  for (let iteration = 0; iteration < opts.iterations; iteration++) {
    let hasCollisions = false;
    
    // Reset velocities
    workingNodes.forEach(node => {
      node.vx = 0;
      node.vy = 0;
    });
    
    // Check all pairs for collisions
    for (let i = 0; i < workingNodes.length; i++) {
      for (let j = i + 1; j < workingNodes.length; j++) {
        const nodeA = workingNodes[i];
        const nodeB = workingNodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = opts.minDistance + (nodeA.radius + nodeB.radius) * 0.5;
        
        if (distance < minDist && distance > 0) {
          hasCollisions = true;
          
          // Calculate separation force
          const overlap = minDist - distance;
          const separationForce = overlap / distance * opts.damping;
          
          const forceX = dx * separationForce * 0.5;
          const forceY = dy * separationForce * 0.5;
          
          // Apply forces (repel both nodes)
          nodeA.vx -= forceX;
          nodeA.vy -= forceY;
          nodeB.vx += forceX;
          nodeB.vy += forceY;
        }
      }
    }
    
    // Apply velocities and boundary constraints
    workingNodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;
      
      // Apply boundary constraints
      node.x = Math.max(minX, Math.min(maxX, node.x));
      node.y = Math.max(minY, Math.min(maxY, node.y));
    });
    
    // Early termination if no more collisions
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
 * Specialized collision avoidance for radial layouts
 * Tries to maintain angular relationships while preventing overlap
 */
export function avoidRadialCollisions(
  nodes: CollisionNode[],
  centerX: number,
  centerY: number,
  viewportWidth: number,
  viewportHeight: number,
  options: CollisionAvoidanceOptions = {}
): Map<string, { x: number; y: number }> {
  
  if (nodes.length === 0) return new Map();
  
  // First pass: regular collision avoidance
  const basicResult = avoidCollisions(nodes, viewportWidth, viewportHeight, {
    ...options,
    preserveRelativePositions: true
  });
  
  // Second pass: radial-specific adjustments
  const adjustedNodes: CollisionNode[] = Array.from(basicResult.entries()).map(([id, pos]) => ({
    id,
    x: pos.x,
    y: pos.y,
    radius: nodes.find(n => n.id === id)?.radius || 60
  }));
  
  // Group nodes by distance from center (rings)
  const nodesByDistance = adjustedNodes.map(node => {
    const distance = Math.sqrt(
      Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2)
    );
    return { ...node, distance };
  }).sort((a, b) => a.distance - b.distance);
  
  // Spread nodes within each ring to avoid angular clustering
  const ringGroups = new Map<number, typeof nodesByDistance>();
  const ringSize = 150; // Distance threshold for grouping into rings
  
  nodesByDistance.forEach(node => {
    const ring = Math.floor(node.distance / ringSize);
    if (!ringGroups.has(ring)) {
      ringGroups.set(ring, []);
    }
    ringGroups.get(ring)!.push(node);
  });
  
  // Redistribute nodes within each ring
  const finalResult = new Map<string, { x: number; y: number }>();
  
  ringGroups.forEach((ringNodes, ring) => {
    if (ringNodes.length <= 1) {
      // Single node or empty ring
      ringNodes.forEach(node => {
        finalResult.set(node.id, { x: node.x, y: node.y });
      });
      return;
    }
    
    // Calculate target radius for this ring
    const targetRadius = Math.max(200, ring * ringSize + ringSize / 2);
    
    // Spread nodes evenly around the ring
    const angleStep = (2 * Math.PI) / ringNodes.length;
    
    ringNodes.forEach((node, index) => {
      // Calculate current angle
      const currentAngle = Math.atan2(node.y - centerY, node.x - centerX);
      
      // Calculate target angle (spread evenly)
      const targetAngle = index * angleStep - Math.PI / 2; // Start from top
      
      // Blend current and target angles to preserve some original positioning
      const blendFactor = 0.3; // How much to move toward even distribution
      const finalAngle = currentAngle * (1 - blendFactor) + targetAngle * blendFactor;
      
      // Position on target radius
      const finalX = centerX + targetRadius * Math.cos(finalAngle);
      const finalY = centerY + targetRadius * Math.sin(finalAngle);
      
      // Apply boundary constraints
      const constrainedX = Math.max(
        options.boundaryPadding || 100,
        Math.min(viewportWidth - (options.boundaryPadding || 100), finalX)
      );
      const constrainedY = Math.max(
        options.boundaryPadding || 100,
        Math.min(viewportHeight - (options.boundaryPadding || 100), finalY)
      );
      
      finalResult.set(node.id, { x: constrainedX, y: constrainedY });
    });
  });
  
  return finalResult;
}