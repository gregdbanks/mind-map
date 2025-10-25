// Mock d3 before importing anything else
jest.mock('d3', () => ({
  forceSimulation: jest.fn(),
  forceLink: jest.fn(),
  forceManyBody: jest.fn(),
  forceCollide: jest.fn(),
  forceCenter: jest.fn(),
}));

import { ForceEngine } from '../forceEngine';
import { Node, Link } from '../../types/mindMap';
import * as d3 from 'd3';

describe('ForceEngine', () => {
  let mockSimulation: any;
  let mockForceLink: any;
  let mockForceManyBody: any;
  let mockForceCollide: any;
  let mockForceCenter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock force functions
    mockForceLink = {
      id: jest.fn().mockReturnThis(),
      distance: jest.fn().mockReturnThis(),
      strength: jest.fn().mockReturnThis(),
      links: jest.fn().mockReturnThis(),
    };
    
    mockForceManyBody = {
      strength: jest.fn().mockReturnThis(),
      distanceMax: jest.fn().mockReturnThis(),
    };
    
    mockForceCollide = {
      radius: jest.fn().mockReturnThis(),
      strength: jest.fn().mockReturnThis(),
    };
    
    mockForceCenter = {
      x: jest.fn().mockReturnThis(),
      y: jest.fn().mockReturnThis(),
      strength: jest.fn().mockReturnThis(),
    };
    
    // Create mock simulation
    mockSimulation = {
      force: jest.fn((forceName, forceObject?) => {
        // If called with two arguments (setting a force), return simulation for chaining
        if (forceObject !== undefined) {
          return mockSimulation;
        }
        // If called with one argument (getting a force), return the force
        if (forceName === 'link') return mockForceLink;
        if (forceName === 'charge') return mockForceManyBody;
        if (forceName === 'collision') return mockForceCollide;
        if (forceName === 'center') return mockForceCenter;
        return null;
      }),
      nodes: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      alpha: jest.fn().mockReturnThis(),
      alphaTarget: jest.fn().mockReturnThis(),
      alphaDecay: jest.fn().mockReturnThis(),
      velocityDecay: jest.fn().mockReturnThis(),
      alphaMin: jest.fn().mockReturnThis(),
      restart: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      tick: jest.fn().mockReturnThis(),
    };
    
    // Setup d3 mocks
    (d3.forceSimulation as jest.Mock).mockReturnValue(mockSimulation);
    (d3.forceLink as jest.Mock).mockReturnValue(mockForceLink);
    (d3.forceManyBody as jest.Mock).mockReturnValue(mockForceManyBody);
    (d3.forceCollide as jest.Mock).mockReturnValue(mockForceCollide);
    (d3.forceCenter as jest.Mock).mockReturnValue(mockForceCenter);
  });

  it('should initialize with default configuration', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Test', x: 0, y: 0, collapsed: false, parent: null }
    ];
    const links: Link[] = [];
    
    new ForceEngine(nodes, links);
    
    expect(d3.forceSimulation).toHaveBeenCalledWith(nodes);
    expect(mockSimulation.force).toHaveBeenCalledWith('link', mockForceLink);
    expect(mockSimulation.force).toHaveBeenCalledWith('charge', mockForceManyBody);
    expect(mockSimulation.force).toHaveBeenCalledWith('collision', mockForceCollide);
    expect(mockSimulation.force).toHaveBeenCalledWith('center', mockForceCenter);
  });

  it('should apply custom configuration', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const config = {
      charge: { strength: -500, distanceMax: 300 },
      link: { distance: 80, strength: 0.5 },
      collision: { radius: 40, strength: 0.9 },
      center: { strength: 0.1 },
    };
    
    new ForceEngine(nodes, links, config);
    
    expect(mockForceManyBody.strength).toHaveBeenCalledWith(-500);
    expect(mockForceManyBody.distanceMax).toHaveBeenCalledWith(300);
    expect(mockForceLink.distance).toHaveBeenCalledWith(80);
    expect(mockForceLink.strength).toHaveBeenCalledWith(0.5);
    expect(mockForceCollide.radius).toHaveBeenCalledWith(40);
    expect(mockForceCollide.strength).toHaveBeenCalledWith(0.9);
    expect(mockForceCenter.strength).toHaveBeenCalledWith(0.1);
  });

  it('should setup tick callback', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const onTick = jest.fn();
    
    const engine = new ForceEngine(nodes, links);
    engine.onTick(onTick);
    
    expect(mockSimulation.on).toHaveBeenCalledWith('tick', expect.any(Function));
    
    // Simulate a tick
    const tickHandler = mockSimulation.on.mock.calls[0][1];
    mockSimulation.nodes.mockReturnValue(nodes);
    tickHandler();
    
    expect(onTick).toHaveBeenCalledWith(nodes);
  });

  it('should update nodes and restart simulation', () => {
    const initialNodes: Node[] = [];
    const links: Link[] = [];
    
    const engine = new ForceEngine(initialNodes, links);
    
    const newNodes: Node[] = [
      { id: 'node-1', text: 'New', x: 0, y: 0, collapsed: false, parent: null }
    ];
    
    engine.updateNodes(newNodes);
    
    expect(mockSimulation.nodes).toHaveBeenCalledWith(newNodes);
    expect(mockSimulation.alpha).toHaveBeenCalledWith(1);
    expect(mockSimulation.restart).toHaveBeenCalled();
  });

  it('should update links and restart simulation', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Node 1', x: 0, y: 0, collapsed: false, parent: null },
      { id: 'node-2', text: 'Node 2', x: 50, y: 50, collapsed: false, parent: 'node-1' }
    ];
    const initialLinks: Link[] = [];
    
    const engine = new ForceEngine(nodes, initialLinks);
    
    const newLinks: Link[] = [
      { source: 'node-1', target: 'node-2' }
    ];
    
    engine.updateLinks(newLinks);
    
    // Verify that force('link') was called to get the link force
    expect(mockSimulation.force).toHaveBeenCalledWith('link');
    
    // Verify that the link force methods were called
    expect(mockForceLink.links).toHaveBeenCalledWith(newLinks);
    expect(mockForceLink.id).toHaveBeenCalledWith(expect.any(Function));
    
    expect(mockSimulation.alpha).toHaveBeenCalledWith(1);
    expect(mockSimulation.restart).toHaveBeenCalled();
  });

  it('should stop the simulation', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    const engine = new ForceEngine(nodes, links);
    engine.stop();
    
    expect(mockSimulation.stop).toHaveBeenCalled();
  });

  it('should restart the simulation', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    const engine = new ForceEngine(nodes, links);
    engine.restart();
    
    expect(mockSimulation.alpha).toHaveBeenCalledWith(1);
    expect(mockSimulation.restart).toHaveBeenCalled();
  });

  it('should handle drag start', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Test', x: 10, y: 20, collapsed: false, parent: null }
    ];
    const links: Link[] = [];
    
    const engine = new ForceEngine(nodes, links);
    mockSimulation.alphaTarget.mockReturnValue(mockSimulation);
    
    engine.dragStart('node-1');
    
    expect(mockSimulation.alphaTarget).toHaveBeenCalledWith(0.1);
    expect(mockSimulation.restart).toHaveBeenCalled();
    expect(nodes[0].fx).toBe(10);
    expect(nodes[0].fy).toBe(20);
  });

  it('should handle drag', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Test', x: 10, y: 20, collapsed: false, parent: null }
    ];
    const links: Link[] = [];
    
    const engine = new ForceEngine(nodes, links);
    engine.drag('node-1', 30, 40);
    
    expect(nodes[0].fx).toBe(30);
    expect(nodes[0].fy).toBe(40);
  });

  it('should handle drag end', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Test', x: 10, y: 20, fx: 10, fy: 20, collapsed: false, parent: null }
    ];
    const links: Link[] = [];
    
    const engine = new ForceEngine(nodes, links);
    mockSimulation.alphaTarget.mockReturnValue(mockSimulation);
    
    engine.dragEnd('node-1');
    
    expect(mockSimulation.alphaTarget).toHaveBeenCalledWith(0);
    expect(nodes[0].fx).toBeNull();
    expect(nodes[0].fy).toBeNull();
  });

  it('should handle non-existent node in drag operations', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    const engine = new ForceEngine(nodes, links);
    
    // Should not throw
    expect(() => {
      engine.dragStart('non-existent');
      engine.drag('non-existent', 0, 0);
      engine.dragEnd('non-existent');
    }).not.toThrow();
  });
});