import React from 'react';
import { useMindMap } from '../../context/MindMapContext';
import styles from './DirtyIndicator.module.css';

/**
 * Component that displays a warning when there are unsaved changes to the mind map
 */
export const DirtyIndicator: React.FC = () => {
  const { state } = useMindMap();

  if (!state.isDirty) {
    return null;
  }

  return (
    <div className={styles.dirtyIndicator}>
      <div className={styles.icon}>
        ⚠
      </div>
      <div className={styles.tooltip}>
        <span className={styles.highlight}>Unsaved changes detected.</span> 
        {' '}Changes are auto-saved to your browser's storage, but will be lost if you clear your browser data. 
        <span className={styles.highlight}> Export your mind map</span> to save permanently.
      </div>
    </div>
  );
};

export default DirtyIndicator;