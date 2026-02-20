import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useMigration } from './hooks/useMigration'
import { Dashboard } from './pages/Dashboard'
import { Editor } from './pages/Editor'
import './App.css'

function App() {
  const { migrating } = useMigration()

  if (migrating) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#fff' }}>
        Loading...
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map/:mapId" element={<Editor />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
