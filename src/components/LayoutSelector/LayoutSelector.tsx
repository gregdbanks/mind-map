import React, { useState, useRef, useEffect } from 'react';
import styles from './LayoutSelector.module.css';

export type LayoutType = 'custom' | 'improved-cluster' | 'hierarchical' | 'hybrid-tree' | 'cluster' | 'force-directed';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  disabled?: boolean;
  hasCustomPositions?: boolean;
}

const layoutOptions = [
  {
    type: 'custom' as LayoutType,
    name: 'Custom',
    description: 'Original positions from imported data'
  },
  {
    type: 'improved-cluster' as LayoutType,
    name: 'Smart Radial',
    description: 'Intelligent radial clustering (default)'
  },
  {
    type: 'hierarchical' as LayoutType,
    name: 'Tree Layout',
    description: 'Top-down hierarchical tree'
  },
  {
    type: 'hybrid-tree' as LayoutType,
    name: 'Compact Tree',
    description: 'Space-efficient tree layout'
  },
  {
    type: 'cluster' as LayoutType,
    name: 'Basic Radial',
    description: 'Simple radial arrangement'
  },
  {
    type: 'force-directed' as LayoutType,
    name: 'Force Physics',
    description: 'Dynamic physics simulation'
  }
];

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  currentLayout,
  onLayoutChange,
  disabled = false,
  hasCustomPositions = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLayoutSelect = (layout: LayoutType) => {
    onLayoutChange(layout);
    setIsOpen(false);
  };

  const currentOption = layoutOptions.find(opt => opt.type === currentLayout);

  return (
    <div className={styles.layoutSelector}>
      <button
        ref={buttonRef}
        className={styles.iconButton}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title={`Layout: ${currentOption?.name || 'Select layout'}`}
        aria-label="Select layout"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          {/* Layout icon - hierarchical tree structure */}
          <circle cx="12" cy="4" r="2"/>
          <circle cx="6" cy="12" r="2"/>
          <circle cx="18" cy="12" r="2"/>
          <circle cx="4" cy="20" r="2"/>
          <circle cx="8" cy="20" r="2"/>
          <circle cx="16" cy="20" r="2"/>
          <circle cx="20" cy="20" r="2"/>
          <path d="M12 6v4M12 10h-6M12 10h6M6 14v4M18 14v4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      </button>

      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {layoutOptions
            .filter(option => option.type !== 'custom' || hasCustomPositions)
            .map((option) => (
            <button
              key={option.type}
              className={`${styles.dropdownItem} ${
                currentLayout === option.type ? styles.selected : ''
              }`}
              onClick={() => handleLayoutSelect(option.type)}
              disabled={disabled}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{option.name}</div>
                <div className={styles.optionDescription}>{option.description}</div>
              </div>
              {currentLayout === option.type && (
                <svg 
                  className={styles.checkIcon}
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};