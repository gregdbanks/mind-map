import React from 'react'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView
}) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      <button
        onClick={onZoomIn}
        className="px-4 py-2 bg-white text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-100 active:bg-gray-200 transition-all border-2 border-gray-300"
        aria-label="Zoom in"
      >
        Zoom In (+)
      </button>
      <button
        onClick={onZoomOut}
        className="px-4 py-2 bg-white text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-100 active:bg-gray-200 transition-all border-2 border-gray-300"
        aria-label="Zoom out"
      >
        Zoom Out (-)
      </button>
      <button
        onClick={onResetView}
        className="px-4 py-2 bg-white text-black font-bold text-lg rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-100 active:bg-gray-200 transition-all border-2 border-gray-300"
        aria-label="Reset view"
      >
        Reset View
      </button>
    </div>
  )
}