import type { Node } from '../types/mindMap';

export function createClusteredLayout(
  nodes: Map<string, Node>,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeArray = Array.from(nodes.values());
  
  // Find root
  const root = nodeArray.find(n => !n.parent);
  if (!root) return positions;
  
  // Center root
  positions.set(root.id, { x: width / 2, y: height / 2 });
  
  // Get first-level branches
  const branches = nodeArray.filter(n => n.parent === root.id);
  
  // Position branches in a circle around root
  const angleStep = (2 * Math.PI) / branches.length;
  const rootRadius = 300; // Increased distance from root
  
  branches.forEach((branch, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const x = width / 2 + rootRadius * Math.cos(angle);
    const y = height / 2 + rootRadius * Math.sin(angle);
    positions.set(branch.id, { x, y });
    
    // Position children of this branch
    positionBranchChildren(branch, nodeArray, positions, angle, x, y, 1);
  });
  
  return positions;
}

function positionBranchChildren(
  parent: Node,
  allNodes: Node[],
  positions: Map<string, { x: number; y: number }>,
  branchAngle: number,
  parentX: number,
  parentY: number,
  depth: number = 1
) {
  const children = allNodes.filter(n => n.parent === parent.id);
  if (children.length === 0) return;
  
  // Reduce radius as we go deeper to prevent excessive spread
  const baseRadius = 150;
  const childRadius = baseRadius * Math.pow(0.8, depth - 1); // Progressively shorter
  const spreadAngle = Math.PI / 2; // 90 degree spread for more separation
  
  if (children.length === 1) {
    // Single child continues in same direction
    const x = parentX + childRadius * Math.cos(branchAngle);
    const y = parentY + childRadius * Math.sin(branchAngle);
    positions.set(children[0].id, { x, y });
    
    // Recurse
    positionBranchChildren(children[0], allNodes, positions, branchAngle, x, y, depth + 1);
  } else {
    // Multiple children fan out
    // Reduce spread angle at deeper levels
    const actualSpreadAngle = spreadAngle * Math.pow(0.7, depth - 1);
    const angleStep = children.length > 1 ? actualSpreadAngle / (children.length - 1) : 0;
    const startAngle = branchAngle - actualSpreadAngle / 2;
    
    children.forEach((child, i) => {
      const angle = startAngle + i * angleStep;
      const x = parentX + childRadius * Math.cos(angle);
      const y = parentY + childRadius * Math.sin(angle);
      positions.set(child.id, { x, y });
      
      // Recurse with child's specific angle
      positionBranchChildren(child, allNodes, positions, angle, x, y, depth + 1);
    });
  }
}