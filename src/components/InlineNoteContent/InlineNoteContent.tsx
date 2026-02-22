import React, { useRef, useEffect, useCallback } from 'react';
import type { NodeNote } from '../../types';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import styles from './InlineNoteContent.module.css';

interface InlineNoteContentProps {
  nodeId: string;
  note: NodeNote | null;
  onSave: (content: string, contentJson: any, plainText?: string) => void;
  onResize: (width: number, height: number) => void;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

export const InlineNoteContent: React.FC<InlineNoteContentProps> = ({
  note,
  onSave,
  onResize,
  minWidth,
  minHeight,
  maxHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastReportedHeight = useRef<number>(0);

  // Container grows with content up to maxHeight, then scrolls.
  // The foreignObject height is (noteHeight - 28 header - 8 padding).
  // The container must not exceed that so the scrollbar renders within bounds.
  const headerOffset = 28;
  const bottomPad = 8;

  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const contentNeeded = el.scrollHeight;
      const totalNeeded = Math.min(
        Math.max(contentNeeded + headerOffset, minHeight),
        maxHeight
      );
      if (Math.abs(totalNeeded - lastReportedHeight.current) > 2) {
        lastReportedHeight.current = totalNeeded;
        onResize(minWidth, totalNeeded);
      }
    };

    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    const timer = setTimeout(measure, 100);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [onResize, minWidth, minHeight, maxHeight]);

  const handleEditorChange = useCallback((contentJson: any, html: string, plainText?: string) => {
    onSave(html, contentJson, plainText);
  }, [onSave]);

  // Stop most events from propagating to D3/canvas
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  // For wheel events: stop regular scrolls from reaching D3 (prevents canvas zoom
  // when scrolling note text), but let pinch-to-zoom events (ctrlKey) through so
  // D3 handles them instead of the browser zooming the entire page.
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom — let it bubble to D3 zoom handler
      return;
    }
    e.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ maxHeight: maxHeight - headerOffset - bottomPad }}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onPointerDown={stopPropagation}
      onKeyDown={handleKeyDown}
      onKeyUp={stopPropagation}
      onWheel={handleWheel}
    >
      <RichTextEditor
        content={note?.contentJson || note?.content}
        contentType={note?.contentJson ? 'tiptap' : 'html'}
        onChange={handleEditorChange}
        placeholder="Click to add notes..."
        minimal={true}
        className={styles.inlineEditor}
      />
    </div>
  );
};
