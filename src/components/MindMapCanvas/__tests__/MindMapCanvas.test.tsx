import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MindMapCanvas } from '../MindMapCanvas';
import { MindMapProvider, useMindMap } from '../../../context/MindMapContext';
import { useForceSimulation } from '../../../hooks/useForceSimulation';
import { useMindMapPersistence } from '../../../hooks/useMindMapPersistence';
import { Node } from '../../../types/mindMap';

// Mock the hooks
jest.mock('../../../hooks/useForceSimulation');
jest.mock('../../../hooks/useMindMapPersistence');

// Mock D3 to avoid SVG property errors in tests
jest.mock('d3', () => {
  const mockSelection: any = {
    call: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    ease: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    each: jest.fn().mockReturnThis(),
    node: jest.fn(() => ({ getBBox: () => ({ x: 0, y: 0, width: 100, height: 100 }) })),
    select: jest.fn(() => mockSelection),
    selectAll: jest.fn(() => ({
      data: jest.fn(() => ({
        enter: jest.fn(() => mockSelection),
        exit: jest.fn(() => ({
          remove: jest.fn().mockReturnThis(),
          attr: jest.fn().mockReturnThis(),
          style: jest.fn().mockReturnThis(),
        })),
        merge: jest.fn(() => mockSelection),
        remove: jest.fn().mockReturnThis(),
        attr: jest.fn().mockReturnThis(),
        style: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        each: jest.fn().mockReturnThis(),
        filter: jest.fn(() => mockSelection),
      })),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
    })),
  };

  return {
    ...jest.requireActual('d3'),
    select: jest.fn(() => mockSelection),
    zoom: jest.fn(() => ({
      scaleExtent: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      transform: jest.fn(),
    })),
    zoomTransform: jest.fn(() => ({ x: 0, y: 0, k: 1 })),
    zoomIdentity: {
      translate: jest.fn().mockReturnThis(),
      scale: jest.fn().mockReturnThis(),
    },
    drag: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
    })),
    easeCubicInOut: jest.fn(),
  };
});

const mockUseForceSimulation = useForceSimulation as jest.MockedFunction<typeof useForceSimulation>;
const mockUseMindMapPersistence = useMindMapPersistence as jest.MockedFunction<typeof useMindMapPersistence>;

// Helper component to test context integration
const TestHelper = ({ onContextChange }: { onContextChange?: (context: ReturnType<typeof useMindMap>) => void }) => {
  const context = useMindMap();
  onContextChange?.(context);
  return null;
};

