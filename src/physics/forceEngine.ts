import * as d3 from 'd3';
import type { Node, Link } from '../types/mindMap';

export interface ForceConfig {
  charge: {
    strength: number;
    distanceMax: number;
  };
  link: {
    distance: number;
    strength: number;
  };
  collision: {
    radius: number;
    strength: number;
  };
  center: {
    strength: number;
  };
}

const defaultConfig: ForceConfig = {
  charge: {
    strength: -300,    // Much gentler repulsion
    distanceMax: 200,
  },
  link: {
    distance: 150,
    strength: 0.3,     // Gentle link force
  },
  collision: {
    radius: 80,
    strength: 0.5,     // Gentle collision
  },
  center: {
    strength: 0.01,    // Very weak center pull
  },
};

export class ForceEngine {
  private simulation: d3.Simulation<Node, Link>;
  private nodes: Node[];
  private links: Link[];
  private config: ForceConfig;

  constructor(nodes: Node[], links: Link[], config: Partial<ForceConfig> = {}) {
    this.nodes = nodes;
    // Create a deep copy of links to prevent D3 from mutating the original
    this.links = links.map(link => ({ ...link }));
    this.config = { ...defaultConfig, ...config };
    
    // Create the simulation with faster settling
    this.simulation = d3.forceSimulation(nodes)
      .alphaDecay(0.05)        // Faster decay = quicker settling
      .velocityDecay(0.6)      // More friction = less jitter
      .alphaMin(0.001)         // Stop sooner
      .alpha(0.3);             // Start with lower energy to prevent violent movement
    
    // Apply forces
    this.applyForces();
  }

  private applyForces() {
    // Link force - connects parent-child nodes
    const linkForce = d3.forceLink<Node, Link>(this.links)
      .id(d => d.id)
      .distance(this.config.link.distance)
      .strength(this.config.link.strength);
    
    // Charge force - creates repulsion between nodes
    const chargeForce = d3.forceManyBody<Node>()
      .strength(this.config.charge.strength)
      .distanceMax(this.config.charge.distanceMax);
    
    // Collision force - prevents node overlap
    const collisionForce = d3.forceCollide<Node>()
      .radius(this.config.collision.radius)
      .strength(this.config.collision.strength);
    
    // Center force - gently pulls nodes toward center of viewport
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 600;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
    const centerForce = d3.forceCenter<Node>(centerX, centerY)
      .strength(this.config.center.strength);
    
    // Apply all forces to simulation
    this.simulation
      .force('link', linkForce)
      .force('charge', chargeForce)
      .force('collision', collisionForce)
      .force('center', centerForce);
  }

  onTick(callback: (nodes: Node[]) => void) {
    this.simulation.on('tick', () => {
      callback(this.simulation.nodes());
    });
  }

  updateNodes(nodes: Node[], shouldRestart: boolean = true) {
    this.nodes = nodes;
    this.simulation.nodes(nodes);
    if (shouldRestart) {
      this.simulation.alpha(1).restart();
    }
  }

  updateLinks(links: Link[], shouldRestart: boolean = true) {
    // Create a deep copy to prevent D3 from mutating the original
    this.links = links.map(link => ({ ...link }));
    const linkForce = this.simulation.force<d3.ForceLink<Node, Link>>('link');
    if (linkForce) {
      linkForce
        .links(this.links)
        .id(d => (d as Node).id);
    }
    if (shouldRestart) {
      this.simulation.alpha(1).restart();
    }
  }

  stop() {
    this.simulation.stop();
  }

  restart() {
    this.simulation.alpha(1).restart();
  }

  isRunning(): boolean {
    return this.simulation.alpha() > this.simulation.alphaMin();
  }

  // Drag interaction methods
  dragStart(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Lower alpha target for less aggressive movement
    this.simulation.alphaTarget(0.1).restart();
    node.fx = node.x;
    node.fy = node.y;
  }

  drag(nodeId: string, x: number, y: number) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    node.fx = x;
    node.fy = y;
  }

  dragEnd(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    this.simulation.alphaTarget(0);
    node.fx = null;
    node.fy = null;
  }

  // Get current positions
  getPositions(): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    this.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        positions.set(node.id, { x: node.x, y: node.y });
      }
    });
    return positions;
  }
}