import './ImportHelpDialog.css'

interface ImportHelpDialogProps {
  onClose: () => void
  onProceedToImport: () => void
}

export function ImportHelpDialog({ onClose, onProceedToImport }: ImportHelpDialogProps) {
  return (
    <div className="import-help-overlay" onClick={onClose}>
      <div className="import-help-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>Import Mind Map from JSON</h2>
        
        <div className="import-options">
          <div className="option-card">
            <h3>📁 Import Existing JSON</h3>
            <p>Have a mind map JSON file already? Import it directly.</p>
            <button onClick={onProceedToImport} className="primary-button">
              Select JSON File
            </button>
          </div>
          
          <div className="option-card">
            <h3>🤖 Generate from Content</h3>
            <p>Want to create a mind map from text, articles, or documents?</p>
            
            <div className="prompt-template">
              <h4>Quick Start:</h4>
              <ol>
                <li>Copy your content (article, notes, documentation)</li>
                <li>Visit ChatGPT, Claude, or any AI assistant</li>
                <li>Use this prompt:</li>
              </ol>
              
              <div className="prompt-box">
                <code>
                  Create a mind map in JSON format from this content. Use this exact structure:
                  {`{
  "version": "1.0",
  "exported": "[current timestamp]",
  "mindMap": {
    "title": "[title based on content]",
    "description": "[brief description]"
  },
  "nodes": [
    {
      "id": "root",
      "text": "[main topic]",
      "positionX": 500,
      "positionY": 300,
      "color": "#0066cc"
    },
    {
      "id": "[unique-id]",
      "text": "[concept]",
      "parentId": "[parent id]",
      "positionX": [number],
      "positionY": [number],
      "color": "#0066cc"
    }
  ]
}`}
                  
                  [PASTE YOUR CONTENT HERE]
                </code>
              </div>
              
              <p className="help-text">
                💡 <strong>Tip:</strong> For best results, check out our{' '}
                <a href="https://github.com/gregdbanks/mind-map/blob/main/MINDMAP_GENERATION_PROMPT.md" 
                   target="_blank" 
                   rel="noopener noreferrer">
                  complete prompt engineering guide
                </a>
              </p>
            </div>
            
            <div className="steps">
              <h4>Then:</h4>
              <ol start={4}>
                <li>Copy the generated JSON</li>
                <li>Save it as a <code>.json</code> file</li>
                <li>Import it here using the button above</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="import-notes">
          <h4>📌 Notes:</h4>
          <ul>
            <li>Imported mind maps create new copies (won't overwrite existing ones)</li>
            <li>All node relationships and positions are preserved</li>
            <li>Works with exports from any version of this app</li>
            <li>JSON files must have the correct structure shown above</li>
          </ul>
        </div>
      </div>
    </div>
  )
}