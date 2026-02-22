import React, { useState, useRef, useEffect } from 'react';
import { Grid3X3, Check } from 'lucide-react';
import styles from './BackgroundSelector.module.css';

export type CanvasBackground = 'white' | 'light-gray' | 'warm-gray' | 'dark' | 'dot-grid' | 'dot-grid-dark' | 'line-grid';

interface BackgroundOption {
  type: CanvasBackground;
  name: string;
  description: string;
  preview: string; // CSS background shorthand for the swatch
}

const backgroundOptions: BackgroundOption[] = [
  {
    type: 'white',
    name: 'White',
    description: 'Clean white canvas',
    preview: '#ffffff',
  },
  {
    type: 'light-gray',
    name: 'Light Gray',
    description: 'Subtle gray background',
    preview: '#f0f0f0',
  },
  {
    type: 'warm-gray',
    name: 'Warm Gray',
    description: 'Soft warm tone',
    preview: '#f0ede8',
  },
  {
    type: 'dark',
    name: 'Dark',
    description: 'Dark background',
    preview: '#2d2d2d',
  },
  {
    type: 'dot-grid',
    name: 'Dot Grid',
    description: 'Light dotted grid',
    preview: 'radial-gradient(circle, #ccc 1px, #f5f5f5 1px)',
  },
  {
    type: 'dot-grid-dark',
    name: 'Dot Grid (Dark)',
    description: 'Dark dotted grid',
    preview: 'radial-gradient(circle, #555 1px, #2d2d2d 1px)',
  },
  {
    type: 'line-grid',
    name: 'Line Grid',
    description: 'Figma-style line grid',
    preview: 'linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, #f5f5f5 1px)',
  },
];

export function getBackgroundStyle(bg: CanvasBackground): React.CSSProperties {
  switch (bg) {
    case 'white':
      return { backgroundColor: '#ffffff' };
    case 'light-gray':
      return { backgroundColor: '#f0f0f0' };
    case 'warm-gray':
      return { backgroundColor: '#f0ede8' };
    case 'dark':
      return { backgroundColor: '#2d2d2d' };
    case 'dot-grid':
      return {
        backgroundColor: '#f5f5f5',
        backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    case 'dot-grid-dark':
      return {
        backgroundColor: '#2d2d2d',
        backgroundImage: 'radial-gradient(circle, #555 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    case 'line-grid':
      return {
        backgroundColor: '#f5f5f5',
        backgroundImage:
          'linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      };
    default:
      return { backgroundColor: '#f9f9f9' };
  }
}

/** Returns the base solid color for a given background (used for node halos). */
export function getBackgroundColor(bg: CanvasBackground): string {
  switch (bg) {
    case 'white': return '#ffffff';
    case 'light-gray': return '#f0f0f0';
    case 'warm-gray': return '#f0ede8';
    case 'dark': return '#2d2d2d';
    case 'dot-grid': return '#f5f5f5';
    case 'dot-grid-dark': return '#2d2d2d';
    case 'line-grid': return '#f5f5f5';
    default: return '#f9f9f9';
  }
}

const STORAGE_KEY = 'mindmap-canvas-background';

export function loadCanvasBackground(): CanvasBackground {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && backgroundOptions.some(o => o.type === saved)) {
      return saved as CanvasBackground;
    }
  } catch { /* ignore */ }
  return 'dot-grid';
}

export function saveCanvasBackground(bg: CanvasBackground): void {
  try {
    localStorage.setItem(STORAGE_KEY, bg);
  } catch { /* ignore */ }
}

interface BackgroundSelectorProps {
  current: CanvasBackground;
  onChange: (bg: CanvasBackground) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ current, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as globalThis.Node) &&
        !buttonRef.current.contains(event.target as globalThis.Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (bg: CanvasBackground) => {
    onChange(bg);
    setIsOpen(false);
  };

  const currentOption = backgroundOptions.find(o => o.type === current);

  return (
    <div className={styles.selector}>
      <button
        ref={buttonRef}
        className={styles.iconButton}
        onClick={() => setIsOpen(!isOpen)}
        title={`Background: ${currentOption?.name || 'Select'}`}
        aria-label="Select canvas background"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Grid3X3 size={16} />
      </button>

      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {backgroundOptions.map((option) => (
            <button
              key={option.type}
              className={`${styles.dropdownItem} ${current === option.type ? styles.selected : ''}`}
              onClick={() => handleSelect(option.type)}
            >
              <div
                className={styles.swatch}
                style={{ background: option.preview, backgroundSize: '8px 8px' }}
              />
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{option.name}</div>
                <div className={styles.optionDescription}>{option.description}</div>
              </div>
              {current === option.type && (
                <Check className={styles.checkIcon} size={16} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
