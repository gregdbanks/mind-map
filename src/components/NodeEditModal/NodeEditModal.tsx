import React, { useState, useEffect, useRef } from 'react';
import styles from './NodeEditModal.module.css';

// Each swatch has an explicit, pre-tested text color — no auto-calculation needed
const LIGHT_PALETTE = [
  // Row 1: Blues & Purples — white text
  { bg: '#4285F4', text: '#FFFFFF', label: 'Blue' },
  { bg: '#1A73E8', text: '#FFFFFF', label: 'Dark Blue' },
  { bg: '#7B1FA2', text: '#FFFFFF', label: 'Purple' },
  { bg: '#9C27B0', text: '#FFFFFF', label: 'Light Purple' },
  // Row 2: Greens & Teals — white text
  { bg: '#0F9D58', text: '#FFFFFF', label: 'Green' },
  { bg: '#00897B', text: '#FFFFFF', label: 'Teal' },
  { bg: '#2E7D32', text: '#FFFFFF', label: 'Dark Green' },
  { bg: '#43A047', text: '#FFFFFF', label: 'Light Green' },
  // Row 3: Warm colors
  { bg: '#F4B400', text: '#000000', label: 'Yellow' },
  { bg: '#FB8C00', text: '#000000', label: 'Orange' },
  { bg: '#DB4437', text: '#FFFFFF', label: 'Red' },
  { bg: '#E91E63', text: '#FFFFFF', label: 'Pink' },
  // Row 4: Neutrals & Dark — white text
  { bg: '#455A64', text: '#FFFFFF', label: 'Blue Grey' },
  { bg: '#616161', text: '#FFFFFF', label: 'Grey' },
  { bg: '#263238', text: '#FFFFFF', label: 'Dark' },
  { bg: '#37474F', text: '#FFFFFF', label: 'Charcoal' },
];

const DARK_PALETTE = [
  // Row 1: Brighter blues & purples for dark canvas — black text on light, white on deep
  { bg: '#64B5F6', text: '#000000', label: 'Light Blue' },
  { bg: '#42A5F5', text: '#000000', label: 'Blue' },
  { bg: '#CE93D8', text: '#000000', label: 'Lavender' },
  { bg: '#BA68C8', text: '#FFFFFF', label: 'Purple' },
  // Row 2: Greens & Teals — lighter shades
  { bg: '#81C784', text: '#000000', label: 'Light Green' },
  { bg: '#4DB6AC', text: '#000000', label: 'Teal' },
  { bg: '#66BB6A', text: '#000000', label: 'Green' },
  { bg: '#AED581', text: '#000000', label: 'Lime' },
  // Row 3: Warm colors — brighter
  { bg: '#FFD54F', text: '#000000', label: 'Yellow' },
  { bg: '#FFB74D', text: '#000000', label: 'Orange' },
  { bg: '#EF5350', text: '#FFFFFF', label: 'Red' },
  { bg: '#EC407A', text: '#FFFFFF', label: 'Pink' },
  // Row 4: Light neutrals for contrast on dark canvas
  { bg: '#ECEFF1', text: '#000000', label: 'White' },
  { bg: '#B0BEC5', text: '#000000', label: 'Silver' },
  { bg: '#90A4AE', text: '#000000', label: 'Light Grey' },
  { bg: '#CFD8DC', text: '#000000', label: 'Pale Grey' },
];

const LIGHT_DEFAULT = '#4285F4';
const DARK_DEFAULT = '#64B5F6';

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
  const textColor = matchedSwatch?.text || (isDarkCanvas ? '#000000' : '#FFFFFF');

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
