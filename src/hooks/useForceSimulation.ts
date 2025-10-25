import { useEffect, useRef, useCallback, useMemo } from 'react';
import { ForceEngine } from '../physics/forceEngine';
import type { ForceConfig } from '../physics/forceEngine';
import type { Node, Link } from '../types/mindMap';

export function useForceSimulation(
  nodes: Node[],
  links: Link[],
  config?: Partial<ForceConfig>,
  onTick?: (nodes: Node[]) => void,
  isRunning?: boolean
) {
  const engineRef = useRef<ForceEngine | null>(null);

  // Filter out hidden nodes (when parent is collapsed)
  const { visibleNodes, visibleLinks } = useMemo(() => {
    const hiddenNodeIds = new Set<string>();
    
    // Find all nodes that should be hidden
    const findHiddenNodes = (parentId: string) => {
      nodes.forEach(node => {
        if (node.parent === parentId) {
          hiddenNodeIds.add(node.id);
          findHiddenNodes(node.id);
        }
      });
    };
    
    // Start from collapsed nodes
    nodes.forEach(node => {
      if (node.collapsed) {
        findHiddenNodes(node.id);
      }
    });
    
    // Filter nodes and links
    const visibleNodes = nodes.filter(node => !hiddenNodeIds.has(node.id));
    const visibleLinks = links.filter(
      link => !hiddenNodeIds.has(link.source) && !hiddenNodeIds.has(link.target)
    );
    
    return { visibleNodes, visibleLinks };
  }, [nodes, links]);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new ForceEngine(visibleNodes, visibleLinks, config);
    
    if (onTick) {
      engineRef.current.onTick(onTick);
    }
    
    // Auto-stop simulation after 3 seconds to prevent endless jittering
    const autoStopTimer = setTimeout(() => {
      engineRef.current?.stop();
    }, 3000);
    
    return () => {
      clearTimeout(autoStopTimer);
      engineRef.current?.stop();
    };
  }, []); // Only initialize once

  // Update nodes when they change
  useEffect(() => {
    if (engineRef.current) {
      const shouldRestart = isRunning !== false;
      engineRef.current.updateNodes(visibleNodes, shouldRestart);
    }
  }, [visibleNodes, isRunning]);

  // Update links when they change
  useEffect(() => {
    if (engineRef.current) {
      const shouldRestart = isRunning !== false;
      engineRef.current.updateLinks(visibleLinks, shouldRestart);
    }
  }, [visibleLinks, isRunning]);

  // Control simulation based on isRunning parameter
  useEffect(() => {
    if (!engineRef.current) return;
    
    if (isRunning === false) {
      engineRef.current.stop();
    } else if (isRunning === true) {
      engineRef.current.restart();
    }
  }, [isRunning]);

  // Drag methods
  const dragStart = useCallback((nodeId: string) => {
    engineRef.current?.dragStart(nodeId);
  }, []);

  const drag = useCallback((nodeId: string, x: number, y: number) => {
    engineRef.current?.drag(nodeId, x, y);
  }, []);

  const dragEnd = useCallback((nodeId: string) => {
    engineRef.current?.dragEnd(nodeId);
  }, []);

  const restart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const getPositions = useCallback(() => {
    return engineRef.current?.getPositions() || new Map();
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  return {
    dragStart,
    drag,
    dragEnd,
    restart,
    stop,
    getPositions,
  };
}