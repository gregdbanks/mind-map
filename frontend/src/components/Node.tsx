import { Group, Rect, Text } from 'react-konva'
import type { Node as NodeType } from '../types'

interface NodeProps {
  node: NodeType
  isSelected: boolean
  onClick: (nodeId: string, e: any) => void
  onDragStart: (nodeId: string) => void
  onDragEnd: (nodeId: string, e: any) => void
  onDoubleClick: (node: NodeType) => void
  onContextMenu: (nodeId: string, e: any) => void
}

export function Node({
  node,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  onContextMenu,
}: NodeProps) {
  // Calculate text metrics for dynamic node sizing
  const padding = 20
  const minWidth = 120
  const minHeight = 50
  const fontSize = 14
  const lineHeight = 1.2
  
  // Estimate text dimensions (rough approximation)
  const textLines = node.text.split('\n')
  const maxLineLength = Math.max(...textLines.map(line => line.length))
  const estimatedWidth = Math.max(maxLineLength * fontSize * 0.6 + padding * 2, minWidth)
  const estimatedHeight = Math.max(textLines.length * fontSize * lineHeight + padding * 2, minHeight)
  
  const width = Math.min(estimatedWidth, 200) // Max width
  const height = estimatedHeight

  return (
    <Group
      x={node.positionX}
      y={node.positionY}
      draggable
      onClick={(e) => onClick(node.id, e)}
      onDragStart={() => onDragStart(node.id)}
      onDragEnd={(e) => onDragEnd(node.id, e)}
      onDoubleClick={() => onDoubleClick(node)}
      onContextMenu={(e) => onContextMenu(node.id, e)}
      name="node-group"
    >
      {/* Selection outline */}
      {isSelected && (
        <Rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          stroke="#0066cc"
          strokeWidth={3}
          cornerRadius={10}
          dash={[5, 5]}
          listening={false}
        />
      )}
      
      {/* Shadow */}
      <Rect
        x={2}
        y={2}
        width={width}
        height={height}
        fill="rgba(0, 0, 0, 0.1)"
        cornerRadius={8}
        listening={false}
      />
      
      {/* Main node background */}
      <Rect
        width={width}
        height={height}
        fill={node.backgroundColor || '#ffffff'}
        stroke={isSelected ? '#0066cc' : '#ddd'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={8}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={3}
        shadowOffset={{ x: 0, y: 2 }}
      />
      
      {/* Node text */}
      <Text
        x={padding / 2}
        y={padding / 2}
        text={node.text}
        fontSize={fontSize}
        fontFamily="Arial, sans-serif"
        fill={node.textColor || '#333333'}
        width={width - padding}
        height={height - padding}
        align="center"
        verticalAlign="middle"
        wrap="word"
        ellipsis={true}
      />
      
      {/* Hover effect */}
      <Rect
        width={width}
        height={height}
        fill="transparent"
        cornerRadius={8}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container()
          if (container) {
            container.style.cursor = 'move'
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container()
          if (container) {
            container.style.cursor = 'default'
          }
        }}
      />
    </Group>
  )
}