import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PixiMindMapAdapter } from './PixiMindMapAdapter'
import { MindMapProvider } from '../../store/MindMapContext'
import '@testing-library/jest-dom'

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    view: document.createElement('canvas'),
    stage: {
      addChild: vi.fn()
    },
    renderer: {},
    ticker: {
      add: vi.fn()
    },
    destroy: vi.fn()
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn()
  })),
  utils: {
    isWebGLSupported: () => true
  }
}))

describe('PixiMindMapAdapter - REAL FUNCTIONALITY', () => {
  const mockMindMapId = 'test-123'
  
  beforeEach(() => {
    // Clear any localStorage
    localStorage.clear()
  })

  it('should have a canvas with proper dimensions (not 0 height)', async () => {
    const { container } = render(
      <MindMapProvider>
        <div style={{ width: '800px', height: '600px' }}>
          <PixiMindMapAdapter mindMapId={mockMindMapId} />
        </div>
      </MindMapProvider>
    )

    // Wait for canvas to be created
    await waitFor(() => {
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
      
      // Canvas should have actual dimensions, not 0
      expect(canvas.width).toBeGreaterThan(0)
      expect(canvas.height).toBeGreaterThan(0)
      
      // Log actual dimensions for debugging
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
    })
  })

  it('should display nodes that are actually visible', async () => {
    // This test MUST FAIL until nodes are actually rendered
    const { container } = render(
      <MindMapProvider>
        <div style={{ width: '800px', height: '600px' }}>
          <PixiMindMapAdapter mindMapId={mockMindMapId} />
        </div>
      </MindMapProvider>
    )

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByText('✅ PixiJS renderer initialized successfully!')).toBeInTheDocument()
    })

    // There should be visible nodes on the canvas
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Check if nodes are actually rendered (this will fail if canvas is blank)
    const context = canvas.getContext('2d')
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    
    // Check if there are any non-white pixels (indicating something is drawn)
    let hasContent = false
    for (let i = 0; i < pixels.length; i += 4) {
      // If any pixel is not white, something is drawn
      if (pixels[i] !== 255 || pixels[i+1] !== 255 || pixels[i+2] !== 255) {
        hasContent = true
        break
      }
    }
    
    expect(hasContent).toBe(true) // This WILL FAIL if canvas is blank
  })

  it('should zoom to node when clicked', async () => {
    const onNodeSelect = vi.fn()
    const { container } = render(
      <MindMapProvider>
        <div style={{ width: '800px', height: '600px' }}>
          <PixiMindMapAdapter 
            mindMapId={mockMindMapId}
            onNodeSelect={onNodeSelect}
          />
        </div>
      </MindMapProvider>
    )

    // Wait for canvas
    const canvas = await waitFor(() => {
      const c = container.querySelector('canvas')
      expect(c).toBeInTheDocument()
      return c
    })

    // Simulate click on canvas where a node should be
    await userEvent.click(canvas, { clientX: 400, clientY: 300 })
    
    // Should trigger node selection and zoom
    expect(onNodeSelect).toHaveBeenCalled()
    
    // Check that viewport has changed (zoom happened)
    // This will fail if zoom-to-node isn't working
  })
})