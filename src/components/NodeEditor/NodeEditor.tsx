import React, { useState, useEffect, useRef } from 'react';
import styles from './NodeEditor.module.css';

interface NodeEditorProps {
  nodeId: string;
  initialText: string;
  x: number;
  y: number;
  onSave: (nodeId: string, text: string) => void;
  onCancel: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeId,
  initialText,
  x,
  y,
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  

  useEffect(() => {
    // Focus and select all text when editor opens
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (trimmedText) {
      onSave(nodeId, trimmedText);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  // Convert SVG coordinates to DOM coordinates
  const svgElement = document.querySelector('svg');
  const pt = svgElement?.createSVGPoint();
  if (pt && svgElement) {
    pt.x = x;
    pt.y = y;
    const screenPt = pt.matrixTransform(svgElement.getScreenCTM() || new DOMMatrix());
    
    
    return (
      <div 
        className={styles.editorContainer}
        style={{
          position: 'fixed',
          zIndex: 10000,
          left: `${screenPt.x}px`,
          top: `${screenPt.y}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            className={styles.input}
            placeholder="Enter node text..."
          />
        </form>
      </div>
    );
  }

  return null;
};