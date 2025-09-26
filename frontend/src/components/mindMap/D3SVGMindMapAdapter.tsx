import React, { useEffect, useRef, useState } from 'react'
import { useMindMap } from '../../store/MindMapContext'
import { D3SVGRenderer } from '../../renderer/D3SVGRenderer'
import { Node } from '../../types'

interface D3SVGMindMapAdapterProps {
  mindMapId: string
}

export const D3SVGMindMapAdapter: React.FC<D3SVGMindMapAdapterProps> = ({ mindMapId }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<D3SVGRenderer | null>(null)
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

  // Initialize D3 SVG renderer
  useEffect(() => {
    if (!containerRef.current || loading) return

    const initRenderer = async () => {
      try {
        console.log('🎨 Initializing D3 SVG renderer...')
        const renderer = new D3SVGRenderer()
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
          await createNode(mindMapId, {
            text: 'New Node',
            positionX: event.position.x,
            positionY: event.position.y,
            parentId: undefined
          })
        })

        // Load initial nodes
        nodes.forEach(node => {
          const svgNode = {
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
          renderer.createNode(svgNode)
        })

        console.log('✅ D3 SVG renderer initialized with', nodes.length, 'nodes')
        
        // Fit nodes to view if we have nodes
        if (nodes.length > 0 && renderer.fitToView) {
          setTimeout(() => {
            console.log('Fitting nodes to view...')
            renderer.fitToView()
          }, 200)
        }
      } catch (error) {
        console.error('Failed to initialize D3 SVG renderer:', error)
      }
    }

    initRenderer()

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy()
        rendererRef.current = null
      }
    }
  }, [loading, mindMapId]) // Removed nodes from dependencies to prevent re-init

  // Sync nodes with renderer
  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    // Get current renderer nodes
    const rendererNodes = renderer.getNodes()
    const rendererNodeIds = new Set(rendererNodes.map(n => n.id))

    // Add or update nodes
    nodes.forEach(node => {
      const svgNode = {
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
        renderer.createNode(svgNode)
      } else {
        // Update existing node
        const existingNode = rendererNodes.find(n => n.id === node.id)
        if (existingNode && (
          existingNode.text !== node.text ||
          existingNode.positionX !== node.positionX ||
          existingNode.positionY !== node.positionY
        )) {
          renderer.updateNode(node.id, svgNode)
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
    <div ref={containerRef} className="w-full h-full relative">
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