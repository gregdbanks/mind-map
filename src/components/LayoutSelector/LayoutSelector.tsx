import React from 'react';
import styles from './LayoutSelector.module.css';

export type LayoutType = 'improved-cluster' | 'hierarchical' | 'hybrid-tree' | 'cluster' | 'force-directed';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  disabled?: boolean;
}

const layoutOptions = [
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
  disabled = false
}) => {
  return (
    <div className={styles.layoutSelector}>
      <label className={styles.label}>Layout:</label>
      <select
        value={currentLayout}
        onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
        disabled={disabled}
        className={styles.select}
        title="Choose how nodes are arranged"
      >
        {layoutOptions.map(option => (
          <option key={option.type} value={option.type}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};