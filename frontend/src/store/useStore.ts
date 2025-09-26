import { Node, Connection, Viewport } from '../renderer/types'

// This is a stub for your actual store implementation
// Replace with your actual Zustand/Redux/Context store

interface MindMapStore {
  // Node state
  nodes: Record<string, Node[]>
  selectedNodeId: string | null
  
  // Connection state
  connections: Record<string, Connection[]>
  
  // Viewport state
  viewport: Record<string, Viewport>
  
  // Actions
  createNode: (mindMapId: string, node: Node) => void
  updateNode: (mindMapId: string, nodeId: string, updates: Partial<Node>) => void
  deleteNode: (mindMapId: string, nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  
  createConnection: (mindMapId: string, connection: Connection) => void
  updateConnection: (mindMapId: string, connectionId: string, updates: Partial<Connection>) => void
  deleteConnection: (mindMapId: string, connectionId: string) => void
  
  setViewport: (mindMapId: string, viewport: Viewport) => void
}

// Mock implementation - replace with your actual store
let storeState: MindMapStore = {
  nodes: {},
  connections: {},
  viewport: {},
  selectedNodeId: null,
  
  createNode: (mindMapId, node) => {
    if (!storeState.nodes[mindMapId]) {
      storeState.nodes[mindMapId] = []
    }
    storeState.nodes[mindMapId].push(node)
  },
  
  updateNode: (mindMapId, nodeId, updates) => {
    const nodes = storeState.nodes[mindMapId] || []
    const index = nodes.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      storeState.nodes[mindMapId][index] = { ...nodes[index], ...updates }
    }
  },
  
  deleteNode: (mindMapId, nodeId) => {
    if (storeState.nodes[mindMapId]) {
      storeState.nodes[mindMapId] = storeState.nodes[mindMapId].filter(n => n.id !== nodeId)
    }
  },
  
  selectNode: (nodeId) => {
    storeState.selectedNodeId = nodeId
  },
  
  createConnection: (mindMapId, connection) => {
    if (!storeState.connections[mindMapId]) {
      storeState.connections[mindMapId] = []
    }
    storeState.connections[mindMapId].push(connection)
  },
  
  updateConnection: (mindMapId, connectionId, updates) => {
    const connections = storeState.connections[mindMapId] || []
    const index = connections.findIndex(c => c.id === connectionId)
    if (index !== -1) {
      storeState.connections[mindMapId][index] = { ...connections[index], ...updates }
    }
  },
  
  deleteConnection: (mindMapId, connectionId) => {
    if (storeState.connections[mindMapId]) {
      storeState.connections[mindMapId] = storeState.connections[mindMapId].filter(c => c.id !== connectionId)
    }
  },
  
  setViewport: (mindMapId, viewport) => {
    storeState.viewport[mindMapId] = viewport
  }
}

// Mock hook - replace with your actual store hook
export function useStore<T>(selector: (state: MindMapStore) => T): T {
  // This is a simplified implementation
  // In a real app, this would be connected to Zustand, Redux, etc.
  return selector(storeState)
}