import { useEffect } from 'react'

interface KeyboardShortcutOptions {
  onDelete?: () => void
  onSelectAll?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetView?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onCut?: () => void
}

export function useMindMapKeyboardShortcuts(options: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return
      }
      
      const { key, ctrlKey, metaKey, shiftKey } = event
      const isModKey = ctrlKey || metaKey
      
      // Delete key
      if (key === 'Delete' || key === 'Backspace') {
        event.preventDefault()
        options.onDelete?.()
        return
      }
      
      // Ctrl/Cmd + A - Select all
      if (isModKey && key === 'a') {
        event.preventDefault()
        options.onSelectAll?.()
        return
      }
      
      // Ctrl/Cmd + Plus/Equals - Zoom in
      if (isModKey && (key === '+' || key === '=')) {
        event.preventDefault()
        options.onZoomIn?.()
        return
      }
      
      // Ctrl/Cmd + Minus - Zoom out
      if (isModKey && key === '-') {
        event.preventDefault()
        options.onZoomOut?.()
        return
      }
      
      // Ctrl/Cmd + 0 - Reset view
      if (isModKey && key === '0') {
        event.preventDefault()
        options.onResetView?.()
        return
      }
      
      // Ctrl/Cmd + Z - Undo
      if (isModKey && key === 'z' && !shiftKey) {
        event.preventDefault()
        options.onUndo?.()
        return
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if ((isModKey && key === 'z' && shiftKey) || (isModKey && key === 'y')) {
        event.preventDefault()
        options.onRedo?.()
        return
      }
      
      // Ctrl/Cmd + C - Copy
      if (isModKey && key === 'c') {
        event.preventDefault()
        options.onCopy?.()
        return
      }
      
      // Ctrl/Cmd + V - Paste
      if (isModKey && key === 'v') {
        event.preventDefault()
        options.onPaste?.()
        return
      }
      
      // Ctrl/Cmd + X - Cut
      if (isModKey && key === 'x') {
        event.preventDefault()
        options.onCut?.()
        return
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [options])
}