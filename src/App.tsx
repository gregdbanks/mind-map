import { MindMapProvider } from './context/MindMapContext'
import { MindMapCanvas } from './components/MindMapCanvas/MindMapCanvas'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <MindMapProvider>
        <div className="App" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <MindMapCanvas />
        </div>
      </MindMapProvider>
    </ErrorBoundary>
  )
}

export default App
