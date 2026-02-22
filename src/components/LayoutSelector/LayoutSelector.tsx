import React, { useState, useRef, useEffect } from 'react';
import { Network, Check } from 'lucide-react';
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
        <Network size={16} />
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
                <Check className={styles.checkIcon} size={16} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};