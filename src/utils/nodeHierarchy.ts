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
 * Get visual properties based on node depth and theme
 */
export function getNodeVisualProperties(depth: number, isDark = false) {
  const maxDepth = 5;
  const clampedDepth = Math.min(depth, maxDepth);

  // Rect dimensions decrease as we go deeper
  const widths = [120, 110, 100, 90, 80, 72];
  const heights = [52, 46, 42, 38, 34, 30];
  const borderRadii = [14, 12, 10, 10, 8, 8];
  const width = widths[clampedDepth];
  const height = heights[clampedDepth];
  const borderRadius = borderRadii[clampedDepth];
  // Keep radius for backward compat (used by some callers)
  const radius = Math.max(width, height) / 2;

  // Border thickness decreases
  const strokeWidths = [3, 2.5, 2, 1.8, 1.5, 1.2];
  const strokeWidth = strokeWidths[clampedDepth];

  // Theme-aware colors
  const lightStrokeColors = [
    '#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da'
  ];
  const darkStrokeColors = [
    '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0'
  ];
  const strokeColor = (isDark ? darkStrokeColors : lightStrokeColors)[clampedDepth];

  const lightFillColors = [
    '#ffffff', '#f5f7ff', '#ecf0ff', '#e3e9ff', '#dae1ff', '#d1daff'
  ];
  const darkFillColors = [
    '#1E3A5F', '#1A3350', '#162D45', '#13273D', '#102236', '#0D1D30'
  ];
  const fillColor = (isDark ? darkFillColors : lightFillColors)[clampedDepth];

  // Font sizes
  const fontSizes = [14, 13, 12, 11, 10, 10];
  const fontSize = fontSizes[clampedDepth];

  // Font weights
  const fontWeights = ['600', '500', '400', '400', '300', '300'];
  const fontWeight = fontWeights[clampedDepth];

  return {
    width,
    height,
    borderRadius,
    radius,
    strokeWidth,
    strokeColor,
    fillColor,
    fontSize,
    fontWeight,
    minNoteWidth: 480,
    minNoteHeight: 240,
    maxNoteWidth: 500,
    maxNoteHeight: 800,
  };
}

/**
 * Calculate the point where a link should attach to a node's edge.
 * Uses rect-intersection math for all nodes (standard rects and expanded note rects).
 */
export function getLinkEndpoint(
  nodeX: number,
  nodeY: number,
  otherX: number,
  otherY: number,
  node: Node,
  depth: number
): { x: number; y: number } {
  let halfW: number;
  let halfH: number;

  if (node.noteExpanded && node.noteWidth && node.noteHeight) {
    halfW = node.noteWidth / 2;
    halfH = node.noteHeight / 2;
  } else {
    const props = getNodeVisualProperties(depth);
    halfW = props.width / 2;
    halfH = props.height / 2;
  }

  const dx = otherX - nodeX;
  const dy = otherY - nodeY;

  if (dx === 0 && dy === 0) return { x: nodeX, y: nodeY };

  const tX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const tY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const t = Math.min(tX, tY);

  return {
    x: nodeX + dx * t,
    y: nodeY + dy * t,
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
