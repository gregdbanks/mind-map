import { useState, useEffect } from 'react'
import { useMindMap } from '../store/MindMapContext'
import type { MindMap } from '../types'
import './MindMapList.css'

interface MindMapListProps {
  onSelect?: (mindMap: MindMap) => void
}

export function MindMapList({ onSelect }: MindMapListProps) {
  const { state, actions } = useMindMap()
  const { mindMaps, loading, error } = state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    actions.fetchMindMaps()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await actions.createMindMap({
        title: newTitle,
        description: newDescription || undefined,
      })
      setShowCreateForm(false)
      setNewTitle('')
      setNewDescription('')
      await actions.fetchMindMaps()
    } catch (err) {
      console.error('Failed to create mind map:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await actions.deleteMindMap(id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Failed to delete mind map:', err)
    }
  }

  const handleSelectMindMap = (mindMap: MindMap) => {
    if (onSelect) {
      onSelect(mindMap)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, mindMap: MindMap) => {
    if (e.key === 'Enter') {
      handleSelectMindMap(mindMap)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  if (loading && mindMaps.length === 0) {
    return <div className="loading">Loading mind maps...</div>
  }

  if (error) {
    return (
      <div className="error">
        <p>Error loading mind maps</p>
        <p>{error}</p>
      </div>
    )
  }

  if (mindMaps.length === 0) {
    return (
      <div className="empty-state">
        <p>No mind maps found</p>
        <button onClick={() => setShowCreateForm(true)}>Create your first mind map</button>
      </div>
    )
  }

  return (
    <div className="mind-map-list">
      <div className="list-header">
        <h2>My Mind Maps</h2>
        <button onClick={() => setShowCreateForm(true)}>Create New</button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="create-form">
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={() => {
              setShowCreateForm(false)
              setNewTitle('')
              setNewDescription('')
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mind-maps">
        {mindMaps.map((mindMap) => (
          <div
            key={mindMap.id}
            className="mind-map-item"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectMindMap(mindMap)}
            onKeyDown={(e) => handleKeyDown(e, mindMap)}
          >
            <div className="mind-map-content">
              <h3>{mindMap.title}</h3>
              {mindMap.description && <p>{mindMap.description}</p>}
              <small>{formatDate(mindMap.createdAt)}</small>
            </div>
            <div className="mind-map-actions">
              {deleteConfirm === mindMap.id ? (
                <>
                  <button onClick={() => handleDelete(mindMap.id)}>Confirm</button>
                  <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
                </>
              ) : (
                <button
                  aria-label={`Delete ${mindMap.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(mindMap.id)
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MindMapList