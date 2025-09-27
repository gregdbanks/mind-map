import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { MindMapProvider } from './store/MindMapContext'
import { NotificationProvider } from './components/NotificationProvider'
import MindMapList from './components/MindMapList'
import { MindMapRenderer } from './components/mindMap/MindMapRenderer'
import { SharedMindMapViewer } from './components/SharedMindMapViewer'
import './App.css'
import './HelpModal.css'

function AppContent() {
  const navigate = useNavigate()

  const handleSelectMindMap = (mindMap: { id: string }) => {
    navigate(`/mindmap/${mindMap.id}`)
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <>
            <h1>Mind Map App</h1>
            <MindMapList onSelect={handleSelectMindMap} />
          </>
        } />
        <Route path="/mindmap/:id" element={
          <MindMapView />
        } />
        <Route path="/view/:data" element={
          <SharedMindMapViewer />
        } />
      </Routes>
    </div>
  )
}

function MindMapView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false)
  const [isMobile] = useState(window.matchMedia('(max-width: 768px)').matches || 
                             'ontouchstart' in window ||
                             navigator.maxTouchPoints > 0)

  return (
    <>
      <header className="canvas-header">
        <button 
          onClick={() => navigate('/')} 
          className="back-button"
        >
          ← Back to List
        </button>
        <h1>Mind Map Editor</h1>
        <button 
          onClick={() => setShowHelp(true)} 
          className="help-button"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}
          title="Help"
        >
          ?
        </button>
      </header>
      {showHelp && (
        <div className="help-modal-backdrop" onClick={() => setShowHelp(false)}>
          <div 
            className="help-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="help-modal-header">
              <h2 className="help-modal-title">Mind Map Help</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="help-modal-close"
                aria-label="Close help"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="help-modal-body">
              {isMobile ? (
                // Mobile instructions
                <div className="space-y-6">
                  <section className="help-section">
                    <h3 className="help-section-title">Touch Gestures</h3>
                    <div>
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
                </div>
              ) : (
                // Desktop instructions
                <div className="space-y-6">
                  <section className="help-section">
                    <h3 className="help-section-title">Mouse Actions</h3>
                    <div>
                      <div className="help-item">
                        <kbd className="help-kbd">Click</kbd>
                        <span className="help-text">Select node & zoom to it</span>
                      </div>
                      <div className="help-item">
                        <kbd className="help-kbd">Double Click</kbd>
                        <span className="help-text">Create child node</span>
                      </div>
                      <div className="help-item">
                        <kbd className="help-kbd">Right Click</kbd>
                        <span className="help-text">Open context menu</span>
                      </div>
                      <div className="help-item">
                        <kbd className="help-kbd">Drag</kbd>
                        <span className="help-text">Move node</span>
                      </div>
                      <div className="help-item">
                        <kbd className="help-kbd">Scroll</kbd>
                        <span className="help-text">Zoom in/out</span>
                      </div>
                    </div>
                  </section>

                  <section className="help-section">
                    <h3 className="help-section-title">Keyboard Shortcuts</h3>
                    <div>
                      <div className="help-item">
                        <div className="flex gap-1 mr-4">
                          <kbd className="help-kbd">Space</kbd>
                          <span className="help-text">+</span>
                          <kbd className="help-kbd">Drag</kbd>
                        </div>
                        <span className="help-text">Pan canvas</span>
                      </div>
                      <div className="help-item">
                        <kbd className="help-kbd">Delete</kbd>
                        <span className="help-text">Delete selected node</span>
                      </div>
                      <div className="help-item">
                        <kbd className="help-kbd">Backspace</kbd>
                        <span className="help-text">Delete selected node (alternative)</span>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              <section className="help-section">
                <h3 className="help-section-title">All Actions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Creating Nodes</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Double-click anywhere on canvas to create a new node</li>
                      <li>New nodes connect to the selected node (or nearest node)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Deleting Nodes</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Select a node and press Delete/Backspace</li>
                      <li>Right-click a node and choose "Delete Node"</li>
                      <li>Warning: Deleting a node also removes all its children</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Zooming & Navigation</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Scroll to zoom in/out</li>
                      <li>Hold Space and drag to pan around</li>
                      <li>Click a node to zoom and focus on it</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section className="help-tips">
                <h3 className="help-tips-title">Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Your changes are saved automatically</li>
                  <li>Use the browser back button to return to the list</li>
                  <li>Mind map data is stored locally in PostgreSQL</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
      {id && (
        <>
          <MindMapRenderer mindMapId={id} />
        </>
      )}
    </>
  )
}

function App() {
  return (
    <NotificationProvider>
      <MindMapProvider>
        <Router>
          <AppContent />
        </Router>
      </MindMapProvider>
    </NotificationProvider>
  )
}

export default App