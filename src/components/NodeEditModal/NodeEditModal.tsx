import React, { useState, useEffect, useRef } from 'react';
import { getAutoTextColor } from '../../utils/colorContrast';
import styles from './NodeEditModal.module.css';

// Curated palette — every color is pre-tested for good contrast with auto black/white text
const COLOR_PALETTE = [
  // Row 1: Blues & Purples
  { bg: '#4285F4', label: 'Blue' },
  { bg: '#1A73E8', label: 'Dark Blue' },
  { bg: '#7B1FA2', label: 'Purple' },
  { bg: '#9C27B0', label: 'Light Purple' },
  // Row 2: Greens & Teals
  { bg: '#0F9D58', label: 'Green' },
  { bg: '#00897B', label: 'Teal' },
  { bg: '#2E7D32', label: 'Dark Green' },
  { bg: '#43A047', label: 'Light Green' },
  // Row 3: Warm colors
  { bg: '#F4B400', label: 'Yellow' },
  { bg: '#FB8C00', label: 'Orange' },
  { bg: '#DB4437', label: 'Red' },
  { bg: '#E91E63', label: 'Pink' },
  // Row 4: Neutrals & Dark
  { bg: '#455A64', label: 'Blue Grey' },
  { bg: '#616161', label: 'Grey' },
  { bg: '#263238', label: 'Dark' },
  { bg: '#37474F', label: 'Charcoal' },
];

const DEFAULT_COLOR = '#4285F4';

interface NodeEditModalProps {
  nodeId: string;
  initialText: string;
  initialColor?: string;
  initialTextColor?: string;
  isOpen: boolean;
  onSave: (nodeId: string, text: string, color?: string, textColor?: string) => void;
  onCancel: () => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  nodeId,
  initialText,
  initialColor,
  isOpen,
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState(initialColor || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    setText(initialText);
    setColor(initialColor || '');
  }, [initialText, initialColor]);

  const effectiveBgColor = color || DEFAULT_COLOR;
  const textColor = getAutoTextColor(effectiveBgColor);

  const handleColorSelect = (newColor: string) => {
    setColor(newColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (trimmedText) {
      const finalTextColor = getAutoTextColor(color || DEFAULT_COLOR);
      onSave(nodeId, trimmedText, color || undefined, finalTextColor);
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
        <h3 className={styles.modalTitle}>Edit Node</h3>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Node Text</label>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.textInput}
              placeholder="Enter node text..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Node Color</label>
            <div className={styles.swatchGrid}>
              {COLOR_PALETTE.map((swatch) => (
                <button
                  key={swatch.bg}
                  type="button"
                  className={`${styles.swatch} ${effectiveBgColor.toLowerCase() === swatch.bg.toLowerCase() ? styles.swatchSelected : ''}`}
                  style={{ backgroundColor: swatch.bg }}
                  onClick={() => handleColorSelect(swatch.bg)}
                  title={swatch.label}
                />
              ))}
            </div>
            {color && (
              <button
                type="button"
                onClick={() => setColor('')}
                className={styles.resetColorButton}
              >
                Reset to default
              </button>
            )}
          </div>

          <div className={styles.previewContainer}>
            <label className={styles.inputLabel}>Preview</label>
            <div
              className={styles.previewSwatch}
              style={{
                backgroundColor: effectiveBgColor,
                color: textColor,
              }}
            >
              {text || 'Preview'}
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!text.trim()}
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
