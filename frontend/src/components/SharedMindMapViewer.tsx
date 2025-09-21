import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LZString from 'lz-string'
import { Stage, Layer, Line } from 'react-konva'
import { Node } from './Node'
import type { MindMap, Node as NodeType } from '../types'
import './SharedMindMapViewer.css'

export function SharedMindMapViewer() {
  const { data } = useParams<{ data: string }>()
  const navigate = useNavigate()
  const [mindMap, setMindMap] = useState<MindMap | null>(null)
  const [nodes, setNodes] = useState<NodeType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!data) {
      setError('No data provided')
      return
    }

    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data)
      if (!decompressed) {
        throw new Error('Failed to decompress data')
      }

      const parsed = JSON.parse(decompressed)
      if (!parsed.m || !parsed.n) {
        throw new Error('Invalid data format')
      }

      setMindMap(parsed.m)
      setNodes(parsed.n)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mind map')
    }
  }, [data])

  const handleImport = () => {
    if (!mindMap || !nodes) return
    
    // Store in localStorage for import
    localStorage.setItem('importedMindMap', JSON.stringify({
      mindMap,
      nodes,
      timestamp: Date.now()
    }))
    
    // Navigate to main app
    navigate('/')
  }

  const renderConnection = (parentNode: NodeType, childNode: NodeType) => {
    return (
      <Line
        key={`${parentNode.id}-${childNode.id}`}
        points={[
          parentNode.positionX + 50,
          parentNode.positionY + 25,
          childNode.positionX,
          childNode.positionY + 25,
        ]}
        stroke="#666"
        strokeWidth={2}
        tension={0.5}
      />
    )
  }

  if (error) {
    return (
      <div className="shared-viewer-error">
        <h2>Unable to Load Mind Map</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Go to Home</button>
      </div>
    )
  }

  if (!mindMap || nodes.length === 0) {
    return (
      <div className="shared-viewer-loading">
        <p>Loading mind map...</p>
      </div>
    )
  }

  return (
    <div className="shared-mindmap-viewer">
      <div className="viewer-header">
        <div className="viewer-info">
          <h1>{mindMap.title}</h1>
          {mindMap.description && <p>{mindMap.description}</p>}
        </div>
        <div className="viewer-actions">
          <button onClick={handleImport} className="import-button">
            Import to My Maps
          </button>
          <button onClick={() => navigate('/')} className="home-button">
            Go to App
          </button>
        </div>
      </div>

      <div className="viewer-controls">
        <button onClick={() => setZoom(zoom * 1.2)}>Zoom In</button>
        <button onClick={() => setZoom(zoom / 1.2)}>Zoom Out</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>Reset</button>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight - 80}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable
        onDragEnd={(e) => {
          const target = e.target
          setPan({ x: target.x(), y: target.y() })
        }}
      >
        <Layer>
          {/* Render connections */}
          {nodes.map(node => {
            if (node.parentId) {
              const parent = nodes.find(n => n.id === node.parentId)
              if (parent) {
                return renderConnection(parent, node)
              }
            }
            return null
          })}
          
          {/* Render nodes */}
          {nodes.map(node => (
            <Node
              key={node.id}
              node={node}
              isSelected={false}
              onClick={() => {}}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onDoubleClick={() => {}}
              onContextMenu={() => {}}
            />
          ))}
        </Layer>
      </Stage>

      <div className="viewer-instructions">
        <p>🖱️ Drag to pan • 🔍 Use buttons to zoom • 📥 Import to edit</p>
      </div>
    </div>
  )
}