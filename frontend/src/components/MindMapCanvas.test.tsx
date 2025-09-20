import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MindMapCanvas } from './MindMapCanvas'
import { MindMapProvider } from '../store/MindMapContext'
import { NotificationProvider } from './NotificationProvider'
import type { Node, CanvasState } from '../types'

// Mock the robust cached API
vi.mock('../services/robustCachedApi', () => ({
  robustCachedNodeApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    batchUpdate: vi.fn(),
  },
  robustCachedCanvasApi: {
    get: vi.fn(),
    update: vi.fn(),
    reset: vi.fn(),
  },
  robustCachedMindMapApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  apiNotifications: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  wrapWithNotifications: vi.fn((fn) => fn),
}))

// Import the mocked APIs
import { robustCachedNodeApi, robustCachedCanvasApi, robustCachedMindMapApi } from '../services/robustCachedApi'

// Mock Konva
vi.mock('react-konva', () => ({
  Stage: ({ children, onDoubleClick, onWheel, ...props }: any) => (
    <div data-testid="konva-stage" onDoubleClick={onDoubleClick} onWheel={onWheel} {...props}>{children}</div>
  ),
  Layer: ({ children }: any) => <div data-testid="konva-layer">{children}</div>,
  Group: ({ children, onClick, onDragStart, onDragEnd, onDoubleClick, onContextMenu, ...props }: any) => (
    <div 
      data-testid="konva-group" 
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      {...props}
    >{children}</div>
  ),
  Rect: (props: any) => <div data-testid="konva-rect" {...props} />,
  Text: ({ text, ...props }: any) => (
    <div data-testid="konva-text" {...props}>{text}</div>
  ),
  Line: (props: any) => <div data-testid="konva-line" {...props} />,
}))

