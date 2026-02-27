import React, { useState, useEffect, useRef } from 'react';
import { LIGHT_PALETTE, DARK_PALETTE, LIGHT_DEFAULT, DARK_DEFAULT } from '../../utils/colorPalettes';
import styles from './NodeEditModal.module.css';

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
  const [showPalette, setShowPalette] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

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
    setShowPalette(false);
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
      if (showPalette) {
        setShowPalette(false);
      } else {
        onCancel();
      }
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
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.textInput}
              placeholder="Enter node text..."
            />
            <div className={styles.colorPickerWrapper} ref={paletteRef}>
              <button
                type="button"
                className={styles.colorTrigger}
                onClick={() => setShowPalette(!showPalette)}
                title="Pick color"
              >
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: effectiveBgColor }}
                />
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showPalette && (
                <div className={styles.paletteDropdown}>
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
                      onClick={() => { setColor(''); setShowPalette(false); }}
                      className={styles.resetColorButton}
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!text.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
