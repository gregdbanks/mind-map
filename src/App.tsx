import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useMigration } from './hooks/useMigration'
import { useAuth } from './context/AuthContext'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Editor } from './pages/Editor'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { SharedMap } from './pages/SharedMap/SharedMap'
import { Library } from './pages/Library/Library'
import { LibraryMapView } from './pages/Library/LibraryMapView'
import { CollabJoin } from './pages/CollabJoin/CollabJoin'
import { TeamSettings } from './pages/TeamSettings/TeamSettings'
import './App.css'

const loadingStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#fff' };

/** Show Dashboard for authenticated users, Landing page for visitors */
function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={loadingStyle}>
        Loading...
      </div>
    )
  }

  return isAuthenticated ? <Dashboard /> : <Landing />
}

function App() {
  const { migrating } = useMigration()

  if (migrating) {
    return (
      <div style={loadingStyle}>
        Loading...
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map/:mapId" element={<Editor />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/shared/:shareToken" element={<SharedMap />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/:id" element={<LibraryMapView />} />
        <Route path="/collab/join/:token" element={<CollabJoin />} />
        <Route path="/team" element={<TeamSettings />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
