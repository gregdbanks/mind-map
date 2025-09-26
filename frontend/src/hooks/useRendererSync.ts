import { useEffect, useRef, useCallback } from 'react'
import { RendererAPI, Node, Connection, Viewport } from '../renderer/types'
import { useStore } from '../store/useStore'

interface UseRendererSyncOptions {
  mindMapId: string
  renderer: RendererAPI | null
  onNodeUpdate?: (nodeId: string, updates: Partial<Node>) => void
  onNodeCreate?: (node: Node) => void
  onNodeDelete?: (nodeId: string) => void
}

export function useRendererSync({
  mindMapId,
  renderer,
  onNodeUpdate,
  onNodeCreate,
  onNodeDelete
}: UseRendererSyncOptions) {
  const lastSyncRef = useRef<{
    nodes: Map<string, string>
    connections: Map<string, string>
    viewport: string
  }>({
    nodes: new Map(),
    connections: new Map(),
    viewport: ''
  })
  
  // Store state
  const nodes = useStore(state => state.nodes[mindMapId] || [])
  const connections = useStore(state => state.connections[mindMapId] || [])
  const viewport = useStore(state => state.viewport[mindMapId])
  const updateNode = useStore(state => state.updateNode)
  const createConnection = useStore(state => state.createConnection)
  const deleteConnection = useStore(state => state.deleteConnection)
  const setViewport = useStore(state => state.setViewport)
  
  // Sync nodes from store to renderer
  const syncNodesToRenderer = useCallback(() => {
    if (!renderer) return
    
    const currentNodes = new Map(nodes.map(n => [n.id, JSON.stringify(n)]))
    const lastNodes = lastSyncRef.current.nodes
    
    // Find changes
    const added: Node[] = []
    const updated: Array<{ id: string; updates: Partial<Node> }> = []
    const deleted: string[] = []
    
    // Check for added/updated nodes
    currentNodes.forEach((nodeStr, id) => {
      const lastNodeStr = lastNodes.get(id)
      if (!lastNodeStr) {
        added.push(JSON.parse(nodeStr))
      } else if (lastNodeStr !== nodeStr) {
        const currentNode = JSON.parse(nodeStr)
        const lastNode = JSON.parse(lastNodeStr)
        
        const updates: Partial<Node> = {}
        if (currentNode.text !== lastNode.text) updates.text = currentNode.text
        if (currentNode.positionX !== lastNode.positionX) updates.positionX = currentNode.positionX
        if (currentNode.positionY !== lastNode.positionY) updates.positionY = currentNode.positionY
        if (JSON.stringify(currentNode.style) !== JSON.stringify(lastNode.style)) {
          updates.style = currentNode.style
        }
        
        if (Object.keys(updates).length > 0) {
          updated.push({ id, updates })
        }
      }
    })
    
    // Check for deleted nodes
    lastNodes.forEach((_, id) => {
      if (!currentNodes.has(id)) {
        deleted.push(id)
      }
    })
    
    // Apply changes to renderer
    added.forEach(node => {
      renderer.createNode(node)
      onNodeCreate?.(node)
    })
    
    if (updated.length > 0) {
      // Use batch update if many nodes changed
      if (updated.length > 10) {
        renderer.batchUpdateNodes(updated.map(u => ({ id: u.id, ...u.updates })))
      } else {
        updated.forEach(({ id, updates }) => {
          renderer.updateNode(id, updates)
          onNodeUpdate?.(id, updates)
        })
      }
    }
    
    deleted.forEach(id => {
      renderer.deleteNode(id)
      onNodeDelete?.(id)
    })
    
    // Update last sync state
    lastSyncRef.current.nodes = currentNodes
  }, [nodes, renderer, onNodeCreate, onNodeUpdate, onNodeDelete])
  
  // Sync connections from store to renderer
  const syncConnectionsToRenderer = useCallback(() => {
    if (!renderer) return
    
    const currentConns = new Map(connections.map(c => [c.id, JSON.stringify(c)]))
    const lastConns = lastSyncRef.current.connections
    
    // Find changes
    const added: Connection[] = []
    const updated: Array<{ id: string; updates: Partial<Connection> }> = []
    const deleted: string[] = []
    
    // Check for added/updated connections
    currentConns.forEach((connStr, id) => {
      const lastConnStr = lastConns.get(id)
      if (!lastConnStr) {
        added.push(JSON.parse(connStr))
      } else if (lastConnStr !== connStr) {
        const currentConn = JSON.parse(connStr)
        const lastConn = JSON.parse(lastConnStr)
        
        const updates: Partial<Connection> = {}
        if (JSON.stringify(currentConn.style) !== JSON.stringify(lastConn.style)) {
          updates.style = currentConn.style
        }
        
        if (Object.keys(updates).length > 0) {
          updated.push({ id, updates })
        }
      }
    })
    
    // Check for deleted connections
    lastConns.forEach((_, id) => {
      if (!currentConns.has(id)) {
        deleted.push(id)
      }
    })
    
    // Apply changes to renderer
    added.forEach(conn => renderer.createConnection(conn))
    updated.forEach(({ id, updates }) => renderer.updateConnection(id, updates))
    deleted.forEach(id => renderer.deleteConnection(id))
    
    // Update last sync state
    lastSyncRef.current.connections = currentConns
  }, [connections, renderer])
  
  // Sync viewport from store to renderer
  const syncViewportToRenderer = useCallback(() => {
    if (!renderer || !viewport) return
    
    const currentViewportStr = JSON.stringify(viewport)
    if (currentViewportStr !== lastSyncRef.current.viewport) {
      renderer.setViewport(viewport)
      lastSyncRef.current.viewport = currentViewportStr
    }
  }, [viewport, renderer])
  
  // Sync renderer state back to store
  const syncFromRenderer = useCallback(() => {
    if (!renderer) return
    
    // This would be called after renderer operations that modify state
    // For example, after drag operations or viewport changes
    const currentViewport = renderer.getViewport()
    setViewport(mindMapId, currentViewport)
  }, [renderer, mindMapId, setViewport])
  
  // Set up sync effects
  useEffect(() => {
    syncNodesToRenderer()
  }, [syncNodesToRenderer])
  
  useEffect(() => {
    syncConnectionsToRenderer()
  }, [syncConnectionsToRenderer])
  
  useEffect(() => {
    syncViewportToRenderer()
  }, [syncViewportToRenderer])
  
  // Return sync functions for manual triggering
  return {
    syncNodesToRenderer,
    syncConnectionsToRenderer,
    syncViewportToRenderer,
    syncFromRenderer
  }
}