const mockNodes: Node[] = [
  {
    id: '1',
    mindMapId: '1',
    text: 'Root Node',
    positionX: 0,
    positionY: 0,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    mindMapId: '1',
    text: 'Child Node',
    positionX: 200,
    positionY: 0,
    parentId: '1',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockCanvasState: CanvasState = {
  id: '1',
  mindMapId: '1',
  zoom: 1,
  panX: 0,
  panY: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockMindMap = {
  id: '1',
  title: 'Test Mind Map',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('MindMapCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue(mockNodes)
    vi.mocked(robustCachedCanvasApi.get).mockResolvedValue(mockCanvasState)
    vi.mocked(robustCachedMindMapApi.getById).mockResolvedValue(mockMindMap)
  })

  const renderComponent = (mindMapId = '1') => {
    return render(
      <NotificationProvider>
        <MindMapProvider>
          <MindMapCanvas mindMapId={mindMapId} />
        </MindMapProvider>
      </NotificationProvider>
    )
  }

  it('should render canvas with nodes', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
      expect(screen.getByText('Root Node')).toBeInTheDocument()
      expect(screen.getByText('Child Node')).toBeInTheDocument()
    })
  })

  it('should render connection lines between nodes', async () => {
    renderComponent()

    await waitFor(() => {
      const lines = screen.getAllByTestId('konva-line')
      expect(lines.length).toBeGreaterThan(0)
    })
  })

  it('should handle node selection', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Root Node')).toBeInTheDocument()
    })

    const rootNode = screen.getByText('Root Node').parentElement
    fireEvent.click(rootNode!)

    // Should show selection indicator
    await waitFor(() => {
      const rects = screen.getAllByTestId('konva-rect')
      const selectionRect = rects.find(rect => 
        rect.getAttribute('stroke') === '#0066cc'
      )
      expect(selectionRect).toBeTruthy()
    })
  })

  it('should handle node dragging', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Root Node')).toBeInTheDocument()
    })

    const rootNodeGroup = screen.getAllByTestId('konva-group')[0]
    
    // Simulate drag start
    fireEvent.dragStart(rootNodeGroup)
    
    // Simulate drag end - need to pass target with x/y methods
    const mockEvent = {
      target: {
        x: () => 100,
        y: () => 100
      }
    }
    fireEvent.dragEnd(rootNodeGroup, mockEvent)

    await waitFor(() => {
      expect(robustCachedNodeApi.batchUpdate).toHaveBeenCalledWith('1', [{
        id: '1',
        positionX: 100,
        positionY: 100,
      }])
    })
  })

  it('should handle double-click to create node', async () => {
    const newNode: Node = {
      id: '3',
      mindMapId: '1',
      text: 'New Node',
      positionX: 100,
      positionY: 100,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    vi.mocked(robustCachedNodeApi.create).mockResolvedValue(newNode)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })

    const stage = screen.getByTestId('konva-stage')
    fireEvent.dblClick(stage, { clientX: 100, clientY: 100 })

    await waitFor(() => {
      expect(robustCachedNodeApi.create).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          text: 'New Node',
          positionX: expect.any(Number),
          positionY: expect.any(Number),
        })
      )
    })
  })

  it('should handle node deletion', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Root Node')).toBeInTheDocument()
    })

    // Select node
    const rootNode = screen.getByText('Root Node').parentElement
    fireEvent.click(rootNode!)

    // Press delete key
    fireEvent.keyDown(document, { key: 'Delete' })

    await waitFor(() => {
      expect(robustCachedNodeApi.delete).toHaveBeenCalledWith('1')
    })
  })

  it('should handle zoom controls', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText(/zoom in/i)).toBeInTheDocument()
    })

    const zoomInButton = screen.getByLabelText(/zoom in/i)
    fireEvent.click(zoomInButton)

    await waitFor(() => {
      expect(robustCachedCanvasApi.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ zoom: expect.any(Number) })
      )
    })
  })

  it('should handle canvas reset', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByLabelText(/reset view/i)).toBeInTheDocument()
    })

    const resetButton = screen.getByLabelText(/reset view/i)
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(robustCachedCanvasApi.reset).toHaveBeenCalledWith('1', false)
    })
  })

  it('should handle keyboard shortcuts', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })

    // Test Ctrl+A to select all
    fireEvent.keyDown(document, { key: 'a', ctrlKey: true })
    
    // All nodes should be selected
    await waitFor(() => {
      const rects = screen.getAllByTestId('konva-rect')
      // Selection rects have stroke="#0066cc" and strokeWidth="3" and dash="5,5"
      const selectionRects = rects.filter(rect => 
        rect.getAttribute('stroke') === '#0066cc' && 
        rect.getAttribute('stroke-width') === '3' &&
        rect.getAttribute('dash') === '5,5'
      )
      expect(selectionRects.length).toBe(2) // Both nodes selected
    })
  })

  it('should update canvas when scrolling (pan)', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })

    const stage = screen.getByTestId('konva-stage')
    
    // Simulate mouse wheel for panning
    fireEvent.wheel(stage, { deltaX: 50, deltaY: 50, ctrlKey: false })

    await waitFor(() => {
      expect(robustCachedCanvasApi.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          panX: expect.any(Number),
          panY: expect.any(Number),
        })
      )
    })
  })

  it('should update canvas when zooming with wheel', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })

    const stage = screen.getByTestId('konva-stage')
    
    // Simulate Ctrl+wheel for zooming
    fireEvent.wheel(stage, { deltaY: -100, ctrlKey: true })

    await waitFor(() => {
      expect(robustCachedCanvasApi.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ zoom: expect.any(Number) })
      )
    })
  })

  it('should handle node editing', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Root Node')).toBeInTheDocument()
    })

    // Double-click node to edit
    const rootNodeGroup = screen.getAllByTestId('konva-group')[0]
    fireEvent.doubleClick(rootNodeGroup)

    // Should show text input
    await waitFor(() => {
      const input = screen.getByDisplayValue('Root Node')
      expect(input).toBeInTheDocument()
    })

    // Change text
    const input = screen.getByDisplayValue('Root Node')
    fireEvent.change(input, { target: { value: 'Updated Node' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(robustCachedNodeApi.update).toHaveBeenCalledWith('1', { text: 'Updated Node' })
    })
  })

  it('should show context menu on right-click', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Root Node')).toBeInTheDocument()
    })

    const rootNode = screen.getByText('Root Node').parentElement
    fireEvent.contextMenu(rootNode!)

    await waitFor(() => {
      expect(screen.getByText(/change color/i)).toBeInTheDocument()
      expect(screen.getByText(/delete/i)).toBeInTheDocument()
    })
  })

  it('should handle empty state', async () => {
    vi.mocked(robustCachedNodeApi.getAll).mockResolvedValue([])
    
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/double-click to create your first node/i)).toBeInTheDocument()
    })
  })

  it('should handle loading state', () => {
    // Don't resolve the API calls to keep loading state
    vi.mocked(robustCachedNodeApi.getAll).mockImplementation(() => new Promise(() => {}))
    
    renderComponent()

    expect(screen.getByText(/loading mind map/i)).toBeInTheDocument()
  })

  it('should handle error state', async () => {
    vi.mocked(robustCachedNodeApi.getAll).mockRejectedValue(new Error('Failed to load nodes'))
    
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/error loading mind map/i)).toBeInTheDocument()
      expect(screen.getByText(/failed to load nodes/i)).toBeInTheDocument()
    })
  })
})