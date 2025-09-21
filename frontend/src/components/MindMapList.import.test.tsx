import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MindMapList } from './MindMapList'
import * as api from '../services/api'
import type { MindMap } from '../types'

// Mock the API and context
vi.mock('../services/api')
vi.mock('../services/robustCachedApi')

const mockMindMaps: MindMap[] = [
  {
    id: '1',
    title: 'Test Mind Map',
    description: 'Test description',
    nodeCount: 5,
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
]

const mockUseMindMap = {
  state: {
    mindMaps: mockMindMaps,
    loading: false,
    error: null
  },
  actions: {
    fetchMindMaps: vi.fn(),
    createMindMap: vi.fn(),
    deleteMindMap: vi.fn(),
    setError: vi.fn(),
    importNodes: vi.fn(),
  }
}

vi.mock('../store/MindMapContext', () => ({
  useMindMap: () => mockUseMindMap,
  MindMapProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('MindMapList Import Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show import button', () => {
    render(<MindMapList />)
    expect(screen.getByText('Import JSON')).toBeInTheDocument()
  })

  it('should handle JSON file import', async () => {
    const mockMindMap: MindMap = {
      id: 'imported-123',
      title: 'Imported Mind Map',
      description: 'Test import',
      nodeCount: 3,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockUseMindMap.actions.createMindMap.mockResolvedValue(mockMindMap)

    const { container } = render(<MindMapList />)
    
    // Create a mock file
    const jsonData = {
      version: '1.0',
      exported: new Date().toISOString(),
      mindMap: {
        title: 'Test Mind Map',
        description: 'Test description'
      },
      nodes: [
        { id: 'node1', text: 'Root Node', positionX: 100, positionY: 100 },
        { id: 'node2', text: 'Child Node', parentId: 'node1', positionX: 200, positionY: 100 }
      ]
    }
    
    const file = new File([JSON.stringify(jsonData)], 'test-mindmap.json', { type: 'application/json' })
    const fileInput = container.querySelector('input[type="file"]')
    
    if (fileInput) {
      // Simulate file selection
      fireEvent.change(fileInput, {
        target: { files: [file] }
      })
      
      await waitFor(() => {
        expect(mockUseMindMap.actions.createMindMap).toHaveBeenCalledWith({
          title: 'Test Mind Map',
          description: 'Test description'
        })
      })
      
      await waitFor(() => {
        expect(mockUseMindMap.actions.importNodes).toHaveBeenCalledWith(
          'imported-123',
          jsonData.nodes
        )
      })
      
      expect(mockUseMindMap.actions.fetchMindMaps).toHaveBeenCalled()
    }
  })

  it('should handle invalid JSON file', async () => {
    const { container } = render(<MindMapList />)
    
    const file = new File(['invalid json'], 'test.json', { type: 'application/json' })
    const fileInput = container.querySelector('input[type="file"]')
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [file] }
      })
      
      await waitFor(() => {
        expect(mockUseMindMap.actions.setError).toHaveBeenCalled()
      })
    }
  })

  it('should handle JSON file with missing fields', async () => {
    const { container } = render(<MindMapList />)
    
    const invalidData = {
      version: '1.0',
      // Missing mindMap and nodes
    }
    
    const file = new File([JSON.stringify(invalidData)], 'test.json', { type: 'application/json' })
    const fileInput = container.querySelector('input[type="file"]')
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [file] }
      })
      
      await waitFor(() => {
        expect(mockUseMindMap.actions.setError).toHaveBeenCalledWith('Invalid mind map file format')
      })
    }
  })
})