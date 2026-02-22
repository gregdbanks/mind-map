import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileDown } from 'lucide-react';
import type { MindMapState, NodeNote } from '../../types';
import { exportToJSON } from '../../utils/exportUtils';
import { exportToSVG, exportToPNG, exportToPDF } from '../../utils/exportUtils';
import { exportToMarkdown } from '../../utils/markdownExportUtils';
import type { CanvasBackground } from '../BackgroundSelector';
import styles from './ExportSelector.module.css';

type ExportFormat = 'json' | 'svg' | 'png' | 'pdf' | 'markdown';

interface ExportSelectorProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  getMainGroupBBox: () => { x: number; y: number; width: number; height: number } | null;
  canvasBackground: CanvasBackground;
  state: MindMapState;
  notes?: Map<string, NodeNote>;
  onExportSuccess?: () => void;
}

const exportOptions: { type: ExportFormat; name: string; description: string }[] = [
  { type: 'json', name: 'JSON', description: 'Editable data — re-import later' },
  { type: 'svg', name: 'SVG', description: 'Vector graphic — scalable' },
  { type: 'png', name: 'PNG', description: 'Image — 2x retina quality' },
  { type: 'pdf', name: 'PDF', description: 'Document — print-ready' },
  { type: 'markdown', name: 'Markdown', description: 'Text outline — bullets & headings' },
];

export const ExportSelector: React.FC<ExportSelectorProps> = ({
  svgRef,
  getMainGroupBBox,
  canvasBackground,
  state,
  notes,
  onExportSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsOpen(false);

    if (format === 'json') {
      exportToJSON(state, notes, onExportSuccess);
      return;
    }

    if (format === 'markdown') {
      exportToMarkdown(state.nodes, onExportSuccess);
      return;
    }

    // SVG/PNG/PDF all need the live SVG element and bounding box
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const bbox = getMainGroupBBox();
    if (!bbox) return;

    if (format === 'svg') {
      exportToSVG(svgEl, bbox, canvasBackground, onExportSuccess);
    } else if (format === 'png') {
      await exportToPNG(svgEl, bbox, canvasBackground, onExportSuccess);
    } else if (format === 'pdf') {
      await exportToPDF(svgEl, bbox, canvasBackground, onExportSuccess);
    }
  }, [svgRef, getMainGroupBBox, canvasBackground, state, notes, onExportSuccess]);

  return (
    <div className={styles.exportSelector}>
      <button
        ref={buttonRef}
        className={styles.iconButton}
        onClick={() => setIsOpen(!isOpen)}
        title="Export mind map"
        aria-label="Export mind map"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FileDown size={16} />
      </button>

      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {exportOptions.map((option) => (
            <button
              key={option.type}
              className={styles.dropdownItem}
              onClick={() => handleExport(option.type)}
            >
              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{option.name}</div>
                <div className={styles.optionDescription}>{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
