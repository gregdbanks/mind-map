import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MindMapList from './MindMapList'
import { MindMapProvider } from '../store/MindMapContext'
import { NotificationProvider } from './NotificationProvider'
import type { MindMap } from '../types'

// Mock the robust cached API
vi.mock('../services/robustCachedApi', () => ({
  robustCachedMindMapApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
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
  apiNotifications: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  wrapWithNotifications: vi.fn((fn) => fn),
}))

// Import the mocked APIs
import { robustCachedMindMapApi } from '../services/robustCachedApi'

const mockMindMaps: MindMap[] = [
  {
    id: '1',
    title: 'Mind Map 1',
    description: 'Description 1',
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Mind Map 2',
    version: 1,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

const renderComponent = (onSelect?: (mindMap: MindMap) => void) => {
  return render(
    <NotificationProvider>
      <MindMapProvider>
        <MindMapList onSelect={onSelect} />
      </MindMapProvider>
    </NotificationProvider>
  )
}

describe('MindMapList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should fetch and display mind maps', async () => {
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Mind Map 1')).toBeInTheDocument()
      expect(screen.getByText('Mind Map 2')).toBeInTheDocument()
    })

    expect(screen.getByText('Description 1')).toBeInTheDocument()
  })

  it('should display empty state when no mind maps', async () => {
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue([])

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/no mind maps found/i)).toBeInTheDocument()
    })
  })

  it('should handle error state', async () => {
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockRejectedValue(new Error('Network error'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/error loading mind maps/i)).toBeInTheDocument()
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('should call onSelect when clicking a mind map', async () => {
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)
    
    const onSelect = vi.fn()
    renderComponent(onSelect)

    await waitFor(() => {
      expect(screen.getByText('Mind Map 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Mind Map 1'))
    expect(onSelect).toHaveBeenCalledWith(mockMindMaps[0])
  })

  it('should create a new mind map', async () => {
    const user = userEvent.setup()
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)
    
    const newMindMap: MindMap = {
      id: '3',
      title: 'New Mind Map',
      version: 1,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    }
    
    vi.mocked(robustCachedMindMapApi.create).mockResolvedValue(newMindMap)
    vi.mocked(robustCachedMindMapApi.getAll)
      .mockResolvedValueOnce(mockMindMaps)
      .mockResolvedValueOnce([...mockMindMaps, newMindMap])

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Mind Map 1')).toBeInTheDocument()
    })

    // Click create button
    const createButton = screen.getByText(/create new/i)
    await user.click(createButton)

    // Fill in the form
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'New Mind Map')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /^create$/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('New Mind Map')).toBeInTheDocument()
    })
  })

  it('should delete a mind map', async () => {
    const user = userEvent.setup()
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)
    vi.mocked(robustCachedMindMapApi.delete).mockResolvedValue()

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Mind Map 1')).toBeInTheDocument()
    })

    // Click delete button for the first mind map
    const deleteButtons = screen.getAllByLabelText(/delete/i)
    await user.click(deleteButtons[0])

    // Confirm deletion
    const confirmButton = screen.getByText(/confirm/i)
    await user.click(confirmButton)

    await waitFor(() => {
      expect(robustCachedMindMapApi.delete).toHaveBeenCalledWith('1')
    })
  })

  it('should format dates correctly', async () => {
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/january 1, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/january 2, 2024/i)).toBeInTheDocument()
    })
  })

  it('should show create form and cancel it', async () => {
    const user = userEvent.setup()
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Mind Map 1')).toBeInTheDocument()
    })

    // Click create button
    const createButton = screen.getByText(/create new/i)
    await user.click(createButton)

    // Form should be visible
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()

    // Click cancel
    const cancelButton = screen.getByText(/cancel/i)
    await user.click(cancelButton)

    // Form should be hidden
    await waitFor(() => {
      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument()
    })
  })

  it('should handle keyboard navigation', async () => {
    // Using the already mocked import
    vi.mocked(robustCachedMindMapApi.getAll).mockResolvedValue(mockMindMaps)
    
    const onSelect = vi.fn()
    renderComponent(onSelect)

    await waitFor(() => {
      expect(screen.getByText('Mind Map 1')).toBeInTheDocument()
    })

    // Focus first mind map
    const firstMindMap = screen.getByText('Mind Map 1').closest('[role="button"]')!
    if (firstMindMap instanceof HTMLElement) {
      firstMindMap.focus()
    }

    // Press Enter to select
    fireEvent.keyDown(firstMindMap, { key: 'Enter', code: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith(mockMindMaps[0])
  })
})