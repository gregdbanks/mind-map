import type { Node } from '../types/mindMap';
import { fixRadialOverlaps } from './simpleCollisionFix';

export function createClusteredLayout(
  nodes: Map<string, Node>,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeArray = Array.from(nodes.values());
  
  if (nodeArray.length === 0) return positions;
  
  // Find root
  const root = nodeArray.find(n => !n.parent);
  if (!root) return positions;
  
  // Use full canvas - no artificial boundaries
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Position root at center
  positions.set(root.id, { x: centerX, y: centerY });
  
  // Get first-level branches
  const branches = nodeArray.filter(n => n.parent === root.id);
  
  if (branches.length === 0) return positions;
  
  // Calculate total nodes to determine spacing
  const totalNodes = nodeArray.length;
  
  // More aggressive root radius to spread main branches
  const baseRadius = Math.min(width, height) * 0.25; // Use 25% of smaller dimension
  const complexityFactor = Math.log10(totalNodes + 1);
  const rootRadius = Math.max(280, baseRadius + complexityFactor * 60); // Increased minimum and scaling
  
  // Position branches in a circle around root
  const angleStep = (2 * Math.PI) / branches.length;
  
  branches.forEach((branch, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const x = centerX + rootRadius * Math.cos(angle);
    const y = centerY + rootRadius * Math.sin(angle);
    positions.set(branch.id, { x, y });
    
    // Position children of this branch
    positionBranchChildren(branch, nodeArray, positions, angle, x, y, centerX, centerY, 1, totalNodes);
  });
  
  // Apply collision detection to fix overlaps
  const collisionNodes = Array.from(positions.entries()).map(([id, pos]) => ({
    id,
    x: pos.x,
    y: pos.y
  }));
  
  const collisionFreePositions = fixRadialOverlaps(
    collisionNodes,
    centerX,
    centerY,
    60,  // Node radius
    130  // Minimum distance between nodes
  );
  
  return collisionFreePositions;
}

function positionBranchChildren(
  parent: Node,
  allNodes: Node[],
  positions: Map<string, { x: number; y: number }>,
  branchAngle: number,
  parentX: number,
  parentY: number,
  centerX: number,
  centerY: number,
  depth: number = 1,
  totalNodes: number = 100
) {
  const children = allNodes.filter(n => n.parent === parent.id);
  if (children.length === 0) return;
  
  // Much more aggressive spacing to prevent overlaps
  const depthFactor = Math.pow(0.75, depth - 1); // More aggressive reduction per depth
  const sizeFactor = Math.max(1.5, Math.log10(totalNodes) * 0.8); // Scale more with tree size
  const baseRadius = 220 * sizeFactor; // Increased base radius
  const childRadius = baseRadius * depthFactor;
  
  // Much wider spread angles to prevent clustering
  const maxSpreadAngle = Math.PI / 1.2; // 150 degrees max (wider)
  const childCountFactor = Math.min(1, children.length / 6); // Lower threshold for many children
  const spreadAngle = maxSpreadAngle * (1 - childCountFactor * 0.3); // Less reduction for many children
  
  if (children.length === 1) {
    // Single child continues in same direction with some distance
    const x = parentX + childRadius * Math.cos(branchAngle);
    const y = parentY + childRadius * Math.sin(branchAngle);
    positions.set(children[0].id, { x, y });
    
    // Recurse
    positionBranchChildren(children[0], allNodes, positions, branchAngle, x, y, centerX, centerY, depth + 1, totalNodes);
  } else {
    // Multiple children fan out with smart angle distribution
    const angleStep = children.length > 1 ? spreadAngle / (children.length - 1) : 0;
    const startAngle = branchAngle - spreadAngle / 2;
    
    children.forEach((child, i) => {
      const angle = startAngle + i * angleStep;
      
      // Add more significant jitter to break up clustering patterns
      const jitterFactor = 0.15; // 15% position jitter
      const radiusJitter = childRadius * (1 + (Math.random() - 0.5) * jitterFactor);
      const angleJitter = angle + (Math.random() - 0.5) * jitterFactor * 0.5; // Angle jitter
      
      const x = parentX + radiusJitter * Math.cos(angleJitter);
      const y = parentY + radiusJitter * Math.sin(angleJitter);
      positions.set(child.id, { x, y });
      
      // Recurse with child's specific angle
      positionBranchChildren(child, allNodes, positions, angle, x, y, centerX, centerY, depth + 1, totalNodes);
    });
  }
}