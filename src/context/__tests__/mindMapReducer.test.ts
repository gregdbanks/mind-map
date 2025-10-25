import { mindMapReducer, initialState } from '../mindMapReducer';
import { Node, Point } from '../../types/mindMap';

describe('mindMapReducer', () => {
  it('should return initial state', () => {
    const state = mindMapReducer(undefined, { type: 'UNKNOWN' } as any);
    expect(state).toEqual(initialState);
  });

  describe('ADD_NODE', () => {
    it('should add a new node as a child of the specified parent', () => {
      // Create initial state with a root node
      const rootNode: Node = {
        id: 'root',
        text: 'Root',
        x: 0,
        y: 0,
        collapsed: false,
        parent: null
      };
      
      const state = {
        ...initialState,
        nodes: new Map([['root', rootNode]])
      };

      const position: Point = { x: 100, y: 100 };
      const action = {
        type: 'ADD_NODE' as const,
        payload: { parentId: 'root', position, text: 'New Node' }
      };

      const newState = mindMapReducer(state, action);
      
      expect(newState.nodes.size).toBe(2);
      expect(newState.links.length).toBe(1);
      
      const newNode = Array.from(newState.nodes.values()).find(n => n.id !== 'root');
      expect(newNode).toBeDefined();
      expect(newNode?.parent).toBe('root');
      expect(newNode?.text).toBe('New Node');
      expect(newNode?.x).toBe(100);
      expect(newNode?.y).toBe(100);
      
      expect(newState.links[0].source).toBe('root');
      expect(newState.links[0].target).toBe(newNode?.id);
    });

    it('should create a root node if parentId is null', () => {
      const emptyState = { ...initialState, nodes: new Map() };
      const position: Point = { x: 0, y: 0 };
      const action = {
        type: 'ADD_NODE' as const,
        payload: { parentId: null, position, text: 'Root Node' }
      };

      const newState = mindMapReducer(emptyState, action);
      
      expect(newState.nodes.size).toBe(1);
      expect(newState.links.length).toBe(0);
      
      const rootNode = Array.from(newState.nodes.values())[0];
      expect(rootNode.parent).toBeNull();
      expect(rootNode.text).toBe('Root Node');
    });
  });

  describe('UPDATE_NODE', () => {
    it('should update node properties', () => {
      const node: Node = {
        id: 'node-1',
        text: 'Original',
        x: 0,
        y: 0,
        collapsed: false,
        parent: null
      };
      
      const state = {
        ...initialState,
        nodes: new Map([['node-1', node]])
      };

      const action = {
        type: 'UPDATE_NODE' as const,
        payload: { id: 'node-1', updates: { text: 'Updated', collapsed: true } }
      };

      const newState = mindMapReducer(state, action);
      const updatedNode = newState.nodes.get('node-1');
      
      expect(updatedNode?.text).toBe('Updated');
      expect(updatedNode?.collapsed).toBe(true);
      expect(updatedNode?.x).toBe(0); // Unchanged
    });
  });

  describe('DELETE_NODE', () => {
    it('should delete node and its children', () => {
      const nodes = new Map<string, Node>([
        ['root', { id: 'root', text: 'Root', x: 0, y: 0, collapsed: false, parent: null }],
        ['child-1', { id: 'child-1', text: 'Child 1', x: 50, y: 50, collapsed: false, parent: 'root' }],
        ['grandchild-1', { id: 'grandchild-1', text: 'Grandchild', x: 100, y: 100, collapsed: false, parent: 'child-1' }]
      ]);

      const links = [
        { source: 'root', target: 'child-1' },
        { source: 'child-1', target: 'grandchild-1' }
      ];

      const state = { ...initialState, nodes, links };

      const action = {
        type: 'DELETE_NODE' as const,
        payload: { id: 'child-1' }
      };

      const newState = mindMapReducer(state, action);
      
      expect(newState.nodes.size).toBe(1);
      expect(newState.nodes.has('root')).toBe(true);
      expect(newState.nodes.has('child-1')).toBe(false);
      expect(newState.nodes.has('grandchild-1')).toBe(false);
      expect(newState.links.length).toBe(0);
    });
  });

  describe('UPDATE_POSITIONS', () => {
    it('should update multiple node positions', () => {
      const nodes = new Map<string, Node>([
        ['node-1', { id: 'node-1', text: 'Node 1', x: 0, y: 0, collapsed: false, parent: null }],
        ['node-2', { id: 'node-2', text: 'Node 2', x: 0, y: 0, collapsed: false, parent: 'node-1' }]
      ]);

      const state = { ...initialState, nodes };

      const positions = new Map<string, Point>([
        ['node-1', { x: 10, y: 20 }],
        ['node-2', { x: 30, y: 40 }]
      ]);

      const action = {
        type: 'UPDATE_POSITIONS' as const,
        payload: { positions }
      };

      const newState = mindMapReducer(state, action);
      
      expect(newState.nodes.get('node-1')?.x).toBe(10);
      expect(newState.nodes.get('node-1')?.y).toBe(20);
      expect(newState.nodes.get('node-2')?.x).toBe(30);
      expect(newState.nodes.get('node-2')?.y).toBe(40);
    });
  });

  describe('SELECT_NODE', () => {
    it('should set selected node id', () => {
      const action = {
        type: 'SELECT_NODE' as const,
        payload: { id: 'node-1' }
      };

      const newState = mindMapReducer(initialState, action);
      expect(newState.selectedNodeId).toBe('node-1');
    });

    it('should clear selection when id is null', () => {
      const state = { ...initialState, selectedNodeId: 'node-1' };
      const action = {
        type: 'SELECT_NODE' as const,
        payload: { id: null }
      };

      const newState = mindMapReducer(state, action);
      expect(newState.selectedNodeId).toBeNull();
    });
  });

  describe('START_EDITING', () => {
    it('should set editing node id', () => {
      const action = {
        type: 'START_EDITING' as const,
        payload: { id: 'node-1' }
      };

      const newState = mindMapReducer(initialState, action);
      expect(newState.editingNodeId).toBe('node-1');
    });
  });

  describe('STOP_EDITING', () => {
    it('should clear editing node id', () => {
      const state = { ...initialState, editingNodeId: 'node-1' };
      const action = { type: 'STOP_EDITING' as const };

      const newState = mindMapReducer(state, action);
      expect(newState.editingNodeId).toBeNull();
    });
  });
});