import React, { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../common/LoadingSpinner'

// Lazy load the D3 renderer
const D3MindMapAdapter = lazy(() => import('./D3MindMapAdapter').then(m => ({ default: m.D3MindMapAdapter })))
const D3SVGMindMapAdapter = lazy(() => import('./D3SVGMindMapAdapter').then(m => ({ default: m.D3SVGMindMapAdapter })))

interface MindMapRendererProps {
  mindMapId: string
  className?: string
  onNodeSelect?: (nodeId: string) => void
  onNodeEdit?: (nodeId: string) => void
  onCanvasDoubleClick?: (position: { x: number; y: number }) => void
}

/**
 * Smart component that chooses the appropriate renderer
 * Now using D3.js for better interaction handling
 */
export const MindMapRenderer: React.FC<MindMapRendererProps> = (props) => {
  // Use D3.js canvas renderer - stable and working
  console.log('🎨 Using D3.js canvas renderer')
  
  return (
    <Suspense fallback={<LoadingSpinner message="Loading mind map..." />}>
      <div 
        className="absolute inset-0" 
        data-renderer="d3" 
        style={{ 
          position: 'fixed',
          top: '80px', // Account for header
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: 'calc(100vh - 80px)',
          minHeight: '500px' // Ensure minimum height
        }}>
        <D3MindMapAdapter {...props} />
      </div>
    </Suspense>
  )
}

export default MindMapRenderer