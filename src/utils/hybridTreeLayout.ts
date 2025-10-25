import type { Node } from '../types/mindMap';
import { calculateNodeDepths } from './nodeHierarchy';

interface TreeNode extends Node {
  depth?: number;
  subtreeWidth?: number;
  xOffset?: number;
}

export function createHybridTreeLayout(
  nodes: Map<string, Node>,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeArray = Array.from(nodes.values()) as TreeNode[];
  
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
  
  // Calculate subtree widths bottom-up
  function calculateSubtreeWidth(node: TreeNode): number {
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) {
      node.subtreeWidth = 100; // Leaf node width
      return 100;
    }
    
    let totalWidth = 0;
    children.forEach(child => {
      totalWidth += calculateSubtreeWidth(child);
    });
    
    node.subtreeWidth = Math.max(100, totalWidth);
    return node.subtreeWidth;
  }
  
  calculateSubtreeWidth(root);
  
  // Position nodes top-down
  const levelHeight = 150; // Vertical spacing between levels
  const nodeSpacing = 20; // Horizontal spacing between nodes
  
  function positionNode(node: TreeNode, x: number, y: number) {
    positions.set(node.id, { x, y });
    
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) return;
    
    // Position children
    const totalChildWidth = children.reduce((sum, child) => sum + (child.subtreeWidth || 100), 0);
    const spacing = children.length > 1 ? (children.length - 1) * nodeSpacing : 0;
    const totalWidth = totalChildWidth + spacing;
    
    let currentX = x - totalWidth / 2;
    const childY = y + levelHeight;
    
    children.forEach(child => {
      const childWidth = child.subtreeWidth || 100;
      const childX = currentX + childWidth / 2;
      positionNode(child, childX, childY);
      currentX += childWidth + nodeSpacing;
    });
  }
  
  // Start positioning from root
  positionNode(root, width / 2, 100);
  
  // Apply padding constraints
  const padding = 50;
  positions.forEach((pos, nodeId) => {
    pos.x = Math.max(padding, Math.min(width - padding, pos.x));
    pos.y = Math.max(padding, Math.min(height - padding, pos.y));
  });
  
  return positions;
}