describe('MindMapCanvas', () => {
  const mockForceSimulation = {
    dragStart: jest.fn(),
    drag: jest.fn(),
    dragEnd: jest.fn(),
    restart: jest.fn(),
    stop: jest.fn(),
    getPositions: jest.fn().mockReturnValue(new Map()),
  };

  const mockPersistence = {
    loading: false,
    error: null,
    lastSaved: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseForceSimulation.mockClear();
    mockUseForceSimulation.mockReturnValue(mockForceSimulation);
    mockUseMindMapPersistence.mockReturnValue(mockPersistence);

    // Mock getBoundingClientRect for SVG elements
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 1024,
      bottom: 768,
      width: 1024,
      height: 768,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));

    // Mock SVG properties that D3 zoom expects
    Object.defineProperty(SVGElement.prototype, 'width', {
      get: function() {
        return { baseVal: { value: 1024 } };
      },
      configurable: true
    });

    Object.defineProperty(SVGElement.prototype, 'height', {
      get: function() {
        return { baseVal: { value: 768 } };
      },
      configurable: true
    });

    // Mock createSVGPoint for D3 zoom
    (SVGSVGElement.prototype as any).createSVGPoint = jest.fn(() => ({
      x: 0,
      y: 0,
      w: 1,
      z: 0,
      matrixTransform: jest.fn(() => ({ x: 0, y: 0, w: 1, z: 0 })),
      toJSON: jest.fn()
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (children: React.ReactNode) => {
    return render(
      <MindMapProvider>
        {children}
      </MindMapProvider>
    );
  };

  it('should render SVG canvas', () => {
    renderWithProvider(<MindMapCanvas />);
    
    const svg = screen.getByRole('img', { name: /mind map canvas/i });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('should render nodes and links', async () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    renderWithProvider(
      <>
        <TestHelper onContextChange={(ctx) => { contextApi = ctx; }} />
        <MindMapCanvas />
      </>
    );

    // Add nodes to the context
    await waitFor(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Root Node');
    });

    await waitFor(() => {
      const rootId = Array.from(contextApi!.state.nodes.values())[0].id;
      contextApi!.addNode(rootId, { x: 200, y: 150 }, 'Child Node');
    });

    // Check that nodes are rendered
    expect(screen.getByText('Root Node')).toBeInTheDocument();
    expect(screen.getByText('Child Node')).toBeInTheDocument();

    // Check that link is rendered
    const links = screen.getByTestId('links-group').querySelectorAll('line');
    expect(links).toHaveLength(1);
  });

  it('should handle click outside nodes to deselect', async () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    renderWithProvider(
      <>
        <TestHelper onContextChange={(ctx) => { contextApi = ctx; }} />
        <MindMapCanvas />
      </>
    );

    // Add and select a node
    await waitFor(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Test Node');
      const nodeId = Array.from(contextApi!.state.nodes.values())[0].id;
      contextApi!.selectNode(nodeId);
    });

    expect(contextApi!.state.selectedNodeId).toBeTruthy();

    // Shift-click on the SVG background to deselect
    const svg = screen.getByRole('img', { name: /mind map canvas/i });
    fireEvent.click(svg, { shiftKey: true });

    await waitFor(() => {
      expect(contextApi!.state.selectedNodeId).toBeNull();
    });
  });

  it('should create new node on click', async () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    renderWithProvider(
      <>
        <TestHelper onContextChange={(ctx) => { contextApi = ctx; }} />
        <MindMapCanvas />
      </>
    );

    // Click on empty canvas
    const svg = screen.getByRole('img', { name: /mind map canvas/i });
    fireEvent.click(svg, { clientX: 200, clientY: 200 });

    await waitFor(() => {
      expect(contextApi!.state.nodes.size).toBe(2); // Initial + new node
    });

    const nodes = Array.from(contextApi!.state.nodes.values());
    const newNode = nodes.find(n => n.id !== 'root-node');
    expect(newNode).toBeDefined();
    expect(newNode!.parent).toBeNull(); // Root node
  });

  it('should create child node when clicking with selected parent', async () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    renderWithProvider(
      <>
        <TestHelper onContextChange={(ctx) => { contextApi = ctx; }} />
        <MindMapCanvas />
      </>
    );

    // Add a node first
    await waitFor(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Parent Node');
    });

    // Select the newly added parent node (not the initial node)
    const nodes = Array.from(contextApi!.state.nodes.values());
    const parentNode = nodes.find(n => n.text === 'Parent Node');
    const parentId = parentNode!.id;
    await waitFor(() => {
      contextApi!.selectNode(parentId);
    });

    // Verify selection
    expect(contextApi!.state.selectedNodeId).toBe(parentId);

    // Click to create child
    const svg = screen.getByRole('img', { name: /mind map canvas/i });
    fireEvent.click(svg, { clientX: 300, clientY: 200 });

    await waitFor(() => {
      expect(contextApi!.state.nodes.size).toBe(3); // Initial + parent + child
    });

    const allNodes = Array.from(contextApi!.state.nodes.values());
    const childNode = allNodes.find(n => n.id !== parentId && n.id !== 'root-node');
    expect(childNode).toBeDefined();
    expect(childNode?.parent).toBe(parentId);
  });

  it('should integrate with force simulation', async () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    renderWithProvider(
      <>
        <TestHelper onContextChange={(ctx) => { contextApi = ctx; }} />
        <MindMapCanvas />
      </>
    );

    // Add first node
    await waitFor(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Node 1');
    });

    // Get the newly added node (not the initial node) and add second node
    const nodes = Array.from(contextApi!.state.nodes.values());
    const node1 = nodes.find(n => n.text === 'Node 1');
    const rootId = node1!.id;
    await waitFor(() => {
      contextApi!.addNode(rootId, { x: 200, y: 150 }, 'Node 2');
    });

    // Wait for the state to stabilize
    await waitFor(() => {
      expect(contextApi!.state.nodes.size).toBe(3); // Initial + node1 + node2
    });

    // Verify force simulation was called with nodes and links
    expect(mockUseForceSimulation).toHaveBeenCalled();
    const lastCall = mockUseForceSimulation.mock.calls[mockUseForceSimulation.mock.calls.length - 1];
    expect(lastCall[0]).toHaveLength(3); // Initial + node1 + node2
    expect(lastCall[1]).toHaveLength(1); // 1 link between node1 and node2
  });

  it('should update node positions from force simulation', async () => {
    let contextApi: ReturnType<typeof useMindMap>;
    let onTickCallback: ((nodes: Node[]) => void) | undefined;

    mockUseForceSimulation.mockImplementation((_nodes, _links, _config, onTick) => {
      onTickCallback = onTick;
      return mockForceSimulation;
    });
    
    renderWithProvider(
      <>
        <TestHelper onContextChange={(ctx) => { contextApi = ctx; }} />
        <MindMapCanvas />
      </>
    );

    // Add a node
    await waitFor(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Test Node');
    });

    const nodeId = Array.from(contextApi!.state.nodes.values())[0].id;

    // Simulate force tick with new positions
    await waitFor(() => {
      if (onTickCallback) {
        onTickCallback([
          { id: nodeId, text: 'Test Node', x: 150, y: 120, collapsed: false, parent: null }
        ]);
      }
    });

    // Check that node position was updated
    await waitFor(() => {
      const updatedNode = contextApi!.state.nodes.get(nodeId);
      expect(updatedNode?.x).toBe(150);
      expect(updatedNode?.y).toBe(120);
    });
  });

  it('should show loading state', () => {
    mockUseMindMapPersistence.mockReturnValue({
      ...mockPersistence,
      loading: true,
    });

    renderWithProvider(<MindMapCanvas />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseMindMapPersistence.mockReturnValue({
      ...mockPersistence,
      error: new Error('Failed to load mind map'),
    });

    renderWithProvider(<MindMapCanvas />);
    
    expect(screen.getByText(/failed to load mind map/i)).toBeInTheDocument();
  });

  it('should initialize D3 zoom behavior', () => {
    renderWithProvider(<MindMapCanvas />);
    
    // Verify D3 zoom was initialized
    expect(jest.requireMock('d3').select).toHaveBeenCalled();
    expect(jest.requireMock('d3').zoom).toHaveBeenCalled();
  });

  it('should update canvas size on window resize', async () => {
    const { container } = renderWithProvider(<MindMapCanvas />);
    const svg = container.querySelector('svg');
    
    const initialWidth = svg?.getAttribute('width');
    const initialHeight = svg?.getAttribute('height');

    // Simulate window resize
    (window as any).innerWidth = 1200;
    (window as any).innerHeight = 800;
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      const newWidth = svg?.getAttribute('width');
      const newHeight = svg?.getAttribute('height');
      expect(newWidth).not.toBe(initialWidth);
      expect(newHeight).not.toBe(initialHeight);
    });
  });
});