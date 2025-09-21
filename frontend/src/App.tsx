import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { MindMapProvider } from './store/MindMapContext'
import { NotificationProvider } from './components/NotificationProvider'
import MindMapList from './components/MindMapList'
import { MindMapCanvas } from './components/MindMapCanvas'
import { SharedMindMapViewer } from './components/SharedMindMapViewer'
import './App.css'

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
      </header>
      {id && <MindMapCanvas mindMapId={id} />}
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