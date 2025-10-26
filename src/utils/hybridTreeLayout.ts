import type { Node } from '../types/mindMap';
import { calculateNodeDepths } from './nodeHierarchy';
import { fixOverlaps } from './simpleCollisionFix';

interface TreeNode extends Node {
  depth?: number;
  subtreeWidth?: number;
  children?: TreeNode[];
}

export function createHybridTreeLayout(
  nodes: Map<string, Node>,
  width: number,
  _height: number // Underscore prefix to indicate intentionally unused
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeArray = Array.from(nodes.values()) as TreeNode[];
  
  if (nodeArray.length === 0) return positions;
  
  // Calculate depths
  const depths = calculateNodeDepths(nodes);
  nodeArray.forEach(node => {
    node.depth = depths.get(node.id) || 0;
  });
  
  // Find root
  const root = nodeArray.find(n => !n.parent);
  if (!root) return positions;
  
  // Build tree structure
  const childrenMap = new Map<string, TreeNode[]>();
  nodeArray.forEach(node => {
    if (node.parent) {
      const siblings = childrenMap.get(node.parent) || [];
      siblings.push(node);
      childrenMap.set(node.parent, siblings);
    }
  });
  
  // Add children reference to each node
  nodeArray.forEach(node => {
    node.children = childrenMap.get(node.id) || [];
  });
  
  // Fixed spacing for clear hierarchical structure
  const horizontalSpacing = 180;  // Space between siblings
  const verticalSpacing = 140;    // Space between levels
  
  // Group nodes by their actual depth levels
  const nodesByLevel = new Map<number, TreeNode[]>();
  nodeArray.forEach(node => {
    const level = node.depth || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });
  
  // Calculate positions level by level
  const maxDepth = Math.max(...Array.from(depths.values()));
  const topMargin = 80;  // Minimal top margin for toolbar
  
  // Position root at center top
  const rootX = width / 2;
  const rootY = topMargin + 50;
  positions.set(root.id, { x: rootX, y: rootY });
  
  // Process each level from top to bottom
  for (let level = 1; level <= maxDepth; level++) {
    const nodesAtLevel = nodesByLevel.get(level) || [];
    const levelY = rootY + (level * verticalSpacing);
    
    // Group nodes by their parent to maintain tree structure
    const nodesByParent = new Map<string, TreeNode[]>();
    nodesAtLevel.forEach(node => {
      const parentId = node.parent || 'root';
      if (!nodesByParent.has(parentId)) {
        nodesByParent.set(parentId, []);
      }
      nodesByParent.get(parentId)!.push(node);
    });
    
    // Position each group of siblings
    nodesByParent.forEach((siblings, parentId) => {
      // Get parent position
      let parentX = rootX; // Default if no parent found
      if (parentId !== 'root') {
        const parentPos = positions.get(parentId);
        if (parentPos) {
          parentX = parentPos.x;
        }
      }
      
      // Calculate positions for siblings
      if (siblings.length === 1) {
        // Single child goes directly under parent
        positions.set(siblings[0].id, { x: parentX, y: levelY });
      } else {
        // Multiple children spread horizontally
        const totalWidth = (siblings.length - 1) * horizontalSpacing;
        const startX = parentX - (totalWidth / 2);
        
        siblings.forEach((sibling, index) => {
          const siblingX = startX + (index * horizontalSpacing);
          positions.set(sibling.id, { x: siblingX, y: levelY });
        });
      }
    });
  }
  
  // Apply collision detection to prevent overlaps
  const collisionNodes = Array.from(positions.entries()).map(([id, pos]) => ({
    id,
    x: pos.x,
    y: pos.y
  }));
  
  const collisionFreePositions = fixOverlaps(
    collisionNodes,
    60,  // Node radius
    130, // Minimum distance
    40   // Max iterations for tree layouts
  );
  
  return collisionFreePositions;
}