// Mock the ForceEngine before imports
jest.mock('../../physics/forceEngine');

import { renderHook, act } from '@testing-library/react';
import { useForceSimulation } from '../useForceSimulation';
import { ForceEngine } from '../../physics/forceEngine';
import { Node, Link } from '../../types/mindMap';

const MockForceEngine = ForceEngine as jest.MockedClass<typeof ForceEngine>;

describe('useForceSimulation', () => {
  let mockEngineInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instance
    mockEngineInstance = {
      onTick: jest.fn(),
      updateNodes: jest.fn(),
      updateLinks: jest.fn(),
      dragStart: jest.fn(),
      drag: jest.fn(),
      dragEnd: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      getPositions: jest.fn().mockReturnValue(new Map()),
    };
    
    MockForceEngine.mockImplementation(() => mockEngineInstance);
  });

  it('should initialize with engine instance', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Test', x: 0, y: 0, collapsed: false, parent: null }
    ];
    const links: Link[] = [];

    const { result } = renderHook(() => useForceSimulation(nodes, links));

    // Engine is created in useEffect, so we check the constructor was called
    expect(MockForceEngine).toHaveBeenCalledWith(nodes, links, undefined);
    
    // Methods should be available immediately
    expect(result.current.dragStart).toBeDefined();
    expect(result.current.drag).toBeDefined();
    expect(result.current.dragEnd).toBeDefined();
    expect(result.current.restart).toBeDefined();
    expect(result.current.getPositions).toBeDefined();
  });

  it('should accept custom configuration', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const config = {
      charge: { strength: -500, distanceMax: 300 }
    };

    renderHook(() => useForceSimulation(nodes, links, config));

    expect(MockForceEngine).toHaveBeenCalledWith(nodes, links, config);
  });

  it('should setup tick callback with onTick prop', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const onTick = jest.fn();

    renderHook(() => useForceSimulation(nodes, links, {}, onTick));

    expect(mockEngineInstance.onTick).toHaveBeenCalledWith(expect.any(Function));
    
    // Simulate a tick
    const tickCallback = mockEngineInstance.onTick.mock.calls[0][0];
    const updatedNodes = [{ id: 'node-1', x: 10, y: 20 }];
    tickCallback(updatedNodes);
    
    expect(onTick).toHaveBeenCalledWith(updatedNodes);
  });

  it('should update engine when nodes change', () => {
    const initialNodes: Node[] = [];
    const links: Link[] = [];

    const { rerender } = renderHook(
      ({ nodes }) => useForceSimulation(nodes, links),
      { initialProps: { nodes: initialNodes } }
    );

    const newNodes: Node[] = [
      { id: 'node-1', text: 'New', x: 0, y: 0, collapsed: false, parent: null }
    ];

    rerender({ nodes: newNodes });

    expect(mockEngineInstance.updateNodes).toHaveBeenCalledWith(newNodes, true);
  });

  it('should update engine when links change', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Node 1', x: 0, y: 0, collapsed: false, parent: null },
      { id: 'node-2', text: 'Node 2', x: 50, y: 50, collapsed: false, parent: 'node-1' }
    ];
    const initialLinks: Link[] = [];

    const { rerender } = renderHook(
      ({ links }) => useForceSimulation(nodes, links),
      { initialProps: { links: initialLinks } }
    );

    const newLinks: Link[] = [
      { source: 'node-1', target: 'node-2' }
    ];

    rerender({ links: newLinks });

    expect(mockEngineInstance.updateLinks).toHaveBeenCalledWith(newLinks, true);
  });

  it('should handle drag operations', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Test', x: 0, y: 0, collapsed: false, parent: null }
    ];
    const links: Link[] = [];

    const { result } = renderHook(() => useForceSimulation(nodes, links));

    act(() => {
      result.current.dragStart('node-1');
    });
    expect(mockEngineInstance.dragStart).toHaveBeenCalledWith('node-1');

    act(() => {
      result.current.drag('node-1', 10, 20);
    });
    expect(mockEngineInstance.drag).toHaveBeenCalledWith('node-1', 10, 20);

    act(() => {
      result.current.dragEnd('node-1');
    });
    expect(mockEngineInstance.dragEnd).toHaveBeenCalledWith('node-1');
  });

  it('should stop engine on unmount', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const { unmount } = renderHook(() => useForceSimulation(nodes, links));

    unmount();

    expect(mockEngineInstance.stop).toHaveBeenCalled();
  });

  it('should restart simulation', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];

    const { result } = renderHook(() => useForceSimulation(nodes, links));

    act(() => {
      result.current.restart();
    });

    expect(mockEngineInstance.restart).toHaveBeenCalled();
  });

  it('should get current positions', () => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const mockPositions = new Map([
      ['node-1', { x: 10, y: 20 }],
      ['node-2', { x: 30, y: 40 }]
    ]);

    mockEngineInstance.getPositions.mockReturnValue(mockPositions);

    const { result } = renderHook(() => useForceSimulation(nodes, links));

    const positions = result.current.getPositions();

    expect(positions).toBe(mockPositions);
    expect(mockEngineInstance.getPositions).toHaveBeenCalled();
  });

  it('should filter nodes when collapsed', () => {
    const nodes: Node[] = [
      { id: 'node-1', text: 'Parent', x: 0, y: 0, collapsed: true, parent: null },
      { id: 'node-2', text: 'Child', x: 50, y: 50, collapsed: false, parent: 'node-1' },
      { id: 'node-3', text: 'Grandchild', x: 100, y: 100, collapsed: false, parent: 'node-2' }
    ];
    const links: Link[] = [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' }
    ];

    renderHook(() => useForceSimulation(nodes, links));

    // The engine should be initialized with only visible nodes
    const visibleNodes = MockForceEngine.mock.calls[0][0];
    expect(visibleNodes).toHaveLength(1);
    expect(visibleNodes[0].id).toBe('node-1');

    const visibleLinks = MockForceEngine.mock.calls[0][1];
    expect(visibleLinks).toHaveLength(0);
  });
});