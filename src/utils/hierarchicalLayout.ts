import * as d3 from 'd3';
import type { Node } from '../types/mindMap';

export interface HierarchyNode {
  id: string;
  text: string;
  parent?: string | null;
  children?: HierarchyNode[];
  x?: number;
  y?: number;
  depth?: number;
}

export function createHierarchicalLayout(
  nodes: Map<string, Node>,
  width: number = 1600,
  height: number = 1200,
  nodeWidth: number = 150,
  nodeHeight: number = 50
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Add safe margins for UI elements
  const topMargin = 120;  // Space for toolbar and tooltip
  const sideMargin = 50;   // General padding
  const bottomMargin = 50;
  
  // Calculate usable area
  const usableWidth = width - (2 * sideMargin);
  const usableHeight = height - topMargin - bottomMargin;
  
  // Convert nodes to hierarchy format
  const nodeArray = Array.from(nodes.values());
  const nodeMap = new Map<string, HierarchyNode>();
  
  // First pass: create hierarchy nodes
  nodeArray.forEach(node => {
    nodeMap.set(node.id, {
      id: node.id,
      text: node.text,
      parent: node.parent,
      children: []
    });
  });
  
  // Second pass: build parent-child relationships
  nodeArray.forEach(node => {
    if (node.parent) {
      const parent = nodeMap.get(node.parent);
      if (parent) {
        parent.children!.push(nodeMap.get(node.id)!);
      }
    }
  });
  
  // Find root nodes (nodes without parents)
  const roots = nodeArray.filter(node => !node.parent);
  
  if (roots.length === 0) return positions;
  
  // Create a single root if there are multiple roots
  let hierarchyRoot: d3.HierarchyNode<HierarchyNode>;
  if (roots.length === 1) {
    hierarchyRoot = d3.hierarchy(nodeMap.get(roots[0].id)!);
  } else {
    // Create virtual root
    const virtualRoot: HierarchyNode = {
      id: '__virtual_root__',
      text: 'Virtual Root',
      children: roots.map(root => nodeMap.get(root.id)!)
    };
    hierarchyRoot = d3.hierarchy(virtualRoot);
  }
  
  // Create tree layout using usable area
  const treeLayout = d3.tree<HierarchyNode>()
    .size([usableWidth, usableHeight])
    .nodeSize([nodeWidth * 1.5, nodeHeight * 3]) // Add spacing between nodes
    .separation((a, b) => a.parent === b.parent ? 1 : 1.5);
  
  // Apply the layout
  treeLayout(hierarchyRoot);
  
  // Extract positions (skip virtual root if it exists)
  hierarchyRoot.each((node) => {
    if (node.data.id !== '__virtual_root__') {
      positions.set(node.data.id, {
        x: node.x! + sideMargin + usableWidth / 2, // Center horizontally in usable area
        y: node.y! + topMargin // Position in safe area
      });
    }
  });
  
  return positions;
}

export function applyHierarchicalLayout(
  nodes: Map<string, Node>,
  updatePositions: (positions: Map<string, { x: number; y: number }>) => void,
  width?: number,
  height?: number
) {
  const positions = createHierarchicalLayout(nodes, width, height);
  
  // Update node positions with fixed positions to prevent simulation from moving them
  const updatedPositions = new Map<string, { x: number; y: number }>();
  positions.forEach((pos, nodeId) => {
    updatedPositions.set(nodeId, {
      x: pos.x,
      y: pos.y
    });
  });
  
  updatePositions(updatedPositions);
}