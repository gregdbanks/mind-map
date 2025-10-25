import { renderHook, act } from '@testing-library/react';
import { MindMapProvider } from '../../context/MindMapContext';
import { useMindMapOperations } from '../useMindMapOperations';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MindMapProvider>{children}</MindMapProvider>
);

describe('useMindMapOperations', () => {
  describe('CRUD Operations', () => {
    it('should create a root node', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        const nodeId = result.current.createNode(null, { x: 100, y: 100 }, 'Root Node');
        expect(nodeId).toBeTruthy();
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + new node
      const nodes = Array.from(result.current.state.nodes.values());
      const newNode = nodes.find(n => n.text === 'Root Node');
      expect(newNode).toBeDefined();
      expect(newNode!.parent).toBeNull();
      expect(newNode!.x).toBe(100);
      expect(newNode!.y).toBe(100);
    });

    it('should create a child node', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let parentId: string = '';
      act(() => {
        parentId = result.current.createNode(null, { x: 100, y: 100 }, 'Parent');
        result.current.createNode(parentId, { x: 200, y: 150 }, 'Child');
      });

      expect(result.current.state.nodes.size).toBe(3); // Initial + parent + child
      expect(result.current.state.links.length).toBe(1);
      
      const childNode = Array.from(result.current.state.nodes.values())
        .find(n => n.text === 'Child');
      expect(childNode?.parent).toBe(parentId);
    });

    it('should update node text', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let nodeId: string = '';
      act(() => {
        nodeId = result.current.createNode(null, { x: 100, y: 100 }, 'Original');
      });

      act(() => {
        result.current.updateNodeText(nodeId, 'Updated');
      });

      const node = result.current.state.nodes.get(nodeId);
      expect(node?.text).toBe('Updated');
    });

    it('should delete node and its children', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let parentId: string = '';
      let childId: string = '';

      act(() => {
        parentId = result.current.createNode(null, { x: 100, y: 100 }, 'Parent');
        childId = result.current.createNode(parentId, { x: 200, y: 150 }, 'Child');
        result.current.createNode(childId, { x: 300, y: 200 }, 'Grandchild');
      });

      expect(result.current.state.nodes.size).toBe(4); // Initial + parent + child + grandchild

      act(() => {
        result.current.deleteNode(parentId);
      });

      expect(result.current.state.nodes.size).toBe(1); // Only initial node remains
      expect(result.current.state.links.length).toBe(0);
    });

    it('should delete only the selected node if it has no children', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let parentId: string = '';
      let childId: string = '';

      act(() => {
        parentId = result.current.createNode(null, { x: 100, y: 100 }, 'Parent');
        childId = result.current.createNode(parentId, { x: 200, y: 150 }, 'Child');
      });

      act(() => {
        result.current.deleteNode(childId);
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + parent
      expect(result.current.state.nodes.has(parentId)).toBe(true);
      expect(result.current.state.nodes.has(childId)).toBe(false);
    });

    it('should duplicate a node with its subtree', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let originalId: string = '';

      act(() => {
        originalId = result.current.createNode(null, { x: 100, y: 100 }, 'Original');
        result.current.createNode(originalId, { x: 200, y: 150 }, 'Child');
      });

      let duplicatedId: string = '';
      act(() => {
        duplicatedId = result.current.duplicateNode(originalId);
      });

      expect(result.current.state.nodes.size).toBe(5); // Initial + Original + Child + Duplicated + Duplicated Child
      
      const duplicatedNode = result.current.state.nodes.get(duplicatedId);
      expect(duplicatedNode?.text).toBe('Original (copy)');
      expect(duplicatedNode?.parent).toBe(null);
      
      // Check that child was also duplicated
      const duplicatedChildren = Array.from(result.current.state.nodes.values())
        .filter(n => n.parent === duplicatedId);
      expect(duplicatedChildren.length).toBe(1);
      expect(duplicatedChildren[0].text).toBe('Child');
    });
  });

  describe('Undo/Redo Operations', () => {
    it('should undo node creation', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        result.current.createNode(null, { x: 100, y: 100 }, 'Test Node');
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + test node
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.nodes.size).toBe(1); // Back to just initial
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should redo node creation', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        result.current.createNode(null, { x: 100, y: 100 }, 'Test Node');
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + recreated node
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should undo node deletion', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let nodeId: string = '';
      act(() => {
        nodeId = result.current.createNode(null, { x: 100, y: 100 }, 'Test Node');
      });

      act(() => {
        result.current.deleteNode(nodeId);
      });

      expect(result.current.state.nodes.size).toBe(1); // Only initial remains

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + restored node
      expect(result.current.state.nodes.has(nodeId)).toBe(true);
    });

    it('should undo text updates', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let nodeId: string = '';
      act(() => {
        nodeId = result.current.createNode(null, { x: 100, y: 100 }, 'Original');
      });

      act(() => {
        result.current.updateNodeText(nodeId, 'Updated');
      });

      expect(result.current.state.nodes.get(nodeId)?.text).toBe('Updated');

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.nodes.get(nodeId)?.text).toBe('Original');
    });

    it('should handle multiple undo/redo operations', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let node1Id: string = '';

      act(() => {
        node1Id = result.current.createNode(null, { x: 100, y: 100 }, 'Node 1');
      });
      
      act(() => {
        result.current.createNode(null, { x: 200, y: 100 }, 'Node 2');
      });
      
      act(() => {
        result.current.updateNodeText(node1Id, 'Node 1 Updated');
      });

      expect(result.current.state.nodes.size).toBe(3); // Initial + node1 + node2

      // Undo text update
      act(() => {
        result.current.undo();
      });
      expect(result.current.state.nodes.get(node1Id)?.text).toBe('Node 1');

      // Undo node 2 creation
      act(() => {
        result.current.undo();
      });
      
      expect(result.current.state.nodes.size).toBe(2); // Initial + node1
      expect(result.current.state.nodes.get(node1Id)?.text).toBe('Node 1');

      // Undo node 1 creation
      act(() => {
        result.current.undo();
      });
      expect(result.current.state.nodes.size).toBe(1); // Only initial

      // Redo node 1 creation
      act(() => {
        result.current.redo();
      });
      expect(result.current.state.nodes.size).toBe(2); // Initial + redone node1
      
      // Redo node 2 creation
      act(() => {
        result.current.redo();
      });
      expect(result.current.state.nodes.size).toBe(3); // Initial + node1 + node2
      
      // Redo text update
      act(() => {
        result.current.redo();
      });
      
      expect(result.current.state.nodes.size).toBe(3); // Initial + node1 + node2
      expect(result.current.state.nodes.get(node1Id)?.text).toBe('Node 1 Updated');
    });

    it('should clear redo stack when new action is performed', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        result.current.createNode(null, { x: 100, y: 100 }, 'Node 1');
        result.current.createNode(null, { x: 200, y: 100 }, 'Node 2');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.createNode(null, { x: 300, y: 100 }, 'Node 3');
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should limit undo history size', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      // Create many nodes to exceed history limit
      for (let i = 0; i < 55; i++) {
        act(() => {
          result.current.createNode(null, { x: i * 10, y: 100 }, `Node ${i}`);
        });
      }

      // Count how many undo operations we can perform
      let undoCount = 0;
      while (result.current.canUndo && undoCount < 60) {
        act(() => {
          result.current.undo();
        });
        undoCount++;
      }

      expect(undoCount).toBe(50); // Should be exactly 50
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should delete multiple nodes in batch', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      const nodeIds: string[] = [];
      act(() => {
        nodeIds.push(result.current.createNode(null, { x: 100, y: 100 }, 'Node 1'));
        nodeIds.push(result.current.createNode(null, { x: 200, y: 100 }, 'Node 2'));
        nodeIds.push(result.current.createNode(null, { x: 300, y: 100 }, 'Node 3'));
      });

      act(() => {
        result.current.deleteNodes(nodeIds.slice(0, 2));
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + node 3
      expect(result.current.state.nodes.has(nodeIds[2])).toBe(true);
    });

    it('should undo batch delete as single operation', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      const nodeIds: string[] = [];
      act(() => {
        nodeIds.push(result.current.createNode(null, { x: 100, y: 100 }, 'Node 1'));
        nodeIds.push(result.current.createNode(null, { x: 200, y: 100 }, 'Node 2'));
      });

      act(() => {
        result.current.deleteNodes(nodeIds);
      });

      expect(result.current.state.nodes.size).toBe(1); // Only initial

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.nodes.size).toBe(3); // Initial + restored nodes
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle delete key for selected node', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let nodeId: string = '';
      act(() => {
        nodeId = result.current.createNode(null, { x: 100, y: 100 }, 'Test Node');
        result.current.selectNode(nodeId);
      });

      act(() => {
        result.current.handleKeyPress('Delete');
      });

      expect(result.current.state.nodes.size).toBe(1); // Only initial
    });

    it('should handle Ctrl+Z for undo', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        result.current.createNode(null, { x: 100, y: 100 }, 'Test Node');
      });

      act(() => {
        result.current.handleKeyPress('z', { ctrlKey: true });
      });

      expect(result.current.state.nodes.size).toBe(1); // Back to only initial
    });

    it('should handle Ctrl+Y for redo', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        result.current.createNode(null, { x: 100, y: 100 }, 'Test Node');
        result.current.undo();
      });

      act(() => {
        result.current.handleKeyPress('y', { ctrlKey: true });
      });

      expect(result.current.state.nodes.size).toBe(2); // Initial + redone node
    });

    it('should handle Tab to create sibling node', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      act(() => {
        const parentId = result.current.createNode(null, { x: 100, y: 100 }, 'Parent');
        const firstNodeId = result.current.createNode(parentId, { x: 200, y: 150 }, 'First Child');
        result.current.selectNode(firstNodeId);
      });

      act(() => {
        result.current.handleKeyPress('Tab');
      });

      expect(result.current.state.nodes.size).toBe(4); // Initial + parent + first child + sibling
      const nodes = Array.from(result.current.state.nodes.values());
      const parentNode = nodes.find(n => n.text === 'Parent');
      const siblings = nodes.filter(n => n.parent === parentNode!.id);
      expect(siblings.length).toBe(2);
    });

    it('should handle Enter to create child node', () => {
      const { result } = renderHook(() => useMindMapOperations(), { wrapper });

      let parentId: string = '';
      act(() => {
        parentId = result.current.createNode(null, { x: 100, y: 100 }, 'Parent');
        result.current.selectNode(parentId);
      });

      act(() => {
        result.current.handleKeyPress('Enter');
      });

      expect(result.current.state.nodes.size).toBe(3); // Initial + parent + new child
      const children = Array.from(result.current.state.nodes.values())
        .filter(n => n.parent === parentId);
      expect(children.length).toBe(1);
    });
  });
});