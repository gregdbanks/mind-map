import type { Node, NodeSize } from '../types/mindMap';

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

// Predetermined size presets for user-controlled node sizing
export const NODE_SIZE_PRESETS: Record<NonNullable<NodeSize>, {
  width: number; height: number; borderRadius: number;
  fontSize: number; fontWeight: string; strokeWidth: number;
}> = {
  xs: { width: 50,  height: 22, borderRadius: 6,  fontSize: 8,  fontWeight: '300', strokeWidth: 0.8 },
  sm: { width: 75,  height: 32, borderRadius: 8,  fontSize: 10, fontWeight: '400', strokeWidth: 1.2 },
  md: { width: 110, height: 46, borderRadius: 12, fontSize: 13, fontWeight: '500', strokeWidth: 2.0 },
  lg: { width: 170, height: 66, borderRadius: 16, fontSize: 17, fontWeight: '600', strokeWidth: 3.0 },
  xl: { width: 240, height: 90, borderRadius: 20, fontSize: 22, fontWeight: '700', strokeWidth: 4.0 },
};

/**
 * Get visual properties based on node depth, theme, and optional size override.
 * When size is provided, dimensions come from the preset; colors still from depth.
 */
export function getNodeVisualProperties(depth: number, isDark = false, size?: NodeSize) {
  const maxDepth = 5;
  const clampedDepth = Math.min(depth, maxDepth);

  // Dimensions: use size preset if provided, otherwise depth-based
  let width: number, height: number, borderRadius: number, strokeWidth: number, fontSize: number, fontWeight: string;

  if (size && NODE_SIZE_PRESETS[size]) {
    const preset = NODE_SIZE_PRESETS[size];
    width = preset.width;
    height = preset.height;
    borderRadius = preset.borderRadius;
    strokeWidth = preset.strokeWidth;
    fontSize = preset.fontSize;
    fontWeight = preset.fontWeight;
  } else {
    const widths = [120, 110, 100, 90, 80, 72];
    const heights = [52, 46, 42, 38, 34, 30];
    const borderRadii = [14, 12, 10, 10, 8, 8];
    width = widths[clampedDepth];
    height = heights[clampedDepth];
    borderRadius = borderRadii[clampedDepth];

    const strokeWidths = [3, 2.5, 2, 1.8, 1.5, 1.2];
    strokeWidth = strokeWidths[clampedDepth];

    const fontSizes = [14, 13, 12, 11, 10, 10];
    fontSize = fontSizes[clampedDepth];

    const fontWeights = ['600', '500', '400', '400', '300', '300'];
    fontWeight = fontWeights[clampedDepth];
  }

  // Keep radius for backward compat (used by some callers)
  const radius = Math.max(width, height) / 2;

  // Theme-aware colors always come from depth (not size)
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
    const props = getNodeVisualProperties(depth, false, node.size);
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
