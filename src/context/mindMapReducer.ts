import type { MindMapState, Node, Link, Point } from '../types/mindMap';

export type MindMapAction =
  | { type: 'ADD_NODE'; payload: { parentId: string | null; position: Point; text?: string; id?: string } }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<Node> } }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'UPDATE_POSITIONS'; payload: { positions: Map<string, Point> } }
  | { type: 'SELECT_NODE'; payload: { id: string | null } }
  | { type: 'START_EDITING'; payload: { id: string } }
  | { type: 'STOP_EDITING' }
  | { type: 'LOAD_MINDMAP'; payload: { nodes: Node[]; links: Link[] } }
  | { type: 'UPDATE_LAST_MODIFIED' };

// Create initial node in center of typical viewport
const initialNodeId = 'root-node';
const initialNodes = new Map<string, Node>();
initialNodes.set(initialNodeId, {
  id: initialNodeId,
  text: 'Mind Map',
  x: window.innerWidth / 2 || 600,
  y: window.innerHeight / 2 || 400,
  collapsed: false,
  parent: null,
  fx: window.innerWidth / 2 || 600,  // Fixed position to prevent drift
  fy: window.innerHeight / 2 || 400
});

export const initialState: MindMapState = {
  nodes: initialNodes,
  links: [],
  selectedNodeId: null,
  editingNodeId: null,
  lastModified: new Date(),
};

function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function deleteNodeAndChildren(
  nodes: Map<string, Node>,
  links: Link[],
  nodeId: string
): { nodes: Map<string, Node>; links: Link[] } {
  const nodesToDelete = new Set<string>([nodeId]);
  
  // Find all descendant nodes
  const findDescendants = (parentId: string) => {
    nodes.forEach((node) => {
      if (node.parent === parentId) {
        nodesToDelete.add(node.id);
        findDescendants(node.id);
      }
    });
  };
  
  findDescendants(nodeId);
  
  // Create new nodes map without deleted nodes
  const newNodes = new Map(nodes);
  nodesToDelete.forEach(id => newNodes.delete(id));
  
  // Filter links
  const newLinks = links.filter(
    link => !nodesToDelete.has(link.source) && !nodesToDelete.has(link.target)
  );
  
  return { nodes: newNodes, links: newLinks };
}

export function mindMapReducer(
  state: MindMapState = initialState,
  action: MindMapAction
): MindMapState {
  switch (action.type) {
    case 'ADD_NODE': {
      const { parentId, position, text = 'New Node', id } = action.payload;
      const newNode: Node = {
        id: id || generateNodeId(),
        text,
        x: position.x,
        y: position.y,
        collapsed: false,
        parent: parentId,
      };
      
      const newNodes = new Map(state.nodes);
      newNodes.set(newNode.id, newNode);
      
      const newLinks = [...state.links];
      if (parentId) {
        newLinks.push({ source: parentId, target: newNode.id });
      }
      
      return {
        ...state,
        nodes: newNodes,
        links: newLinks,
        lastModified: new Date(),
      };
    }
    
    case 'UPDATE_NODE': {
      const { id, updates } = action.payload;
      const node = state.nodes.get(id);
      if (!node) return state;
      
      const newNodes = new Map(state.nodes);
      newNodes.set(id, { ...node, ...updates });
      
      return {
        ...state,
        nodes: newNodes,
        lastModified: new Date(),
      };
    }
    
    case 'DELETE_NODE': {
      const { id } = action.payload;
      const result = deleteNodeAndChildren(state.nodes, state.links, id);
      
      return {
        ...state,
        nodes: result.nodes,
        links: result.links,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        editingNodeId: state.editingNodeId === id ? null : state.editingNodeId,
        lastModified: new Date(),
      };
    }
    
    case 'UPDATE_POSITIONS': {
      const { positions } = action.payload;
      const newNodes = new Map(state.nodes);
      
      positions.forEach((position, nodeId) => {
        const node = newNodes.get(nodeId);
        if (node) {
          newNodes.set(nodeId, { ...node, x: position.x, y: position.y });
        }
      });
      
      return {
        ...state,
        nodes: newNodes,
        lastModified: new Date(),
      };
    }
    
    case 'SELECT_NODE': {
      return {
        ...state,
        selectedNodeId: action.payload.id,
      };
    }
    
    case 'START_EDITING': {
      return {
        ...state,
        editingNodeId: action.payload.id,
      };
    }
    
    case 'STOP_EDITING': {
      return {
        ...state,
        editingNodeId: null,
      };
    }
    
    case 'LOAD_MINDMAP': {
      const { nodes, links } = action.payload;
      const nodeMap = new Map<string, Node>();
      nodes.forEach(node => nodeMap.set(node.id, node));
      
      return {
        ...state,
        nodes: nodeMap,
        links,
        lastModified: new Date(),
      };
    }
    
    case 'UPDATE_LAST_MODIFIED': {
      return {
        ...state,
        lastModified: new Date(),
      };
    }
    
    default:
      return state;
  }
}