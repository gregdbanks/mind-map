import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { PixiRenderer } from '../../renderer/PixiRenderer'
import { Node, Connection, InteractionEvent } from '../../renderer/types'
import { useMindMap } from '../../store/MindMapContext'

interface PixiMindMapAdapterProps {
  mindMapId: string
  className?: string
  onNodeSelect?: (nodeId: string) => void
  onNodeEdit?: (nodeId: string) => void
  onCanvasDoubleClick?: (position: { x: number; y: number }) => void
}

// Add pulse animation style
const pulseStyle = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

export const PixiMindMapAdapter: React.FC<PixiMindMapAdapterProps> = ({
  mindMapId,
  className = '',
  onNodeSelect,
  onNodeEdit,
  onCanvasDoubleClick
}) => {
  // ALWAYS log this for debugging
  console.log('🚀 PixiMindMapAdapter MOUNTED! mindMapId:', mindMapId)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<PixiRenderer | null>(null)
  const initializingRef = useRef(false)
  
  // Store hooks - using your actual MindMapContext
  const { state, actions } = useMindMap()
  const { nodes, canvasState, loading, error, selectedMindMap } = state
  
  // Debug logging for node data
  console.log('🔍 PixiMindMapAdapter state:', { 
    mindMapId, 
    selectedMindMapId: selectedMindMap?.id,
    nodesCount: nodes.length,
    loading, 
    error,
    canvasState: canvasState ? { zoom: canvasState.zoom, panX: canvasState.panX, panY: canvasState.panY } : null
  })
  
  // Convert nodes to connections for PixiJS
  const connections = useMemo(() => {
    const conns: Connection[] = []
    nodes.forEach(node => {
      if (node.parentId) {
        conns.push({
          id: `${node.parentId}-${node.id}`,
          parentId: node.parentId,
          childId: node.id
        })
      }
    })
    return conns
  }, [nodes])
  
  // Performance monitoring would go here if needed
  
  // Ensure mind map data is loaded
  useEffect(() => {
    console.log('🔄 Checking if mind map needs to be loaded...', { 
      mindMapId, 
      selectedMindMapId: selectedMindMap?.id, 
      loading 
    })
    
    // Load the mind map if it's not already selected or if it's different
    if (!loading && (!selectedMindMap || selectedMindMap.id !== mindMapId)) {
      console.log('🔄 Loading mind map:', mindMapId)
      actions.selectMindMap(mindMapId)
    }
  }, [mindMapId, selectedMindMap, loading, actions])
  
  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current || initializingRef.current || loading) return
    
    // Wait for the selectedMindMap to match the requested mindMapId before initializing
    if (!selectedMindMap || selectedMindMap.id !== mindMapId) {
      console.log('🎨 Waiting for mind map to be loaded before initializing renderer')
      return
    }
    
    console.log('🎨 PixiMindMapAdapter: Starting initialization...')
    initializingRef.current = true
    
    const initializeRenderer = async () => {
      try {
        console.log('🎨 Creating PixiRenderer instance...')
        const renderer = new PixiRenderer()
        
        console.log('🎨 Initializing renderer with container:', containerRef.current)
        await renderer.initialize(containerRef.current!)
        
        console.log('🎨 Setting up event handlers...')
        // Set up event handlers
        renderer.on('nodeClick', handleNodeClick)
        renderer.on('nodeDoubleClick', handleNodeDoubleClick)
        renderer.on('nodeDragEnd', handleNodeDragEnd)
        renderer.on('canvasDoubleClick', handleCanvasDoubleClick)
        renderer.on('nodeRightClick', handleNodeRightClick)
        
        console.log('🎨 Loading nodes:', nodes.length, nodes)
        
        // If no nodes exist, don't create a test node - let user create the first one
        if (nodes.length === 0) {
          console.log('No nodes found - waiting for user to create first node')
          // Don't create a test node - the sync effect will handle real nodes
        } else {
          // Load initial data with type conversion
          nodes.forEach(node => {
            const pixiNode = {
              id: node.id,
              text: node.text,
              positionX: node.positionX,
              positionY: node.positionY,
              parentId: node.parentId || undefined,
              backgroundColor: node.backgroundColor,
              textColor: node.textColor,
              style: {
                backgroundColor: node.backgroundColor,
                color: node.textColor
              }
            }
            console.log('Creating node:', pixiNode)
            renderer.createNode(pixiNode)
          })
        }
        connections.forEach(conn => renderer.createConnection(conn))
        
        if (canvasState) {
          renderer.setViewport({
            x: canvasState.panX,
            y: canvasState.panY,
            zoom: canvasState.zoom,
            rotation: 0
          })
        }
        
        rendererRef.current = renderer
        console.log('✅ PixiJS renderer initialized successfully!')
        
        // Check if canvas was actually created
        const canvas = containerRef.current?.querySelector('canvas')
        console.log('Canvas element:', canvas)
        console.log('Canvas size:', canvas?.width, 'x', canvas?.height)
        
        // Performance monitoring could be added here
      } catch (error) {
        console.error('❌ Failed to initialize PixiJS renderer:', error)
        window.__pixiError = error
        initializingRef.current = false
      }
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(initializeRenderer, 100)
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy()
        rendererRef.current = null
      }
      initializingRef.current = false
    }
  }, [mindMapId, selectedMindMap, loading, nodes, connections, canvasState])
  
  // Sync nodes with renderer
  useEffect(() => {
    if (!rendererRef.current || loading) return
    
    const renderer = rendererRef.current
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const rendererNodes = renderer.getNodes()
    const rendererNodeIds = new Set(rendererNodes.map(n => n.id))
    
    // Add or update nodes
    nodes.forEach(node => {
      const pixiNode = {
        id: node.id,
        text: node.text,
        positionX: node.positionX,
        positionY: node.positionY,
        parentId: node.parentId || undefined,
        backgroundColor: node.backgroundColor,
        textColor: node.textColor,
        style: {
          backgroundColor: node.backgroundColor,
          color: node.textColor
        }
      }
      
      if (!rendererNodeIds.has(node.id)) {
        renderer.createNode(pixiNode)
      } else {
        const existingNode = rendererNodes.find(n => n.id === node.id)
        if (existingNode && (
          existingNode.text !== node.text ||
          existingNode.positionX !== node.positionX ||
          existingNode.positionY !== node.positionY
        )) {
          renderer.updateNode(node.id, pixiNode)
        }
      }
    })
    
    // Remove deleted nodes
    rendererNodeIds.forEach(id => {
      if (!nodeMap.has(id)) {
        renderer.deleteNode(id)
      }
    })
  }, [nodes, loading])
  
  // Sync connections with renderer
  useEffect(() => {
    if (!rendererRef.current) return
    
    const renderer = rendererRef.current
    const connMap = new Map(connections.map(c => [c.id, c]))
    const rendererConns = renderer.getConnections()
    const rendererConnIds = new Set(rendererConns.map(c => c.id))
    
    // Add or update connections
    connections.forEach(conn => {
      if (!rendererConnIds.has(conn.id)) {
        renderer.createConnection(conn)
      }
    })
    
    // Remove deleted connections
    rendererConnIds.forEach(id => {
      if (!connMap.has(id)) {
        renderer.deleteConnection(id)
      }
    })
  }, [connections])
  
  // We'll handle selection internally for now
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId || !rendererRef.current) return
      
      // Don't handle shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          // Delete selected node
          actions.deleteNode(selectedNodeId)
          setSelectedNodeId(null)
          break
          
        case 'Enter':
          if (selectedNodeId) {
            e.preventDefault()
            // Edit selected node
            onNodeEdit?.(selectedNodeId)
          }
          break
          
        case 'Tab':
          e.preventDefault()
          // Create child node
          const parentNode = nodes.find(n => n.id === selectedNodeId)
          if (parentNode) {
            const newNodeData = {
              text: 'New Node',
              positionX: parentNode.positionX + 150,
              positionY: parentNode.positionY,
              parentId: selectedNodeId
            }
            actions.createNode(newNodeData)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, nodes, actions, onNodeEdit])
  
  // Event handlers
  const handleNodeClick = useCallback((event: InteractionEvent) => {
    if (event.nodeId) {
      setSelectedNodeId(event.nodeId)
      onNodeSelect?.(event.nodeId)
    }
  }, [onNodeSelect])
  
  const handleNodeDoubleClick = useCallback((event: InteractionEvent) => {
    if (event.nodeId) {
      onNodeEdit?.(event.nodeId)
    }
  }, [onNodeEdit])
  
  const handleNodeDragEnd = useCallback((event: InteractionEvent) => {
    if (!event.nodeId || !rendererRef.current) return
    
    // Update node positions in store
    const node = rendererRef.current.getNode(event.nodeId)
    if (node) {
      // Update the node position using your actual API
      actions.updateNode(event.nodeId, {
        positionX: node.positionX,
        positionY: node.positionY
      })
    }
  }, [actions])
  
  const handleCanvasDoubleClick = useCallback((event: InteractionEvent) => {
    if (event.worldPosition) {
      onCanvasDoubleClick?.(event.worldPosition)
    }
  }, [onCanvasDoubleClick])
  
  const handleNodeRightClick = useCallback((event: InteractionEvent) => {
    if (event.nodeId && event.screenPosition) {
      setContextMenu({
        x: event.screenPosition.x,
        y: event.screenPosition.y,
        nodeId: event.nodeId
      })
    }
  }, [])
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    rendererRef.current?.zoomBy(0.1)
  }, [])
  
  const handleZoomOut = useCallback(() => {
    rendererRef.current?.zoomBy(-0.1)
  }, [])
  
  const handleResetView = useCallback(() => {
    rendererRef.current?.resetViewport()
  }, [])
  
  // Viewport controls with FIXED styling
  const viewportControls = useMemo(() => (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 1000 }}>
      <button
        onClick={handleZoomIn}
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid #ccc',
          borderRadius: '8px',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid #ccc',
          borderRadius: '8px',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        aria-label="Zoom out"
        title="Zoom out"
      >
        -
      </button>
      <button
        onClick={handleResetView}
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid #ccc',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        aria-label="Reset view"
        title="Reset view"
      >
        FIT
      </button>
    </div>
  ), [handleZoomIn, handleZoomOut, handleResetView])
  
  // Close context menu on click outside - MUST be before any early returns!
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      window.addEventListener('click', handleClickOutside)
      return () => window.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])
  
  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Error: {error}</div>
  }
  
  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '100vh' }}>
      <style>{pulseStyle}</style>
      <div
        ref={containerRef}
        id="mind-map-canvas"
        className="w-full h-full"
        style={{ 
          cursor: 'default',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}
      />
      {viewportControls}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              onNodeEdit?.(contextMenu.nodeId)
              setContextMenu(null)
            }}
          >
            Edit Node
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              const node = nodes.find(n => n.id === contextMenu.nodeId)
              if (node) {
                actions.createNode({
                  text: 'New Child',
                  positionX: node.positionX + 150,
                  positionY: node.positionY,
                  parentId: contextMenu.nodeId
                })
              }
              setContextMenu(null)
            }}
          >
            Add Child
          </button>
          <hr className="my-1" />
          <button
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              actions.deleteNode(contextMenu.nodeId)
              setContextMenu(null)
            }}
          >
            Delete Node
          </button>
        </div>
      )}
    </div>
  )
}

export default PixiMindMapAdapter