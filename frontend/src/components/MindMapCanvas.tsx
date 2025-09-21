import { useEffect, useState, useRef } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import { useMindMap } from '../store/MindMapContext'
import { Node } from './Node'
import type { Node as NodeType } from '../types'
import type Konva from 'konva'
import { ShareDialog } from './ShareDialog'
import './MindMapCanvas.css'

interface MindMapCanvasProps {
  mindMapId: string
}

interface EditingNode {
  id: string
  text: string
}

interface ContextMenu {
  nodeId: string
  x: number
  y: number
}

export function MindMapCanvas({ mindMapId }: MindMapCanvasProps) {
  const { state, actions } = useMindMap()
  const { nodes, canvasState, loading, error, selectedMindMap } = state
  const currentMindMap = selectedMindMap
  
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPointerPosition, setLastPointerPosition] = useState<{ x: number; y: number } | null>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [_isDragging, setIsDragging] = useState(false)
  const [_dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Load mind map data
  useEffect(() => {
    actions.selectMindMap(mindMapId)
  }, [mindMapId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNode) return // Don't handle shortcuts while editing
      
      if (e.key === ' ' && !isPanning) {
        e.preventDefault()
        setIsPanning(true)
        document.body.style.cursor = 'grab'
      } else if (e.key === 'Delete' && selectedNodes.size > 0) {
        selectedNodes.forEach(nodeId => {
          actions.deleteNode(nodeId)
        })
        setSelectedNodes(new Set())
      } else if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault()
        setSelectedNodes(new Set(nodes.map(n => n.id)))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedNodes(new Set())
        setContextMenu(null)
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isPanning) {
        e.preventDefault()
        setIsPanning(false)
        setLastPointerPosition(null)
        document.body.style.cursor = 'default'
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.body.style.cursor = 'default'
    }
  }, [selectedNodes, nodes, actions, editingNode, isPanning])

  const handleNodeClick = (nodeId: string, e: any) => {
    if (e.cancelBubble !== undefined) e.cancelBubble = true
    const evt = e.evt || e
    if (evt.ctrlKey || evt.metaKey) {
      const newSelection = new Set(selectedNodes)
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId)
      } else {
        newSelection.add(nodeId)
      }
      setSelectedNodes(newSelection)
    } else {
      setSelectedNodes(new Set([nodeId]))
    }
  }

  const handleNodeDragStart = (nodeId: string) => {
    setIsDragging(true)
    const node = nodes.find((n: NodeType) => n.id === nodeId)
    if (node) {
      setDragStart({ x: node.positionX, y: node.positionY })
    }
  }

  const handleNodeDragEnd = (nodeId: string, e: any) => {
    setIsDragging(false)
    const target = e.target || e.currentTarget
    const newX = typeof target.x === 'function' ? target.x() : target.x || 100
    const newY = typeof target.y === 'function' ? target.y() : target.y || 100
    
    actions.batchUpdateNodes([{
      id: nodeId,
      positionX: newX,
      positionY: newY,
    }])
  }

  const handleNodeDoubleClick = (node: NodeType) => {
    setEditingNode({ id: node.id, text: node.text })
  }

  const handleNodeRightClick = (nodeId: string, e: any) => {
    if (e.cancelBubble !== undefined) e.cancelBubble = true
    const evt = e.evt || e
    if (evt.preventDefault) evt.preventDefault()
    
    const stage = stageRef.current
    if (stage && stage.getPointerPosition) {
      const pointerPosition = stage.getPointerPosition()
      if (pointerPosition) {
        setContextMenu({
          nodeId,
          x: pointerPosition.x,
          y: pointerPosition.y,
        })
      }
    } else {
      // Fallback for mock environment
      setContextMenu({
        nodeId,
        x: 100,
        y: 100,
      })
    }
  }

  const handleStageDoubleClick = (e: any) => {
    const target = e.target || e.currentTarget
    const stage = stageRef.current
    
    // Check if click was on stage background
    const isStageClick = !target.attrs || target === (stage && stage.getStage && stage.getStage())
    
    if (isStageClick) {
      if (stage && stage.getPointerPosition) {
        const pointerPosition = stage.getPointerPosition()
        if (pointerPosition && canvasState) {
          const x = (pointerPosition.x - canvasState.panX) / canvasState.zoom
          const y = (pointerPosition.y - canvasState.panY) / canvasState.zoom
          
          actions.createNode({
            text: 'New Node',
            positionX: x,
            positionY: y,
          })
        }
      } else {
        // Fallback for mock environment
        actions.createNode({
          text: 'New Node',
          positionX: e.clientX || 100,
          positionY: e.clientY || 100,
        })
      }
    }
  }

  const handleWheel = (e: any) => {
    const evt = e.evt || e
    if (evt.preventDefault) evt.preventDefault()
    
    if (evt.ctrlKey) {
      // Zoom
      const stage = stageRef.current
      if (stage && canvasState) {
        const oldScale = canvasState.zoom
        const scaleBy = 1.1
        const newScale = evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        
        actions.updateCanvas({ zoom: newScale })
      }
    } else {
      // Pan
      if (canvasState) {
        actions.updateCanvas({
          panX: canvasState.panX - evt.deltaX,
          panY: canvasState.panY - evt.deltaY,
        })
      }
    }
  }

  const handleMouseDown = () => {
    if (isPanning) {
      const stage = stageRef.current
      if (!stage) return
      
      const pos = stage.getPointerPosition()
      setLastPointerPosition(pos)
      document.body.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = () => {
    if (isPanning && lastPointerPosition) {
      const stage = stageRef.current
      if (!stage) return
      
      const pos = stage.getPointerPosition()
      if (!pos) return

      const dx = pos.x - lastPointerPosition.x
      const dy = pos.y - lastPointerPosition.y

      const newPanX = (canvasState?.panX || 0) + dx
      const newPanY = (canvasState?.panY || 0) + dy

      actions.updateCanvas({
        zoom: canvasState?.zoom || 1,
        panX: newPanX,
        panY: newPanY,
      })

      setLastPointerPosition(pos)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setLastPointerPosition(null)
      document.body.style.cursor = 'grab'
    }
  }

  const handleZoomIn = () => {
    if (canvasState) {
      actions.updateCanvas({ zoom: canvasState.zoom * 1.2 })
    }
  }

  const handleZoomOut = () => {
    if (canvasState) {
      actions.updateCanvas({ zoom: canvasState.zoom / 1.2 })
    }
  }

  const handleResetView = () => {
    actions.resetCanvas(false)
  }

  const renderConnection = (parentNode: NodeType, childNode: NodeType) => {
    const points = [
      parentNode.positionX + 50,
      parentNode.positionY + 25,
      childNode.positionX,
      childNode.positionY + 25,
    ]
    
    return (
      <Line
        key={`${parentNode.id}-${childNode.id}`}
        points={points}
        stroke="#666"
        strokeWidth={2}
        tension={0.5}
      />
    )
  }

  const renderNode = (node: NodeType) => {
    const isSelected = selectedNodes.has(node.id)

    return (
      <Node
        key={node.id}
        node={node}
        isSelected={isSelected}
        onClick={handleNodeClick}
        onDragStart={handleNodeDragStart}
        onDragEnd={handleNodeDragEnd}
        onDoubleClick={handleNodeDoubleClick}
        onContextMenu={handleNodeRightClick}
      />
    )
  }

  if (loading) {
    return <div className="loading">Loading mind map...</div>
  }

  if (error) {
    return (
      <div className="error">
        <p>Error loading mind map</p>
        <p>{error}</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <p>Double-click to create your first node</p>
      </div>
    )
  }

  return (
    <div className="mind-map-canvas">
      <div className="canvas-controls">
        <button onClick={handleZoomIn} aria-label="Zoom in">+</button>
        <button onClick={handleZoomOut} aria-label="Zoom out">-</button>
        <button onClick={handleResetView} aria-label="Reset view">Reset</button>
        <button onClick={() => setShowShareDialog(true)} aria-label="Share mind map">Share</button>
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onDoubleClick={handleStageDoubleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        scaleX={canvasState?.zoom || 1}
        scaleY={canvasState?.zoom || 1}
        x={canvasState?.panX || 0}
        y={canvasState?.panY || 0}
      >
        <Layer>
          {/* Render connections first */}
          {nodes.map(node => {
            if (node.parentId) {
              const parent = nodes.find(n => n.id === node.parentId)
              if (parent) {
                return renderConnection(parent, node)
              }
            }
            return null
          })}
          
          {/* Then render nodes */}
          {nodes.map(renderNode)}
        </Layer>
      </Stage>

      {/* Edit input overlay */}
      {editingNode && (
        <div
          className="node-edit-input"
          style={{
            position: 'absolute',
            left: nodes.find((n: NodeType) => n.id === editingNode.id)?.positionX || 0,
            top: nodes.find((n: NodeType) => n.id === editingNode.id)?.positionY || 0,
          }}
        >
          <input
            type="text"
            value={editingNode.text}
            onChange={(e) => setEditingNode({ ...editingNode, text: e.target.value })}
            onBlur={() => {
              actions.updateNode(editingNode.id, { text: editingNode.text })
              setEditingNode(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                actions.updateNode(editingNode.id, { text: editingNode.text })
                setEditingNode(null)
              }
            }}
            autoFocus
          />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button onClick={() => setContextMenu(null)}>Change Color</button>
          <button onClick={() => {
            actions.deleteNode(contextMenu.nodeId)
            setContextMenu(null)
          }}>Delete</button>
        </div>
      )}

      {/* Share dialog */}
      {showShareDialog && currentMindMap && (
        <ShareDialog
          mindMap={currentMindMap}
          nodes={nodes}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  )
}