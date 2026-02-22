import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import styles from './HelpGuideModal.module.css';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const keyboardShortcuts = [
  { key: 'Space (hold)', desc: 'Pan mode - drag to pan the canvas' },
  { key: 'Ctrl + S', desc: 'Export mind map as JSON' },
  { key: 'Ctrl + Z', desc: 'Undo last action' },
  { key: 'Ctrl + Y', desc: 'Redo last action' },
  { key: 'Ctrl + F', desc: 'Focus search bar' },
  { key: 'F2', desc: 'Edit selected node' },
  { key: 'Delete', desc: 'Delete selected node and children' },
  { key: 'Enter', desc: 'Add child to selected node' },
  { key: 'Tab', desc: 'Add sibling to selected node' },
  { key: '?', desc: 'Toggle this help guide' },
  { key: ']', desc: 'Spread selected nodes apart (5px per press)' },
  { key: '[', desc: 'Compress selected nodes closer (5px per press)' },
];

const mouseActions = [
  { key: 'Click node', desc: 'Select and highlight node tree' },
  { key: 'Double-click node', desc: 'Edit node text and colors' },
  { key: 'Hover node', desc: 'Show action buttons (+, edit, delete, notes)' },
  { key: 'Scroll wheel', desc: 'Zoom in/out' },
  { key: 'Drag node', desc: 'Move node (switches to custom layout)' },
  { key: 'Click + drag on empty canvas', desc: 'Marquee select multiple nodes' },
  { key: 'Ctrl + click node', desc: 'Toggle node in multi-selection' },
  { key: 'Drag selected group', desc: 'Move all selected nodes together' },
  { key: 'Click empty canvas', desc: 'Deselect all' },
];

const nodeActionButtons = [
  { key: 'Green +', desc: 'Add child node' },
  { key: 'Blue pencil', desc: 'Edit node text/color' },
  { key: 'Red x', desc: 'Delete node and children' },
  { key: 'Purple note', desc: 'Open rich text notes editor' },
];

const tips = [
  'Hold Space and drag to pan around the canvas',
  'Use the layout selector in the toolbar to switch between different arrangements',
  'Dragging a node automatically switches to custom layout',
  'Use Ctrl+S to export your mind map as a JSON file for backup',
  'Search with Ctrl+F to quickly find and navigate to any node',
];

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} data-testid="help-guide-overlay" />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>ThoughtNet Help Guide</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close (Esc)"
            type="button"
          >
            <X />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Keyboard Shortcuts</h3>
            <ul className={styles.shortcutList}>
              {keyboardShortcuts.map((shortcut) => (
                <li key={shortcut.key} className={styles.shortcutItem}>
                  <span className={styles.shortcutKey}>{shortcut.key}</span>
                  <span className={styles.shortcutDesc}>{shortcut.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Mouse Actions</h3>
            <ul className={styles.shortcutList}>
              {mouseActions.map((action) => (
                <li key={action.key} className={styles.shortcutItem}>
                  <span className={styles.shortcutKey}>{action.key}</span>
                  <span className={styles.shortcutDesc}>{action.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Node Action Buttons (on hover)</h3>
            <ul className={styles.shortcutList}>
              {nodeActionButtons.map((action) => (
                <li key={action.key} className={styles.shortcutItem}>
                  <span className={styles.shortcutKey}>{action.key}</span>
                  <span className={styles.shortcutDesc}>{action.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tips</h3>
            {tips.map((tip) => (
              <div key={tip} className={styles.tip}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
