import * as d3 from 'd3';
import type { Node } from '../types/mindMap';
import { fixOverlaps } from './simpleCollisionFix';

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
  _nodeWidth: number = 150, // Underscore prefix for unused
  _nodeHeight: number = 50  // Underscore prefix for unused
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Minimal constraints - only avoid toolbar
  const topMargin = 80;  // Space for toolbar
  
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
  
  // Create tree layout with proper level spacing
  const treeLayout = d3.tree<HierarchyNode>()
    .size([width * 0.8, height - topMargin - 100]) // Use most of the canvas
    .nodeSize([200, 140]) // Fixed spacing: 200px horizontal, 140px vertical
    .separation((a, b) => a.parent === b.parent ? 1.2 : 1.8); // More separation between branches
  
  // Apply the layout
  treeLayout(hierarchyRoot);
  
  // Extract initial positions using full canvas (skip virtual root if it exists)
  const initialPositions = new Map<string, { x: number; y: number }>();
  hierarchyRoot.each((node) => {
    if (node.data.id !== '__virtual_root__') {
      initialPositions.set(node.data.id, {
        x: node.x! + width / 2, // Center horizontally in full canvas
        y: node.y! + topMargin  // Position below toolbar
      });
    }
  });
  
  // Apply collision detection to prevent overlaps
  const collisionNodes = Array.from(initialPositions.entries()).map(([id, pos]) => ({
    id,
    x: pos.x,
    y: pos.y
  }));
  
  const collisionFreePositions = fixOverlaps(
    collisionNodes,
    60,  // Node radius
    130, // Minimum distance
    30   // Conservative iterations to preserve tree structure
  );
  
  return collisionFreePositions;
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