import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Save } from 'lucide-react';
import { RichTextEditor } from '../RichTextEditor';
import type { NodeNote } from '../../types';
import styles from './NotesModal.module.css';

interface NotesModalProps {
  isOpen: boolean;
  nodeId: string;
  nodeText: string;
  existingNote?: NodeNote | null;
  onSave: (content: string, contentJson: any, plainText?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  nodeId,
  nodeText,
  existingNote,
  onSave,
  onDelete,
  onClose,
}) => {
  const [content, setContent] = useState(existingNote?.content || '');
  const [contentJson, setContentJson] = useState(existingNote?.contentJson || null);
  const [plainText, setPlainText] = useState(existingNote?.plainText || '');
  const [hasChanges, setHasChanges] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update local state when existingNote changes
  useEffect(() => {
    setContent(existingNote?.content || '');
    setContentJson(existingNote?.contentJson || null);
    setPlainText(existingNote?.plainText || '');
    setHasChanges(false);
  }, [existingNote, nodeId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Handle Ctrl+S for save
  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isOpen) {
        e.preventDefault();
        handleSaveAndClose();
      }
    };

    document.addEventListener('keydown', handleSave);
    return () => document.removeEventListener('keydown', handleSave);
  }, [isOpen, content, contentJson, plainText]);

  const handleEditorChange = (json: any, html: string, text?: string) => {
    setContentJson(json);
    setContent(html);
    setPlainText(text || '');
    setHasChanges(true);
  };

  const handleSaveAndClose = () => {
    if (content.trim() || contentJson) {
      onSave(content, contentJson, plainText);
    }
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      const shouldClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!shouldClose) return;
    }
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2>Note for "{nodeText}"</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            title="Close (Esc)"
            type="button"
          >
            <X />
          </button>
        </div>

        <div className={styles.content}>
          <RichTextEditor
            content={contentJson || content}
            contentType={contentJson ? 'tiptap' : 'html'}
            onChange={handleEditorChange}
            placeholder="Add your notes here..."
            className={styles.editor}
          />
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {existingNote && onDelete && (
              <button
                className={styles.deleteButton}
                onClick={handleDelete}
                type="button"
              >
                Delete Note
              </button>
            )}
          </div>
          
          <div className={styles.footerRight}>
            <button
              className={styles.cancelButton}
              onClick={handleClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSaveAndClose}
              type="button"
              disabled={!content.trim() && !contentJson}
            >
              <Save />
              Save Note
            </button>
          </div>
        </div>

        <div className={styles.hint}>
          <small>Tip: Use Ctrl+S to save, Esc to close</small>
        </div>
      </div>
    </>,
    document.body
  );
};