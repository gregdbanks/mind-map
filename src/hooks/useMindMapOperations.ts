import { useCallback, useState, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';
import type { Node, Point } from '../types/mindMap';
import { v4 as uuidv4 } from 'uuid';

interface HistoryEntry {
  action: 'create' | 'delete' | 'update' | 'batch';
  data: unknown;
}

const MAX_HISTORY_SIZE = 50;

export const useMindMapOperations = () => {
  const { state, dispatch, addNode, updateNode, selectNode } = useMindMap();
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const historyLocked = useRef(false);

  const pushToHistory = useCallback((entry: HistoryEntry) => {
    if (historyLocked.current) return;
    
    setUndoStack(prev => {
      const newStack = [...prev, entry];
      if (newStack.length > MAX_HISTORY_SIZE) {
        newStack.shift();
      }
      return newStack;
    });
    setRedoStack([]);
  }, []);

  const createNode = useCallback((
    parentId: string | null,
    position: Point,
    text: string = 'New Node'
  ): string => {
    const nodeId = uuidv4();
    
    // Create node with specific ID
    dispatch({
      type: 'ADD_NODE',
      payload: { parentId, position, text, id: nodeId }
    });
    
    pushToHistory({
      action: 'create',
      data: { nodeId, parentId, position, text }
    });
    
    return nodeId;
  }, [dispatch, pushToHistory]);

  const deleteNode = useCallback((nodeId: string) => {
    const node = state.nodes.get(nodeId);
    if (!node) return;

    // Collect all nodes to be deleted (node and its descendants)
    const nodesToDelete: Node[] = [];
    const collectDescendants = (id: string) => {
      const n = state.nodes.get(id);
      if (n) {
        nodesToDelete.push(n);
        Array.from(state.nodes.values())
          .filter(child => child.parent === id)
          .forEach(child => collectDescendants(child.id));
      }
    };
    collectDescendants(nodeId);

    // Store links that will be removed
    const linksToDelete = state.links.filter(link => 
      nodesToDelete.some(n => n.id === link.source || n.id === link.target)
    );

    pushToHistory({
      action: 'delete',
      data: { nodes: nodesToDelete, links: linksToDelete }
    });

    dispatch({ type: 'DELETE_NODE', payload: { id: nodeId } });
  }, [state.nodes, state.links, dispatch, pushToHistory]);

  const deleteNodes = useCallback((nodeIds: string[]) => {
    const allNodesToDelete: Node[] = [];
    const allLinksToDelete = new Set<string>();

    nodeIds.forEach(nodeId => {
      const collectDescendants = (id: string) => {
        const n = state.nodes.get(id);
        if (n) {
          allNodesToDelete.push(n);
          Array.from(state.nodes.values())
            .filter(child => child.parent === id)
            .forEach(child => collectDescendants(child.id));
        }
      };
      collectDescendants(nodeId);
    });

    state.links.forEach(link => {
      if (allNodesToDelete.some(n => n.id === link.source || n.id === link.target)) {
        allLinksToDelete.add(`${link.source}-${link.target}`);
      }
    });

    pushToHistory({
      action: 'batch',
      data: {
        type: 'delete',
        nodes: allNodesToDelete,
        links: Array.from(allLinksToDelete).map(key => {
          const [source, target] = key.split('-');
          return { source, target };
        })
      }
    });

    nodeIds.forEach(id => {
      dispatch({ type: 'DELETE_NODE', payload: { id } });
    });
  }, [state.nodes, state.links, dispatch, pushToHistory]);

  const updateNodeText = useCallback((nodeId: string, newText: string) => {
    const node = state.nodes.get(nodeId);
    if (!node) return;

    pushToHistory({
      action: 'update',
      data: { nodeId, oldText: node.text, newText }
    });

    updateNode(nodeId, { text: newText });
  }, [state.nodes, updateNode, pushToHistory]);

  const updateNodePosition = useCallback((nodeId: string, position: Point) => {
    const node = state.nodes.get(nodeId);
    if (!node) return;

    // Only update the state, don't push to history for position changes
    // Position changes are too frequent and would clutter undo history
    updateNode(nodeId, { x: position.x, y: position.y });
  }, [state.nodes, updateNode]);

  const duplicateNode = useCallback((nodeId: string): string => {
    const node = state.nodes.get(nodeId);
    if (!node) return '';

    const idMap = new Map<string, string>();
    const newNodes: Array<{ id: string; parentId: string | null; position: Point; text: string }> = [];

    const duplicateSubtree = (originalId: string, newParentId: string | null) => {
      const original = state.nodes.get(originalId);
      if (!original) return;

      const newId = uuidv4();
      idMap.set(originalId, newId);
      
      const offset = newParentId === null ? 50 : 0;
      newNodes.push({
        id: newId,
        parentId: newParentId,
        position: { 
          x: (original.x || 0) + offset, 
          y: (original.y || 0) + offset 
        },
        text: newParentId === null ? `${original.text} (copy)` : original.text
      });

      // Duplicate children
      Array.from(state.nodes.values())
        .filter(child => child.parent === originalId)
        .forEach(child => duplicateSubtree(child.id, newId));
    };

    duplicateSubtree(nodeId, node.parent);

    // Create all nodes
    historyLocked.current = true;
    newNodes.forEach(({ id, parentId, position, text }) => {
      dispatch({
        type: 'ADD_NODE',
        payload: { parentId, position, text, id }
      });
    });
    historyLocked.current = false;

    pushToHistory({
      action: 'batch',
      data: { type: 'duplicate', nodes: newNodes }
    });

    return idMap.get(nodeId) || '';
  }, [state.nodes, addNode, pushToHistory]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const entry = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, entry]);

    historyLocked.current = true;

    switch (entry.action) {
      case 'create': {
        const { nodeId } = entry.data as { nodeId: string };
        dispatch({ type: 'DELETE_NODE', payload: { id: nodeId } });
        break;
      }
      case 'delete': {
        const { nodes, links } = entry.data as { nodes: Node[]; links: Array<{ source: string; target: string }> };
        dispatch({ 
          type: 'LOAD_MINDMAP', 
          payload: { 
            nodes: [...Array.from(state.nodes.values()), ...nodes],
            links: [...state.links, ...links]
          }
        });
        break;
      }
      case 'update': {
        const { nodeId, oldText } = entry.data as { nodeId: string; oldText: string };
        updateNode(nodeId, { text: oldText });
        break;
      }
      case 'batch': {
        const batchData = entry.data as { type: string; nodes?: Node[]; links?: Array<{ source: string; target: string }> };
        if (batchData.type === 'delete') {
          dispatch({ 
            type: 'LOAD_MINDMAP', 
            payload: { 
              nodes: [...Array.from(state.nodes.values()), ...(batchData.nodes || [])],
              links: [...state.links, ...(batchData.links || [])]
            }
          });
        } else if (batchData.type === 'duplicate') {
          const { nodes } = batchData as { nodes: Array<{ id: string }> };
          nodes.forEach(node => {
            dispatch({ type: 'DELETE_NODE', payload: { id: node.id } });
          });
        }
        break;
      }
    }

    historyLocked.current = false;
  }, [undoStack, state.nodes, state.links, dispatch, updateNode]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const entry = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, entry]);

    historyLocked.current = true;

    switch (entry.action) {
      case 'create': {
        const { nodeId, parentId, position, text } = entry.data as { nodeId: string; parentId: string | null; position: Point; text: string };
        dispatch({
          type: 'ADD_NODE',
          payload: { parentId, position, text, id: nodeId }
        });
        break;
      }
      case 'delete': {
        const { nodes } = entry.data as { nodes: Node[] };
        nodes.forEach(node => {
          dispatch({ type: 'DELETE_NODE', payload: { id: node.id } });
        });
        break;
      }
      case 'update': {
        const { nodeId, newText } = entry.data as { nodeId: string; newText: string };
        updateNode(nodeId, { text: newText });
        break;
      }
      case 'batch': {
        const batchData = entry.data as { 
          type: string; 
          nodes?: Array<{ id: string; parentId: string | null; position: Point; text: string }> 
        };
        if (batchData.type === 'duplicate' && batchData.nodes) {
          batchData.nodes.forEach(({ parentId, position, text }) => {
            addNode(parentId, position, text);
          });
        } else if (batchData.type === 'delete') {
          const deleteData = entry.data as { type: string; nodes: Node[] };
          if ('nodes' in deleteData && deleteData.nodes) {
            deleteData.nodes.forEach(node => {
              dispatch({ type: 'DELETE_NODE', payload: { id: node.id } });
            });
          }
        }
        break;
      }
    }

    historyLocked.current = false;
  }, [redoStack, dispatch, addNode, updateNode]);

  const handleKeyPress = useCallback((key: string, modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}) => {
    // Don't handle keyboard shortcuts when editing
    if (state.editingNodeId) {
      return;
    }

    if (modifiers.ctrlKey || modifiers.altKey) {
      if (key === 'z') {
        undo();
        return;
      } else if (key === 'y') {
        redo();
        return;
      }
    }

    switch (key) {
      case 'Delete': {
        if (state.selectedNodeId) {
          deleteNode(state.selectedNodeId);
        }
        break;
      }
      case 'Tab': {
        if (state.selectedNodeId) {
          const selectedNode = state.nodes.get(state.selectedNodeId);
          if (selectedNode && selectedNode.parent) {
            const newId = createNode(
              selectedNode.parent, 
              { x: (selectedNode.x || 0) + 100, y: (selectedNode.y || 0) }, 
              'New Node'
            );
            selectNode(newId);
          }
        }
        break;
      }
      case 'Enter': {
        if (state.selectedNodeId) {
          const selectedNode = state.nodes.get(state.selectedNodeId);
          if (selectedNode) {
            const newId = createNode(
              state.selectedNodeId, 
              { x: (selectedNode.x || 0) + 50, y: (selectedNode.y || 0) + 50 }, 
              'New Node'
            );
            selectNode(newId);
          }
        }
        break;
      }
    }
  }, [state.selectedNodeId, state.editingNodeId, state.nodes, deleteNode, createNode, selectNode, undo, redo]);

  return {
    state,
    createNode,
    deleteNode,
    deleteNodes,
    updateNode,
    updateNodeText,
    updateNodePosition,
    duplicateNode,
    selectNode,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    handleKeyPress
  };
};