import React, { useState } from 'react'

interface HelpPanelProps {
  isMobile: boolean
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ isMobile }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Help button */}
      <button
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600 transition-colors z-50"
        onClick={() => setIsOpen(!isOpen)}
        title="Help"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Help panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mind Map Help</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-600 p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isMobile ? (
                // Mobile instructions
                <div className="space-y-6">
                  <section>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Touch Gestures</h3>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">👆</span>
                        <div>
                          <div className="font-semibold">Tap</div>
                          <div className="text-sm text-gray-600">Select a node</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">👆👆</span>
                        <div>
                          <div className="font-semibold">Double Tap</div>
                          <div className="text-sm text-gray-600">Add a child node</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">👆➡️</span>
                        <div>
                          <div className="font-semibold">Drag</div>
                          <div className="text-sm text-gray-600">Move a node</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">🤏</span>
                        <div>
                          <div className="font-semibold">Pinch</div>
                          <div className="text-sm text-gray-600">Zoom in/out</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">✌️➡️</span>
                        <div>
                          <div className="font-semibold">Two Finger Drag</div>
                          <div className="text-sm text-gray-600">Pan around the canvas</div>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">📱⬅️</span>
                        <div>
                          <div className="font-semibold">Long Press</div>
                          <div className="text-sm text-gray-600">Open context menu to delete</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Control Buttons</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="bg-blue-500 text-white rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="text-sm">Add new node</div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-red-500 text-white rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <div className="text-sm">Delete selected node</div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-yellow-500 text-white rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1zM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7z" />
                          </svg>
                        </div>
                        <div className="text-sm">Clean up disconnected nodes</div>
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                // Desktop instructions
                <div className="space-y-6">
                  <section>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Mouse Actions</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Click</kbd>
                        <span className="text-sm">Select node & zoom to it</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Double Click</kbd>
                        <span className="text-sm">Create child node</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Right Click</kbd>
                        <span className="text-sm">Open context menu</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Drag</kbd>
                        <span className="text-sm">Move node</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Scroll</kbd>
                        <span className="text-sm">Zoom in/out</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Keyboard Shortcuts</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="flex gap-1 mr-3">
                          <kbd className="px-2 py-1 bg-gray-200 rounded text-sm">Space</kbd>
                          <span className="text-sm">+</span>
                          <kbd className="px-2 py-1 bg-gray-200 rounded text-sm">Drag</kbd>
                        </div>
                        <span className="text-sm">Pan canvas</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Delete</kbd>
                        <span className="text-sm">Delete selected node</span>
                      </div>
                      <div className="flex items-center">
                        <kbd className="px-2 py-1 bg-gray-200 rounded text-sm mr-3">Backspace</kbd>
                        <span className="text-sm">Delete selected node (alternative)</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Control Buttons</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="bg-blue-500 text-white rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">Add Node</div>
                          <div className="text-xs text-gray-600">Creates a child of selected node</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-white border rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="text-sm">Zoom In</div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-white border rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </div>
                        <div className="text-sm">Zoom Out</div>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-white border rounded p-1 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                        <div className="text-sm">Fit to View</div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              <section className="mt-6 p-4 bg-gray-100 rounded">
                <h3 className="font-bold mb-2 text-gray-800">Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• New nodes are automatically connected to the selected node</li>
                  <li>• If no node is selected, new nodes connect to the nearest node</li>
                  <li>• Deleting a node also deletes all its children</li>
                  <li>• Use the cleanup button to remove any disconnected nodes</li>
                  <li>• Your changes are saved automatically</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}