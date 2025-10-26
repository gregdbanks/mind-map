import * as d3 from 'd3';
import type { Node, Link } from '../types/mindMap';

export interface ForceNode extends d3.SimulationNodeDatum {
  id: string;
  text: string;
  parent?: string | null;
}

export interface ForceLink extends d3.SimulationLinkDatum<ForceNode> {
  source: string | ForceNode;
  target: string | ForceNode;
}

export function createForceDirectedLayout(
  nodes: Map<string, Node>,
  links: Link[],
  width: number,
  height: number,
  onUpdate?: (positions: Map<string, { x: number; y: number }>) => void
): d3.Simulation<ForceNode, ForceLink> {
  // Convert nodes to force simulation format
  const forceNodes: ForceNode[] = Array.from(nodes.values()).map(node => ({
    id: node.id,
    text: node.text,
    parent: node.parent,
    x: Math.random() * width,
    y: Math.random() * height
  }));

  // Convert links to force simulation format
  const forceLinks: ForceLink[] = links.map(link => ({
    source: link.source,
    target: link.target
  }));

  // Use full canvas for physics simulation - only avoid toolbar
  const topMargin = 80;  // Minimal space for toolbar
  const centerX = width / 2;
  const centerY = height / 2;

  // Create simulation with forces - no artificial boundaries
  const simulation = d3.forceSimulation<ForceNode>(forceNodes)
    .force('link', d3.forceLink<ForceNode, ForceLink>(forceLinks)
      .id(d => d.id)
      .distance(150) // Base link distance
      .strength(0.8))
    .force('charge', d3.forceManyBody()
      .strength(-300) // Repulsion strength
      .distanceMax(300)) // Limit interaction distance
    .force('center', d3.forceCenter(centerX, centerY))
    .force('collision', d3.forceCollide()
      .radius(40) // Node collision radius
      .strength(0.7))
    .force('x', d3.forceX(centerX).strength(0.05)) // Very weak centering to allow spread
    .force('y', d3.forceY(centerY).strength(0.05)) // Very weak centering to allow spread
    .force('toolbarAvoid', () => {
      // Custom force to gently push nodes away from toolbar area
      forceNodes.forEach(node => {
        if (node.y && node.y < topMargin + 30) {
          node.vy = (node.vy || 0) + 0.5; // Gentle downward push
        }
      });
    })
    .alphaDecay(0.02) // Slower cooling
    .velocityDecay(0.4); // Some friction

  // Position root node at center for better stability
  const rootNode = forceNodes.find(n => !n.parent);
  if (rootNode) {
    rootNode.fx = centerX; // Fix root position
    rootNode.fy = centerY;
  }

  // Update positions callback - completely free physics simulation
  if (onUpdate) {
    simulation.on('tick', () => {
      const positions = new Map<string, { x: number; y: number }>();
      forceNodes.forEach(node => {
        // Let physics run completely free - no hard constraints
        positions.set(node.id, { 
          x: node.x || centerX, 
          y: node.y || centerY 
        });
      });
      onUpdate(positions);
    });
  }

  return simulation;
}

export function applyForceDirectedLayout(
  nodes: Map<string, Node>,
  links: Link[],
  updatePositions: (positions: Map<string, { x: number; y: number }>) => void,
  width?: number,
  height?: number
): d3.Simulation<ForceNode, ForceLink> {
  const w = width || window.innerWidth;
  const h = height || window.innerHeight;
  
  return createForceDirectedLayout(nodes, links, w, h, updatePositions);
}