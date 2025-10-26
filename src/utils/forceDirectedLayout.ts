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

  // Add safe margins for UI elements
  const topMargin = 120;
  const sideMargin = 50;
  const bottomMargin = 50;
  
  const usableWidth = width - (2 * sideMargin);
  const usableHeight = height - topMargin - bottomMargin;
  const centerX = sideMargin + usableWidth / 2;
  const centerY = topMargin + usableHeight / 2;

  // Create simulation with forces
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
    .force('x', d3.forceX(centerX).strength(0.1)) // Weak centering force
    .force('y', d3.forceY(centerY).strength(0.1))
    .alphaDecay(0.02) // Slower cooling
    .velocityDecay(0.4); // Some friction

  // Position root node at center for better stability
  const rootNode = forceNodes.find(n => !n.parent);
  if (rootNode) {
    rootNode.fx = centerX; // Fix root position
    rootNode.fy = centerY;
  }

  // Update positions callback
  if (onUpdate) {
    simulation.on('tick', () => {
      const positions = new Map<string, { x: number; y: number }>();
      forceNodes.forEach(node => {
        // Constrain nodes to usable area
        const constrainedX = Math.max(sideMargin, Math.min(width - sideMargin, node.x || centerX));
        const constrainedY = Math.max(topMargin, Math.min(height - bottomMargin, node.y || centerY));
        
        positions.set(node.id, { 
          x: constrainedX, 
          y: constrainedY 
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