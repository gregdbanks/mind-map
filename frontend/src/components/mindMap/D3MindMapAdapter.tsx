import React, { useEffect, useRef, useState } from 'react'
import { useMindMap } from '../../store/MindMapContext'
import { D3Renderer } from '../../renderer/D3Renderer'
import { Node } from '../../types'

interface D3MindMapAdapterProps {
  mindMapId: string
}

export const D3MindMapAdapter: React.FC<D3MindMapAdapterProps> = ({ mindMapId }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<D3Renderer | null>(null)
  const { state, actions } = useMindMap()
  const { selectedMindMap, nodes, loading, error } = state
  const { selectMindMap, createNode, updateNode, deleteNode } = actions
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)

  // Load mind map if needed
  useEffect(() => {
    if (mindMapId && (!selectedMindMap || selectedMindMap.id !== mindMapId)) {
      selectMindMap(mindMapId)
    }
  }, [mindMapId, selectedMindMap, selectMindMap])

  // Initialize D3 renderer
  useEffect(() => {
    if (!containerRef.current || loading) return

    // Ensure we're not in a React render phase
    const timeoutId = setTimeout(async () => {
      try {
        console.log('🎨 Initializing D3 renderer...')
        const renderer = new D3Renderer()
        await renderer.initialize(containerRef.current!)
        rendererRef.current = renderer

        // Setup event handlers
        renderer.on('nodeClick', (event: any) => {
          console.log('Node clicked:', event.nodeId)
        })

        renderer.on('nodeDoubleClick', (event: any) => {
          console.log('Node double-clicked:', event.nodeId)
          // Could open node editor
        })

        renderer.on('nodePositionUpdate', async (event: any) => {
          await updateNode(event.nodeId, {
            positionX: event.position.x,
            positionY: event.position.y
          })
        })

        renderer.on('canvasClick', (event: any) => {
          setContextMenu(null)
        })

        renderer.on('canvasDoubleClick', async (event: any) => {
          // Get selected node or find nearest node
          const selectedNode = renderer.getSelectedNode()
          let parentId = selectedNode?.id
          
          // If no selected node, find the nearest node to click position
          if (!parentId) {
            const nodes = renderer.getNodes()
            if (nodes.length > 0) {
              let nearestNode = nodes[0]
              let minDistance = Number.MAX_VALUE
              
              nodes.forEach(node => {
                const dx = node.positionX - event.position.x
                const dy = node.positionY - event.position.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance < minDistance) {
                  minDistance = distance
                  nearestNode = node
                }
              })
              
              parentId = nearestNode.id
            }
          }
          
          await createNode({
            text: 'New Node',
            positionX: event.position.x,
            positionY: event.position.y,
            parentId: parentId
          })
        })

        // Load initial nodes
        nodes.forEach(node => {
          const d3Node = {
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
          renderer.createNode(d3Node)
        })

        console.log('✅ D3 renderer initialized with', nodes.length, 'nodes')
        
        // Fit nodes to view if we have nodes
        if (nodes.length > 0 && renderer.fitToView) {
          setTimeout(() => {
            console.log('Fitting nodes to view...')
            renderer.fitToView()
          }, 200)
        }
      } catch (error) {
        console.error('Failed to initialize D3 renderer:', error)
      }
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      if (rendererRef.current) {
        rendererRef.current.destroy()
        rendererRef.current = null
      }
    }
  }, [loading, mindMapId]) // Removed nodes, createNode, updateNode from dependencies

  // Sync nodes with renderer
  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    // Get current renderer nodes
    const rendererNodes = renderer.getNodes()
    const rendererNodeIds = new Set(rendererNodes.map(n => n.id))

    // Add or update nodes
    nodes.forEach(node => {
      const d3Node = {
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
        renderer.createNode(d3Node)
      } else {
        // Update existing node
        const existingNode = rendererNodes.find(n => n.id === node.id)
        if (existingNode && (
          existingNode.text !== node.text ||
          existingNode.positionX !== node.positionX ||
          existingNode.positionY !== node.positionY
        )) {
          renderer.updateNode(node.id, d3Node)
        }
      }
    })

    // Remove deleted nodes
    rendererNodeIds.forEach(id => {
      if (!nodes.find(n => n.id === id)) {
        renderer.deleteNode(id)
      }
    })
  }, [nodes])

  // Handle context menu
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
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: '100%' }}>
      {/* Help text */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
        <div>Double-click to add child node • Click to select</div>
        <div>Space + drag to pan • Scroll to zoom • Drag to move</div>
      </div>
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-40">
        <button
          className="bg-blue-500 text-white rounded-lg shadow-md p-2 hover:bg-blue-600 transition-colors"
          onClick={async () => {
            const renderer = rendererRef.current
            const viewport = renderer?.getViewport()
            if (viewport && renderer) {
              // Get selected node or find central node
              const selectedNode = renderer.getSelectedNode()
              let parentId = selectedNode?.id
              
              // If no selected node, find a node near the center of viewport
              if (!parentId) {
                const nodes = renderer.getNodes()
                if (nodes.length > 0) {
                  // Use the first node as parent if no better option
                  parentId = nodes[0].id
                }
              }
              
              if (parentId) {
                // Position new node offset from parent
                const parentNode = renderer.getNode(parentId)
                if (parentNode) {
                  const angle = Math.random() * Math.PI * 2
                  const distance = 150 // Distance from parent
                  const centerX = parentNode.positionX + Math.cos(angle) * distance
                  const centerY = parentNode.positionY + Math.sin(angle) * distance
                  
                  await createNode({
                    text: 'New Node',
                    positionX: centerX,
                    positionY: centerY,
                    parentId: parentId
                  })
                }
              }
            }
          }}
          title="Add New Node"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="h-px bg-gray-300 my-1" />
        <button
          className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          onClick={() => rendererRef.current?.zoomBy(0.2)}
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          onClick={() => rendererRef.current?.zoomBy(-0.2)}
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          onClick={() => rendererRef.current?.fitToView()}
          title="Fit to View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          onClick={() => rendererRef.current?.resetViewport()}
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      
      {contextMenu && (
        <div
          className="absolute bg-white rounded shadow-lg py-2 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="px-4 py-2 hover:bg-gray-100 w-full text-left"
            onClick={() => {
              if (contextMenu.nodeId && rendererRef.current) {
                deleteNode(contextMenu.nodeId)
              }
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