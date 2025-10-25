import { useCallback, useState, useEffect, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';
import { useForceSimulation } from './useForceSimulation';
import type { Point } from '../types/mindMap';

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface DragHandlers {
  onDragStart: (nodeId: string, event: MouseEvent | React.MouseEvent) => void;
  onDrag: (event: MouseEvent) => void;
  onDragEnd: (event: MouseEvent) => void;
  isDragging: boolean;
  draggedNodeId: string | null;
}

export const useDragInteraction = (
  svgRef: React.RefObject<SVGSVGElement | null>,
  transform: Transform,
  isSimulationRunning?: boolean
): DragHandlers => {
  const { state, dispatch } = useMindMap();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragHandled = useRef(false);

  // Get nodes and links for force simulation
  const nodes = Array.from(state.nodes.values());
  const links = state.links;

  // Get force simulation handlers
  const forceSimulation = useForceSimulation(
    nodes,
    links,
    {},
    useCallback(() => {
      // Position updates are handled by the parent component
    }, [])
  );

  const convertToSvgCoordinates = useCallback((
    clientX: number,
    clientY: number
  ): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - transform.x) / transform.scale;
    const y = (clientY - rect.top - transform.y) / transform.scale;

    return { x, y };
  }, [svgRef, transform]);

  const onDragStart = useCallback((
    nodeId: string,
    event: MouseEvent | React.MouseEvent
  ) => {
    if (!svgRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
    setDraggedNodeId(nodeId);
    dragHandled.current = false;

    // Only start drag in force simulation if simulation is running
    if (isSimulationRunning !== false) {
      forceSimulation.dragStart(nodeId);
    }
  }, [svgRef, forceSimulation, isSimulationRunning]);

  const onDrag = useCallback((event: MouseEvent) => {
    if (!isDragging || !draggedNodeId || dragHandled.current) return;

    const { x, y } = convertToSvgCoordinates(event.clientX, event.clientY);

    // Only update force simulation if simulation is running
    if (isSimulationRunning !== false) {
      forceSimulation.drag(draggedNodeId, x, y);
    }

    // Always update position in state (dragging should work even when frozen)
    const positions = new Map<string, Point>();
    positions.set(draggedNodeId, { x, y });
    dispatch({ type: 'UPDATE_POSITIONS', payload: { positions } });
  }, [isDragging, draggedNodeId, convertToSvgCoordinates, forceSimulation, dispatch, isSimulationRunning]);

  const onDragEnd = useCallback((_event: MouseEvent) => {
    if (!isDragging || !draggedNodeId) return;

    // Only end drag in force simulation if simulation is running
    if (isSimulationRunning !== false) {
      forceSimulation.dragEnd(draggedNodeId);
    }

    setIsDragging(false);
    setDraggedNodeId(null);
    dragHandled.current = true;
  }, [isDragging, draggedNodeId, forceSimulation, isSimulationRunning]);

  // Set up global mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onDrag(e);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        onDragEnd(e);
      }
    };

    // Add global listeners for drag
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrag, onDragEnd]);

  return {
    onDragStart,
    onDrag,
    onDragEnd,
    isDragging,
    draggedNodeId,
  };
};