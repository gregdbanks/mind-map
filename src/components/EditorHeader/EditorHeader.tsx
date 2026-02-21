import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useMapTitle } from '../../hooks/useMapTitle';
import styles from './EditorHeader.module.css';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'sync-error' | 'offline';

interface EditorHeaderProps {
  mapId: string;
  saveStatus: SaveStatus;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({ mapId, saveStatus }) => {
  const navigate = useNavigate();
  const { title, loading: titleLoading, rename } = useMapTitle(mapId);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(title);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      await rename(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const showStatus = saveStatus !== 'idle';

  return (
    <div className={styles.header}>
      <button
        className={styles.backButton}
        onClick={() => navigate('/')}
        title="Back to Dashboard"
        aria-label="Back to Dashboard"
      >
        <FiArrowLeft size={18} />
      </button>

      <div className={styles.titleSection}>
        {titleLoading ? null : isEditing ? (
          <input
            ref={inputRef}
            className={styles.titleInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span
            className={styles.title}
            onClick={handleStartEdit}
            title="Click to rename"
          >
            {title}
          </span>
        )}
      </div>

      <div
        className={`${styles.saveStatus} ${showStatus ? styles.saveStatusVisible : styles.saveStatusHidden}`}
      >
        {saveStatus === 'saving' && <span>Saving...</span>}
        {saveStatus === 'saved' && (
          <>
            <FiCheck size={14} className={styles.checkIcon} />
            <span>Saved locally</span>
          </>
        )}
        {saveStatus === 'syncing' && <span>Syncing...</span>}
        {saveStatus === 'synced' && (
          <>
            <FiCheck size={14} className={styles.cloudCheckIcon} />
            <span>Synced</span>
          </>
        )}
        {saveStatus === 'sync-error' && (
          <span className={styles.syncError}>Cloud sync failed</span>
        )}
        {saveStatus === 'offline' && (
          <span className={styles.offlineStatus}>Offline — saved locally</span>
        )}
      </div>
    </div>
  );
};
