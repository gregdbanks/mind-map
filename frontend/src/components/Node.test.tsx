import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Node } from './Node'
import type { Node as NodeType } from '../types'

// Mock Konva
vi.mock('react-konva', () => ({
  Group: ({ children, onClick, onDragStart, onDragEnd, onDoubleClick, onContextMenu, ...props }: any) => (
    <div 
      data-testid="node-group" 
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      {...props}
    >{children}</div>
  ),
  Rect: (props: any) => <div data-testid="node-rect" {...props} />,
  Text: ({ text, ...props }: any) => (
    <div data-testid="node-text" {...props}>{text}</div>
  ),
}))

const mockNode: NodeType = {
  id: '1',
  mindMapId: '1',
  text: 'Test Node',
  positionX: 100,
  positionY: 200,
  backgroundColor: '#ffffff',
  textColor: '#000000',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('Node', () => {
  it('should render node with text', () => {
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    expect(screen.getByText('Test Node')).toBeInTheDocument()
  })

  it('should show selection indicator when selected', () => {
    render(
      <Node 
        node={mockNode}
        isSelected={true}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    const rects = screen.getAllByTestId('node-rect')
    const selectionRect = rects.find(rect => 
      rect.getAttribute('stroke') === '#0066cc'
    )
    expect(selectionRect).toBeTruthy()
  })

  it('should handle click events', () => {
    const onClick = vi.fn()
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={onClick}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    const nodeGroup = screen.getByTestId('node-group')
    fireEvent.click(nodeGroup)

    expect(onClick).toHaveBeenCalledWith(mockNode.id, expect.anything())
  })

  it('should handle drag events', () => {
    const onDragStart = vi.fn()
    const onDragEnd = vi.fn()
    
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    const nodeGroup = screen.getByTestId('node-group')
    
    fireEvent.dragStart(nodeGroup)
    expect(onDragStart).toHaveBeenCalledWith(mockNode.id)

    const mockEvent = {
      target: {
        x: () => 150,
        y: () => 250
      }
    }
    fireEvent.dragEnd(nodeGroup, mockEvent)
    expect(onDragEnd).toHaveBeenCalledWith(mockNode.id, expect.anything())
  })

  it('should handle double click', () => {
    const onDoubleClick = vi.fn()
    
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={onDoubleClick}
        onContextMenu={vi.fn()}
      />
    )

    const nodeGroup = screen.getByTestId('node-group')
    fireEvent.doubleClick(nodeGroup)

    expect(onDoubleClick).toHaveBeenCalledWith(mockNode)
  })

  it('should handle context menu', () => {
    const onContextMenu = vi.fn()
    
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={onContextMenu}
      />
    )

    const nodeGroup = screen.getByTestId('node-group')
    fireEvent.contextMenu(nodeGroup)

    expect(onContextMenu).toHaveBeenCalledWith(mockNode.id, expect.anything())
  })

  it('should apply node colors', () => {
    const coloredNode = {
      ...mockNode,
      backgroundColor: '#ff0000',
      textColor: '#ffffff',
    }

    render(
      <Node 
        node={coloredNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    // The main background rect is the 3rd one (after shadow and main background)
    const rects = screen.getAllByTestId('node-rect')
    const backgroundRect = rects.find(rect => rect.getAttribute('fill') === '#ff0000')
    expect(backgroundRect).toBeDefined()

    const text = screen.getByTestId('node-text')
    expect(text).toHaveAttribute('fill', '#ffffff')
  })

  it('should position node correctly', () => {
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    const nodeGroup = screen.getByTestId('node-group')
    expect(nodeGroup).toHaveAttribute('x', '100')
    expect(nodeGroup).toHaveAttribute('y', '200')
  })

  it('should be draggable', () => {
    render(
      <Node 
        node={mockNode}
        isSelected={false}
        onClick={vi.fn()}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onDoubleClick={vi.fn()}
        onContextMenu={vi.fn()}
      />
    )

    const nodeGroup = screen.getByTestId('node-group')
    expect(nodeGroup).toHaveAttribute('draggable', 'true')
  })
})