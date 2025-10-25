import type { Node } from '../types/mindMap';

export interface NodeWithDepth extends Node {
  depth: number;
}

/**
 * Calculate the depth of each node in the hierarchy
 * Root nodes have depth 0, their children depth 1, etc.
 */
export function calculateNodeDepths(nodes: Map<string, Node>): Map<string, number> {
  const depths = new Map<string, number>();
  const nodeArray = Array.from(nodes.values());
  
  // First, find all root nodes (nodes without parents)
  const rootNodes = nodeArray.filter(node => !node.parent);
  
  // BFS to calculate depths
  const queue: { node: Node; depth: number }[] = rootNodes.map(node => ({ node, depth: 0 }));
  
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    depths.set(node.id, depth);
    
    // Find children of current node
    const children = nodeArray.filter(n => n.parent === node.id);
    children.forEach(child => {
      queue.push({ node: child, depth: depth + 1 });
    });
  }
  
  return depths;
}

/**
 * Get visual properties based on node depth
 */
export function getNodeVisualProperties(depth: number) {
  // Define visual hierarchy levels (0 = root, higher = deeper)
  const maxDepth = 5; // After this depth, use the same style
  const clampedDepth = Math.min(depth, maxDepth);
  
  // Sizes decrease as we go deeper
  const sizes = [40, 35, 30, 28, 25, 22];
  const radius = sizes[clampedDepth];
  
  // Border thickness decreases
  const strokeWidths = [3, 2.5, 2, 1.8, 1.5, 1.2];
  const strokeWidth = strokeWidths[clampedDepth];
  
  // Colors become lighter/subtler as we go deeper
  // Using a blue gradient from dark to light
  const colors = [
    '#1a237e', // Deep blue for root
    '#283593', // Slightly lighter
    '#3949ab', // Medium blue
    '#5c6bc0', // Lighter blue
    '#7986cb', // Even lighter
    '#9fa8da'  // Lightest blue
  ];
  const strokeColor = colors[clampedDepth];
  
  // Background colors - from white to very light blue
  const bgColors = [
    '#ffffff', // Pure white for root
    '#f5f7ff', // Very light blue tint
    '#ecf0ff', // Light blue tint
    '#e3e9ff', // More blue tint
    '#dae1ff', // Even more
    '#d1daff'  // Most tinted
  ];
  const fillColor = bgColors[clampedDepth];
  
  // Font sizes
  const fontSizes = [14, 13, 12, 11, 10, 10];
  const fontSize = fontSizes[clampedDepth];
  
  // Font weights
  const fontWeights = ['600', '500', '400', '400', '300', '300'];
  const fontWeight = fontWeights[clampedDepth];
  
  return {
    radius,
    strokeWidth,
    strokeColor,
    fillColor,
    fontSize,
    fontWeight
  };
}

/**
 * Get link visual properties based on source and target depths
 */
export function getLinkVisualProperties(sourceDepth: number, targetDepth: number) {
  // Links get thinner as they connect deeper nodes
  const avgDepth = (sourceDepth + targetDepth) / 2;
  const maxDepth = 5;
  const clampedDepth = Math.min(avgDepth, maxDepth);
  
  const widths = [2.5, 2, 1.8, 1.5, 1.2, 1];
  const strokeWidth = widths[Math.floor(clampedDepth)];
  
  const opacities = [0.6, 0.5, 0.4, 0.35, 0.3, 0.25];
  const opacity = opacities[Math.floor(clampedDepth)];
  
  return {
    strokeWidth,
    opacity
  };
}