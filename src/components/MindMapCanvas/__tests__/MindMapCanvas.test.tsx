import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MindMapCanvas } from '../MindMapCanvas';
import { MindMapProvider } from '../../../context/MindMapContext';
import { useForceSimulation } from '../../../hooks/useForceSimulation';
import { useMindMapPersistence } from '../../../hooks/useMindMapPersistence';

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







  it('should show loading state', () => {
    mockUseMindMapPersistence.mockReturnValue({
      ...mockPersistence,
      loading: true,
    });

    renderWithProvider(<MindMapCanvas />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });


  it('should initialize D3 zoom behavior', () => {
    renderWithProvider(<MindMapCanvas />);
    
    // Verify D3 zoom was initialized
    expect(jest.requireMock('d3').select).toHaveBeenCalled();
    expect(jest.requireMock('d3').zoom).toHaveBeenCalled();
  });

  it('should update canvas size on window resize', async () => {
    const { container } = renderWithProvider(<MindMapCanvas />);
    
    // Find the main canvas SVG (not the toolbar icon SVGs)
    const canvasSvg = container.querySelector('svg[role="img"][aria-label="Mind map canvas"]');
    
    // Verify main canvas SVG exists
    expect(canvasSvg).toBeInTheDocument();
    
    // Main canvas SVG should have width and height set to 100% (responsive)
    expect(canvasSvg?.getAttribute('width')).toBe('100%');
    expect(canvasSvg?.getAttribute('height')).toBe('100%');

    // Simulate window resize - component should handle this gracefully
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
    
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      // SVG should still maintain responsive sizing
      expect(canvasSvg?.getAttribute('width')).toBe('100%');
      expect(canvasSvg?.getAttribute('height')).toBe('100%');
    });
  });
});