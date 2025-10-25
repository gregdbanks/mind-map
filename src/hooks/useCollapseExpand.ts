import { useCallback, useState, useMemo } from 'react';
import { useMindMap } from '../context/MindMapContext';
import type { Node, Link } from '../types/mindMap';

interface CollapseExpandHook {
  toggleCollapse: (nodeId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  hasChildren: (nodeId: string) => boolean;
  visibleNodes: Node[];
  visibleLinks: Link[];
  isAnimating: (nodeId: string) => boolean;
  handleKeyPress: (key: string) => void;
}

export const useCollapseExpand = (): CollapseExpandHook => {
  const { state, updateNode } = useMindMap();
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());

  // Get all nodes as array
  const allNodes = Array.from(state.nodes.values());
  const allLinks = state.links;

  // Check if a node has children
  const hasChildren = useCallback((nodeId: string): boolean => {
    return allNodes.some(node => node.parent === nodeId);
  }, [allNodes]);

  // Calculate visible nodes and links
  const { visibleNodes, visibleLinks } = useMemo(() => {
    const hiddenNodeIds = new Set<string>();
    
    // Find all nodes that should be hidden
    const findHiddenNodes = (parentId: string) => {
      allNodes.forEach(node => {
        if (node.parent === parentId) {
          hiddenNodeIds.add(node.id);
          findHiddenNodes(node.id);
        }
      });
    };
    
    // Start from collapsed nodes
    allNodes.forEach(node => {
      if (node.collapsed) {
        findHiddenNodes(node.id);
      }
    });
    
    // Filter nodes and links
    const visibleNodes = allNodes.filter(node => !hiddenNodeIds.has(node.id));
    const visibleLinks = allLinks.filter(
      link => !hiddenNodeIds.has(link.source) && !hiddenNodeIds.has(link.target)
    );

    return { visibleNodes, visibleLinks };
  }, [allNodes, allLinks]);

  // Toggle collapse state with animation
  const toggleCollapse = useCallback((nodeId: string) => {
    const node = state.nodes.get(nodeId);
    if (!node || !hasChildren(nodeId)) return;

    // Start animation
    setAnimatingNodes(prev => new Set(prev).add(nodeId));

    // Update node state
    updateNode(nodeId, { collapsed: !node.collapsed });

    // End animation after delay
    setTimeout(() => {
      setAnimatingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }, 300); // 300ms animation duration
  }, [state.nodes, updateNode, hasChildren]);

  // Collapse all nodes with children
  const collapseAll = useCallback(() => {
    allNodes.forEach(node => {
      if (hasChildren(node.id) && !node.collapsed) {
        updateNode(node.id, { collapsed: true });
      }
    });
  }, [allNodes, hasChildren, updateNode]);

  // Expand all nodes
  const expandAll = useCallback(() => {
    allNodes.forEach(node => {
      if (node.collapsed) {
        updateNode(node.id, { collapsed: false });
      }
    });
  }, [allNodes, updateNode]);

  // Check if node is animating
  const isAnimating = useCallback((nodeId: string): boolean => {
    return animatingNodes.has(nodeId);
  }, [animatingNodes]);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((key: string) => {
    if (key === 'Space' && state.selectedNodeId) {
      toggleCollapse(state.selectedNodeId);
    }
  }, [state.selectedNodeId, toggleCollapse]);

  return {
    toggleCollapse,
    collapseAll,
    expandAll,
    hasChildren,
    visibleNodes,
    visibleLinks,
    isAnimating,
    handleKeyPress,
  };
};