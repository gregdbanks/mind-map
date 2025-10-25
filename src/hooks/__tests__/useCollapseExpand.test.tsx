import { renderHook, act } from '@testing-library/react';
import { useCollapseExpand } from '../useCollapseExpand';
import { MindMapProvider, useMindMap } from '../../context/MindMapContext';


describe('useCollapseExpand', () => {
  it('should toggle collapse state of a node', () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    const { result, rerender } = renderHook(() => {
      const ctx = useMindMap();
      contextApi = ctx;
      return useCollapseExpand();
    }, { 
      wrapper: ({ children }) => (
        <MindMapProvider>
          {children}
        </MindMapProvider>
      )
    });

    // Add parent node
    act(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Parent');
    });
    
    // Force rerender to ensure state is updated
    rerender();

    const nodes = Array.from(contextApi!.state.nodes.values());
    const parentNode = nodes.find(n => n.text === 'Parent');
    const parentId = parentNode!.id;
    
    // Add child nodes
    act(() => {
      contextApi!.addNode(parentId, { x: 200, y: 150 }, 'Child 1');
      contextApi!.addNode(parentId, { x: 200, y: 250 }, 'Child 2');
    });

    // Toggle collapse
    act(() => {
      result.current.toggleCollapse(parentId);
    });

    const parent = contextApi!.state.nodes.get(parentId);
    expect(parent?.collapsed).toBe(true);

    // Toggle expand
    act(() => {
      result.current.toggleCollapse(parentId);
    });

    expect(contextApi!.state.nodes.get(parentId)?.collapsed).toBe(false);
  });

  it('should identify nodes with children', () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    const { result, rerender } = renderHook(() => {
      const ctx = useMindMap();
      contextApi = ctx;
      return useCollapseExpand();
    }, { 
      wrapper: ({ children }) => (
        <MindMapProvider>
          {children}
        </MindMapProvider>
      )
    });

    // Add nodes
    act(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Parent');
    });
    
    rerender();
    
    act(() => {
      const nodes = Array.from(contextApi!.state.nodes.values());
      const parentNode = nodes.find(n => n.text === 'Parent');
      const parentId = parentNode!.id;
      contextApi!.addNode(parentId, { x: 200, y: 150 }, 'Child');
      contextApi!.addNode(null, { x: 300, y: 100 }, 'Leaf');
    });

    const nodes = Array.from(contextApi!.state.nodes.values());
    const parentNode = nodes.find(n => n.text === 'Parent');
    const leafNode = nodes.find(n => n.text === 'Leaf');

    expect(result.current.hasChildren(parentNode!.id)).toBe(true);
    expect(result.current.hasChildren(leafNode!.id)).toBe(false);
  });

  it('should get visible nodes excluding collapsed children', () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    const { result, rerender } = renderHook(() => {
      const ctx = useMindMap();
      contextApi = ctx;
      return useCollapseExpand();
    }, { 
      wrapper: ({ children }) => (
        <MindMapProvider>
          {children}
        </MindMapProvider>
      )
    });

    // Add hierarchical nodes
    act(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Root');
    });
    
    rerender();
    
    act(() => {
      const nodes = Array.from(contextApi!.state.nodes.values());
      const rootNode = nodes.find(n => n.text === 'Root');
      const rootId = rootNode!.id;
      contextApi!.addNode(rootId, { x: 200, y: 150 }, 'Child 1');
      contextApi!.addNode(rootId, { x: 200, y: 250 }, 'Child 2');
    });
    
    rerender();
    
    act(() => {
      const child1Id = Array.from(contextApi!.state.nodes.values())
        .find(n => n.text === 'Child 1')!.id;
      contextApi!.addNode(child1Id, { x: 300, y: 150 }, 'Grandchild');
    });

    // All nodes should be visible initially (Initial + Root + Child1 + Child2 + Grandchild = 5)
    expect(result.current.visibleNodes).toHaveLength(5);
    expect(result.current.visibleLinks).toHaveLength(3);

    // Collapse the root
    const nodes = Array.from(contextApi!.state.nodes.values());
    const rootNode = nodes.find(n => n.text === 'Root');
    const rootId = rootNode!.id;
    act(() => {
      result.current.toggleCollapse(rootId);
    });

    // Initial node and root should be visible
    expect(result.current.visibleNodes).toHaveLength(2);
    expect(result.current.visibleLinks).toHaveLength(0);

    // Expand root but collapse child 1
    act(() => {
      result.current.toggleCollapse(rootId);
      const child1Id = Array.from(contextApi!.state.nodes.values())
        .find(n => n.text === 'Child 1')!.id;
      result.current.toggleCollapse(child1Id);
    });

    // Initial, Root, Child 1, and Child 2 should be visible (not Grandchild)
    expect(result.current.visibleNodes).toHaveLength(4);
    expect(result.current.visibleLinks).toHaveLength(2);
  });

  it('should handle collapse all and expand all operations', () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    const { result, rerender } = renderHook(() => {
      const ctx = useMindMap();
      contextApi = ctx;
      return useCollapseExpand();
    }, { 
      wrapper: ({ children }) => (
        <MindMapProvider>
          {children}
        </MindMapProvider>
      )
    });

    // Create a tree structure
    act(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Root');
    });
    
    rerender();
    
    act(() => {
      const nodes = Array.from(contextApi!.state.nodes.values());
      const rootNode = nodes.find(n => n.text === 'Root');
      const rootId = rootNode!.id;
      
      for (let i = 0; i < 3; i++) {
        contextApi!.addNode(rootId, { x: 200, y: 100 + i * 50 }, `Child ${i}`);
      }
    });

    // Collapse all nodes with children
    act(() => {
      result.current.collapseAll();
    });

    // Check that root is collapsed
    const rootNode = Array.from(contextApi!.state.nodes.values())
      .find(n => n.text === 'Root');
    expect(rootNode?.collapsed).toBe(true);

    // Expand all
    act(() => {
      result.current.expandAll();
    });

    // All nodes should be expanded
    Array.from(contextApi!.state.nodes.values()).forEach(node => {
      if (result.current.hasChildren(node.id)) {
        expect(node.collapsed).toBe(false);
      }
    });
  });

  it('should animate collapse/expand transitions', () => {
    jest.useFakeTimers();
    
    let contextApi: ReturnType<typeof useMindMap>;
    
    const { result, rerender } = renderHook(() => {
      const ctx = useMindMap();
      contextApi = ctx;
      return useCollapseExpand();
    }, { 
      wrapper: ({ children }) => (
        <MindMapProvider>
          {children}
        </MindMapProvider>
      )
    });

    // Add nodes
    act(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Parent');
    });
    
    rerender();
    
    act(() => {
      const parentId = Array.from(contextApi!.state.nodes.values())[0].id;
      contextApi!.addNode(parentId, { x: 200, y: 150 }, 'Child');
    });

    const parentId = Array.from(contextApi!.state.nodes.values())[0].id;

    // Start collapse animation
    act(() => {
      result.current.toggleCollapse(parentId);
    });

    // Check if animating state is tracked
    expect(result.current.isAnimating(parentId)).toBe(true);

    // After animation completes
    act(() => {
      jest.advanceTimersByTime(300); // Assuming 300ms animation
    });

    expect(result.current.isAnimating(parentId)).toBe(false);
    
    jest.useRealTimers();
  });

  it('should handle keyboard shortcuts for collapse/expand', () => {
    let contextApi: ReturnType<typeof useMindMap>;
    
    const { result, rerender } = renderHook(() => {
      const ctx = useMindMap();
      contextApi = ctx;
      return useCollapseExpand();
    }, { 
      wrapper: ({ children }) => (
        <MindMapProvider>
          {children}
        </MindMapProvider>
      )
    });

    // Add nodes and select parent
    act(() => {
      contextApi!.addNode(null, { x: 100, y: 100 }, 'Parent');
    });
    
    rerender();
    
    act(() => {
      const parentId = Array.from(contextApi!.state.nodes.values())[0].id;
      contextApi!.addNode(parentId, { x: 200, y: 150 }, 'Child');
      contextApi!.selectNode(parentId);
    });

    // Handle space key to toggle
    act(() => {
      result.current.handleKeyPress('Space');
    });

    const parentNode = Array.from(contextApi!.state.nodes.values())[0];
    expect(parentNode.collapsed).toBe(true);

    // Space again to expand
    act(() => {
      result.current.handleKeyPress('Space');
    });

    expect(contextApi!.state.nodes.get(parentNode.id)?.collapsed).toBe(false);
  });
});