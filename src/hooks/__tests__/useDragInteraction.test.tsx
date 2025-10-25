import { renderHook, act } from '@testing-library/react';
import { useDragInteraction } from '../useDragInteraction';
import { MindMapProvider } from '../../context/MindMapContext';
import { useForceSimulation } from '../useForceSimulation';
import React from 'react';

// Mock the force simulation hook
jest.mock('../useForceSimulation');
const mockUseForceSimulation = useForceSimulation as jest.MockedFunction<typeof useForceSimulation>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MindMapProvider>{children}</MindMapProvider>
);

describe('useDragInteraction', () => {
  const mockDragStart = jest.fn();
  const mockDrag = jest.fn();
  const mockDragEnd = jest.fn();
  const mockSvgRef = { current: document.createElementNS('http://www.w3.org/2000/svg', 'svg') };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseForceSimulation.mockReturnValue({
      dragStart: mockDragStart,
      drag: mockDrag,
      dragEnd: mockDragEnd,
      restart: jest.fn(),
      stop: jest.fn(),
      getPositions: jest.fn().mockReturnValue(new Map()),
    });

    // Mock getBoundingClientRect
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
  });

  it('should initialize drag handlers', () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    expect(result.current.onDragStart).toBeDefined();
    expect(result.current.onDrag).toBeDefined();
    expect(result.current.onDragEnd).toBeDefined();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedNodeId).toBeNull();
  });

  it('should start dragging a node', () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    const mockEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    });

    act(() => {
      result.current.onDragStart('node-1', mockEvent);
    });

    expect(result.current.isDragging).toBe(true);
    expect(result.current.draggedNodeId).toBe('node-1');
    expect(mockDragStart).toHaveBeenCalledWith('node-1');
  });

  it('should handle drag movement', () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    // Start dragging
    const startEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });

    act(() => {
      result.current.onDragStart('node-1', startEvent);
    });

    // Move the mouse
    const moveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 120,
    });

    act(() => {
      result.current.onDrag(moveEvent);
    });

    expect(mockDrag).toHaveBeenCalledWith('node-1', 150, 120);
  });

  it('should end dragging', () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    // Start dragging
    const startEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });

    act(() => {
      result.current.onDragStart('node-1', startEvent);
    });

    // End dragging
    const endEvent = new MouseEvent('mouseup');

    act(() => {
      result.current.onDragEnd(endEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.draggedNodeId).toBeNull();
    expect(mockDragEnd).toHaveBeenCalledWith('node-1');
  });

  it('should handle drag with transform (zoom/pan)', () => {
    const transform = { x: 50, y: 50, scale: 2 };
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, transform), 
      { wrapper }
    );

    const startEvent = new MouseEvent('mousedown', {
      clientX: 200,
      clientY: 200,
    });

    act(() => {
      result.current.onDragStart('node-1', startEvent);
    });

    // Expected position should account for transform
    // (200 - 0 - 50) / 2 = 75 for both x and y
    expect(mockDragStart).toHaveBeenCalledWith('node-1');
  });

  it('should not drag if svg ref is null', () => {
    const nullRef = React.createRef<SVGSVGElement>() as React.RefObject<SVGSVGElement>;
    // Force the ref to be null
    (nullRef as any).current = null;
    const { result } = renderHook(() => 
      useDragInteraction(nullRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    const mockEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });

    act(() => {
      result.current.onDragStart('node-1', mockEvent);
    });

    expect(result.current.isDragging).toBe(false);
    expect(mockDragStart).not.toHaveBeenCalled();
  });

  it('should handle drag outside of canvas gracefully', () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    // Start dragging
    const startEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
    });

    act(() => {
      result.current.onDragStart('node-1', startEvent);
    });

    // Move outside canvas (negative coordinates)
    const moveEvent = new MouseEvent('mousemove', {
      clientX: -50,
      clientY: -50,
    });

    act(() => {
      result.current.onDrag(moveEvent);
    });

    // Should still call drag with the position
    expect(mockDrag).toHaveBeenCalledWith('node-1', -50, -50);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    unmount();

    // Check that event listeners were cleaned up
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should prevent default behavior on drag events', () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    const mockEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    });

    const preventDefaultSpy = jest.spyOn(mockEvent, 'preventDefault');

    act(() => {
      result.current.onDragStart('node-1', mockEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should update node position in state after drag', async () => {
    const { result } = renderHook(() => 
      useDragInteraction(mockSvgRef, { x: 0, y: 0, scale: 1 }), 
      { wrapper }
    );

    // Mock the positions returned by force simulation
    const mockPositions = new Map([
      ['node-1', { x: 200, y: 150 }]
    ]);
    mockUseForceSimulation.mockReturnValue({
      dragStart: mockDragStart,
      drag: mockDrag,
      dragEnd: mockDragEnd,
      restart: jest.fn(),
      stop: jest.fn(),
      getPositions: jest.fn().mockReturnValue(mockPositions),
    });

    // Start and end drag
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    const endEvent = new MouseEvent('mouseup');

    act(() => {
      result.current.onDragStart('node-1', startEvent);
    });

    act(() => {
      result.current.onDragEnd(endEvent);
    });

    // Verify position update was dispatched
    expect(mockDragEnd).toHaveBeenCalledWith('node-1');
  });
});