import { renderHook, act } from '@testing-library/react';
import { MindMapProvider, useMindMap } from '../MindMapContext';
import { ReactNode } from 'react';

describe('MindMapContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MindMapProvider>{children}</MindMapProvider>
  );

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useMindMap());
    }).toThrow('useMindMap must be used within a MindMapProvider');

    console.error = originalError;
  });

  it('should provide initial state', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    expect(result.current.state.nodes.size).toBe(1); // Initial root node
    expect(result.current.state.links).toEqual([]);
    expect(result.current.state.selectedNodeId).toBeNull();
    expect(result.current.state.editingNodeId).toBeNull();
    
    // Check initial node
    const initialNode = Array.from(result.current.state.nodes.values())[0];
    expect(initialNode.id).toBe('root-node');
    expect(initialNode.text).toBe('Mind Map');
  });

  it('should add a root node', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Root Node');
    });

    expect(result.current.state.nodes.size).toBe(2); // Initial node + new node
    const nodes = Array.from(result.current.state.nodes.values());
    const newRootNode = nodes.find(n => n.text === 'Root Node');
    expect(newRootNode).toBeDefined();
    expect(newRootNode!.parent).toBeNull();
  });

  it('should add a child node', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    // Use initial root node as parent
    const rootId = 'root-node';

    // Add child to initial node
    act(() => {
      result.current.addNode(rootId, { x: 100, y: 100 }, 'Child');
    });

    expect(result.current.state.nodes.size).toBe(2); // Initial + child
    expect(result.current.state.links.length).toBe(1);
    expect(result.current.state.links[0].source).toBe(rootId);
  });

  it('should update node text', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Original');
    });

    const nodeId = Array.from(result.current.state.nodes.values())[0].id;

    act(() => {
      result.current.updateNode(nodeId, { text: 'Updated' });
    });

    expect(result.current.state.nodes.get(nodeId)?.text).toBe('Updated');
  });

  it('should delete node and children', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    // Use initial root node
    const rootId = 'root-node';

    act(() => {
      result.current.addNode(rootId, { x: 50, y: 50 }, 'Child');
    });
    
    // Find the child node we just added
    const nodes = Array.from(result.current.state.nodes.values());
    const childNode = nodes.find(n => n.text === 'Child');
    const childId = childNode!.id;

    act(() => {
      result.current.addNode(childId, { x: 100, y: 100 }, 'Grandchild');
    });

    expect(result.current.state.nodes.size).toBe(3); // Initial + child + grandchild

    // Delete child (should also delete grandchild)
    act(() => {
      result.current.deleteNode(childId);
    });

    expect(result.current.state.nodes.size).toBe(1); // Only initial node remains
    expect(result.current.state.nodes.has(rootId)).toBe(true);
  });

  it('should manage node selection', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    // Use initial node
    const nodeId = 'root-node';

    act(() => {
      result.current.selectNode(nodeId);
    });

    expect(result.current.state.selectedNodeId).toBe(nodeId);

    act(() => {
      result.current.selectNode(null);
    });

    expect(result.current.state.selectedNodeId).toBeNull();
  });

  it('should manage editing state', () => {
    const { result } = renderHook(() => useMindMap(), { wrapper });

    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Node');
    });

    const nodeId = Array.from(result.current.state.nodes.values())[0].id;

    act(() => {
      result.current.startEditing(nodeId);
    });

    expect(result.current.state.editingNodeId).toBe(nodeId);

    act(() => {
      result.current.stopEditing();
    });

    expect(result.current.state.editingNodeId).toBeNull();
  });
});