import { useState } from 'react'
import type { MindMap, Node } from '../types'
import { ExportService } from '../services/exportService'
import './ShareDialog.css'

interface ShareDialogProps {
  mindMap: MindMap
  nodes: Node[]
  onClose: () => void
}

export function ShareDialog({ mindMap, nodes, onClose }: ShareDialogProps) {
  const [activeMethod, setActiveMethod] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const handleInteractiveHTML = async () => {
    const blob = await ExportService.exportAsInteractiveHTML(mindMap, nodes)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMap.title}-interactive.html`
    a.click()
    URL.revokeObjectURL(url)
    
    // Show success
    setActiveMethod('html')
    setTimeout(() => setActiveMethod(null), 2000)
  }

  const handleShareURL = async () => {
    const url = ExportService.createShareableURL(mindMap, nodes)
    setShareUrl(url)
    
    // Also generate QR code
    const qr = await ExportService.generateQRCode(url)
    setQrCode(qr)
    
    setActiveMethod('url')
  }

  const handleCopyURL = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJSONExport = () => {
    const blob = ExportService.exportAsJSON(mindMap, nodes)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMap.title}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    setActiveMethod('json')
    setTimeout(() => setActiveMethod(null), 2000)
  }

  const handleEmailShare = async () => {
    // First download the HTML file
    const blob = await ExportService.exportAsInteractiveHTML(mindMap, nodes)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMap.title}-mindmap.html`
    a.click()
    URL.revokeObjectURL(url)
    
    // Then open email client
    const subject = encodeURIComponent(`Mind Map: ${mindMap.title}`)
    const body = encodeURIComponent(
      `I'd like to share this mind map with you:\n\n` +
      `Title: ${mindMap.title}\n` +
      `${mindMap.description ? `Description: ${mindMap.description}\n` : ''}` +
      `\nI've downloaded the HTML file - please attach it to this email.\n\n` +
      `Instructions for viewing:\n` +
      `1. Save the attached HTML file\n` +
      `2. Drag it into any web browser (or right-click → Open with → Browser)\n` +
      `3. Use mouse to pan/zoom and interact\n\n` +
      `It's a self-contained file that works offline!`
    )
    
    setTimeout(() => {
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }, 100)
    
    setActiveMethod('email')
    setTimeout(() => setActiveMethod(null), 2000)
  }

  const shareMethods = [
    {
      id: 'html',
      title: '🌐 Interactive HTML',
      description: 'Download a self-contained HTML file that works offline',
      action: handleInteractiveHTML,
      badge: 'WORKS OFFLINE'
    },
    // URL sharing will be enabled after deployment
    // {
    //   id: 'url',
    //   title: '🔗 Share Link',
    //   description: 'Create a link that opens the mind map directly',
    //   action: handleShareURL,
    //   badge: 'QUICKEST'
    // },
    {
      id: 'json',
      title: '💾 JSON File',
      description: 'Export data file for backup (import coming soon)',
      action: handleJSONExport,
      badge: 'BACKUP'
    },
    {
      id: 'email',
      title: '📧 Email',
      description: 'Share HTML file via email with instructions',
      action: handleEmailShare,
      badge: 'EASY SHARING'
    }
  ]

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>Share Mind Map</h2>
        <p className="subtitle">Choose how you want to share "{mindMap.title}"</p>

        <div className="share-methods">
          {shareMethods.map((method) => (
            <div 
              key={method.id}
              className={`share-method ${activeMethod === method.id ? 'active' : ''}`}
              onClick={method.action}
            >
              <div className="method-header">
                <h3>{method.title}</h3>
                <span className="badge">{method.badge}</span>
              </div>
              <p>{method.description}</p>
              {activeMethod === method.id && (
                <div className="success-message">✓ Success!</div>
              )}
            </div>
          ))}
        </div>

        {activeMethod === 'url' && shareUrl && (
          <div className="url-share-details">
            <div className="url-container">
              <input 
                type="text" 
                value={shareUrl} 
                readOnly 
                onFocus={(e) => e.target.select()}
              />
              <button onClick={handleCopyURL}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            
            {qrCode && (
              <div className="qr-code-container">
                <p>Or scan this QR code:</p>
                <img src={qrCode} alt="QR Code" />
              </div>
            )}
          </div>
        )}

        <div className="share-notes">
          <h4>💡 Tips:</h4>
          <ul>
            <li><strong>Interactive HTML</strong>: Recipients can view, zoom, and navigate without installing anything</li>
            <li><strong>Share Link</strong>: Works instantly but requires internet to load the app</li>
            <li><strong>JSON File</strong>: Can be imported back for full editing capabilities</li>
            <li><strong>Email</strong>: Guides recipients on how to view the mind map</li>
          </ul>
        </div>
      </div>
    </div>
  )
}