import React, { useState, useEffect, useRef } from 'react';
import styles from './NodeEditModal.module.css';

// Each swatch has an explicit, pre-tested text color — no auto-calculation needed.
// Light palette: soft pastels so text is always dark (readable if it overflows onto light canvas).
// Dark palette: saturated colors so text is always light (readable if it overflows onto dark canvas).
const LIGHT_PALETTE = [
  // Row 1: Blues & Purples — dark text on soft pastels
  { bg: '#BBDEFB', text: '#333333', label: 'Blue' },
  { bg: '#90CAF9', text: '#333333', label: 'Sky Blue' },
  { bg: '#E1BEE7', text: '#333333', label: 'Lavender' },
  { bg: '#CE93D8', text: '#333333', label: 'Purple' },
  // Row 2: Greens & Teals — dark text
  { bg: '#C8E6C9', text: '#333333', label: 'Green' },
  { bg: '#80CBC4', text: '#333333', label: 'Teal' },
  { bg: '#A5D6A7', text: '#333333', label: 'Mint' },
  { bg: '#DCEDC8', text: '#333333', label: 'Lime' },
  // Row 3: Warm colors — dark text
  { bg: '#FFF9C4', text: '#333333', label: 'Yellow' },
  { bg: '#FFE0B2', text: '#333333', label: 'Orange' },
  { bg: '#FFCDD2', text: '#333333', label: 'Red' },
  { bg: '#F8BBD0', text: '#333333', label: 'Pink' },
  // Row 4: Neutrals — dark text
  { bg: '#CFD8DC', text: '#333333', label: 'Blue Grey' },
  { bg: '#B0BEC5', text: '#333333', label: 'Silver' },
  { bg: '#D7CCC8', text: '#333333', label: 'Warm Grey' },
  { bg: '#E0E0E0', text: '#333333', label: 'Grey' },
];

const DARK_PALETTE = [
  // Row 1: Blues & Purples — white text on saturated colors
  { bg: '#1E88E5', text: '#FFFFFF', label: 'Blue' },
  { bg: '#1565C0', text: '#FFFFFF', label: 'Dark Blue' },
  { bg: '#7B1FA2', text: '#FFFFFF', label: 'Purple' },
  { bg: '#6A1B9A', text: '#FFFFFF', label: 'Deep Purple' },
  // Row 2: Greens & Teals — white text
  { bg: '#2E7D32', text: '#FFFFFF', label: 'Green' },
  { bg: '#00897B', text: '#FFFFFF', label: 'Teal' },
  { bg: '#388E3C', text: '#FFFFFF', label: 'Forest' },
  { bg: '#558B2F', text: '#FFFFFF', label: 'Olive' },
  // Row 3: Warm colors — white text
  { bg: '#F9A825', text: '#FFFFFF', label: 'Yellow' },
  { bg: '#EF6C00', text: '#FFFFFF', label: 'Orange' },
  { bg: '#C62828', text: '#FFFFFF', label: 'Red' },
  { bg: '#AD1457', text: '#FFFFFF', label: 'Pink' },
  // Row 4: Neutrals — white text
  { bg: '#37474F', text: '#FFFFFF', label: 'Blue Grey' },
  { bg: '#455A64', text: '#FFFFFF', label: 'Slate' },
  { bg: '#4E342E', text: '#FFFFFF', label: 'Brown' },
  { bg: '#546E7A', text: '#FFFFFF', label: 'Steel' },
];

const LIGHT_DEFAULT = '#BBDEFB';
const DARK_DEFAULT = '#1E88E5';

interface NodeEditModalProps {
  nodeId: string;
  initialText: string;
  initialColor?: string;
  initialTextColor?: string;
  isDarkCanvas?: boolean;
  isOpen: boolean;
  onSave: (nodeId: string, text: string, color?: string, textColor?: string) => void;
  onCancel: () => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  nodeId,
  initialText,
  initialColor,
  isDarkCanvas = false,
  isOpen,
  onSave,
  onCancel
}) => {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState(initialColor || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const palette = isDarkCanvas ? DARK_PALETTE : LIGHT_PALETTE;
  const defaultColor = isDarkCanvas ? DARK_DEFAULT : LIGHT_DEFAULT;

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

  const effectiveBgColor = color || defaultColor;
  const matchedSwatch = palette.find((s) => s.bg.toLowerCase() === effectiveBgColor.toLowerCase());
  const textColor = matchedSwatch?.text || (isDarkCanvas ? '#FFFFFF' : '#333333');

  const handleColorSelect = (newColor: string) => {
    setColor(newColor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (trimmedText) {
      const saveBg = color || undefined;
      const swatch = palette.find((s) => s.bg.toLowerCase() === (color || defaultColor).toLowerCase());
      const finalTextColor = swatch?.text || textColor;
      onSave(nodeId, trimmedText, saveBg, finalTextColor);
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
              {palette.map((swatch) => (
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
