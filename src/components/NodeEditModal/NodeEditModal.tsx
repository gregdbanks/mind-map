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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r="1.5" fill={effectiveBgColor} stroke={effectiveBgColor}/>
                  <circle cx="17.5" cy="10.5" r="1.5" fill="#CE93D8" stroke="#CE93D8"/>
                  <circle cx="8.5" cy="7.5" r="1.5" fill="#80CBC4" stroke="#80CBC4"/>
                  <circle cx="6.5" cy="12" r="1.5" fill="#FFE0B2" stroke="#FFE0B2"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z" stroke="currentColor" fill="none"/>
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
