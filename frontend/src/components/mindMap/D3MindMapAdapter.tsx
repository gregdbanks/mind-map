import React, { useEffect, useRef, useState } from 'react'
import { useMindMap } from '../../store/MindMapContext'
import { D3Renderer } from '../../renderer/D3Renderer'
import { Node } from '../../types'
import { ConfirmDialog } from '../ConfirmDialog'

interface D3MindMapAdapterProps {
  mindMapId: string
}

export const D3MindMapAdapter: React.FC<D3MindMapAdapterProps> = ({ mindMapId }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<D3Renderer | null>(null)
  const { state, actions } = useMindMap()
  const { selectedMindMap, nodes, loading, error } = state
  const { selectMindMap, createNode, updateNode, deleteNode } = actions
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; nodeId: string | null }>({ 
    isOpen: false, 
    nodeId: null 
  })
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 
                   'ontouchstart' in window ||
                   navigator.maxTouchPoints > 0)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Helper function to find orphaned nodes
  const findOrphanedNodes = () => {
    const nodeMap = new Map(nodes.map(n => [n.id, n]))
    const visited = new Set<string>()
    const orphans: string[] = []
    
    // Find root nodes (nodes without parents)
    const rootNodes = nodes.filter(n => !n.parentId)
    
    // Traverse from each root to mark all connected nodes
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      // Find all children of this node
      nodes.filter(n => n.parentId === nodeId).forEach(child => {
        traverse(child.id)
      })
    }
    
    // Start traversal from all root nodes
    rootNodes.forEach(root => traverse(root.id))
    
    // Any node not visited is an orphan
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        orphans.push(node.id)
      }
    })
    
    return orphans
  }

  // Load mind map if needed
  useEffect(() => {
    if (mindMapId && (!selectedMindMap || selectedMindMap.id !== mindMapId)) {
      selectMindMap(mindMapId)
    }
  }, [mindMapId, selectedMindMap, selectMindMap])

  // Initialize D3 renderer
  useEffect(() => {
    if (!canvasContainerRef.current || loading) return

    // Ensure we're not in a React render phase
    const timeoutId = setTimeout(async () => {
      try {
        console.log('🎨 Initializing D3 renderer...')
        const renderer = new D3Renderer()
        await renderer.initialize(canvasContainerRef.current!)
        rendererRef.current = renderer
        // Make renderer available globally for testing
        ;(window as any).rendererRef = rendererRef

        // Setup event handlers
        renderer.on('nodeClick', (event: any) => {
          console.log('Node clicked:', event.nodeId)
          setSelectedNodeId(event.nodeId)
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
        
        renderer.on('nodeContextMenu', (event: any) => {
          setContextMenu({
            x: event.position.x,
            y: event.position.y,
            nodeId: event.nodeId
          })
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
        event.preventDefault()
        
        // Don't delete if user is typing in an input
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return
        }
        
        // Show confirmation dialog
        setDeleteConfirm({ isOpen: true, nodeId: selectedNodeId })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, deleteNode])

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
      {/* Canvas layer - simple and clean */}
      <div ref={canvasContainerRef} className="absolute inset-0" />
      
      {/* Context menu */}
      {contextMenu && (
        <div
          className="absolute bg-white rounded shadow-lg py-2"
          style={{ 
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 1000 
          }}
        >
          <button
            className="px-4 py-2 hover:bg-gray-100 w-full text-left"
            onClick={() => {
              if (contextMenu.nodeId) {
                setDeleteConfirm({ isOpen: true, nodeId: contextMenu.nodeId })
              }
              setContextMenu(null)
            }}
          >
            Delete Node
          </button>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Node"
        message="Are you sure you want to delete this node? This will also delete all of its children."
        onConfirm={() => {
          if (deleteConfirm.nodeId) {
            deleteNode(deleteConfirm.nodeId)
            if (selectedNodeId === deleteConfirm.nodeId) {
              setSelectedNodeId(null)
            }
          }
          setDeleteConfirm({ isOpen: false, nodeId: null })
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, nodeId: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}