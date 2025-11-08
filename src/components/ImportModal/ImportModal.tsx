import React, { useState, useRef } from 'react';
import styles from './ImportModal.module.css';

interface ImportModalProps {
  isOpen: boolean;
  onImport: (jsonData: string) => void | Promise<void>;
  onCancel: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onImport,
  onCancel
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    nodeCount: number;
  } | null>(null);
  const [showExample, setShowExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const validateJSON = (text: string) => {
    setError('');
    setValidationResult(null);
    
    if (!text.trim()) return;

    try {
      const data = JSON.parse(text);
      
      // Validate required structure
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Missing "nodes" array');
      }
      
      if (!data.links || !Array.isArray(data.links)) {
        throw new Error('Missing "links" array');
      }
      
      // Validate node structure
      data.nodes.forEach((node: { id?: string; text?: string }, index: number) => {
        if (!node.id || !node.text) {
          throw new Error(`Node ${index}: Missing required "id" or "text" field`);
        }
      });
      
      setValidationResult({
        isValid: true,
        nodeCount: data.nodes.length
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    validateJSON(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      validateJSON(content);
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const handleImport = () => {
    if (validationResult?.isValid && jsonText.trim()) {
      onImport(jsonText);
      setJsonText('');
      setError('');
      setValidationResult(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className={styles.modalBackdrop}
      onClick={handleBackdropClick}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Import Mind Map</h2>
          <button 
            onClick={onCancel}
            className={styles.closeButton}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.formatSection}>
          <h3>JSON Format</h3>
          
          <div className={styles.formatInfo}>
            <div className={styles.formatOption}>
              <span className={styles.formatLabel}>Mind Map JSON Structure</span>
              <button 
                className={styles.tooltipButton}
                title="Click to see example"
                onClick={() => setShowExample(!showExample)}
              >
                ?
              </button>
              {showExample && (
                <div className={styles.tooltipContent}>
                  <pre className={styles.codeBlock}>
{`{
  "nodes": [
    {
      "id": "root",
      "text": "My Project", 
      "x": 400, "y": 300,
      "parent": null,
      "collapsed": false,
      "color": "#4ECDC4"
    },
    {
      "id": "planning",
      "text": "Planning",
      "x": 200, "y": 200,
      "parent": "root",
      "collapsed": false
    },
    {
      "id": "requirements",
      "text": "Requirements",
      "x": 100, "y": 150,
      "parent": "planning",
      "collapsed": false,
      "color": "#FF6B6B"
    },
    {
      "id": "timeline",
      "text": "Timeline",
      "x": 100, "y": 250,
      "parent": "planning",
      "collapsed": false
    }
  ],
  "links": [
    {"source": "root", "target": "planning"},
    {"source": "planning", "target": "requirements"},
    {"source": "planning", "target": "timeline"}
  ]
}`}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className={styles.promptInfo}>
            <p><strong>💡 Pro tip:</strong> Use our <a href="/LLM_MIND_MAP_PROMPT.md" target="_blank" className={styles.promptLink}>LLM prompt template</a> to generate mind maps with ChatGPT, Claude, or any AI assistant!</p>
          </div>
        </div>

        <div className={styles.inputSection}>
          <h3>Import Options</h3>
          
          <div className={styles.inputOption}>
            <label htmlFor="json-textarea">Paste JSON:</label>
            <textarea
              id="json-textarea"
              className={styles.jsonTextarea}
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste your JSON data here..."
              rows={8}
            />
          </div>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <div className={styles.inputOption}>
            <label>Upload JSON File:</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.fileButton}
            >
              Choose JSON File
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {validationResult && (
          <div className={styles.validationSuccess}>
            <strong>✓ Valid JSON detected!</strong>
            <div>Nodes: {validationResult.nodeCount}</div>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!validationResult?.isValid}
            className={styles.importButton}
          >
            Import Mind Map
          </button>
        </div>
      </div>
    </div>
  );
};