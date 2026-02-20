import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiEdit2, FiMap } from 'react-icons/fi';
import type { MapMetadata } from '../../types/mindMap';
import styles from './MapCard.module.css';

interface MapCardProps {
  map: MapMetadata;
  onOpen: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MapCard: React.FC<MapCardProps> = ({ map, onOpen, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(map.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== map.title) {
      await onRename(map.id, trimmed);
    } else {
      setEditTitle(map.title);
    }
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      await onDelete(map.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.card} onClick={() => onOpen(map.id)} role="button" tabIndex={0}>
      <div className={styles.cardIcon}>
        <FiMap size={24} />
      </div>
      <div className={styles.cardContent}>
        {isEditing ? (
          <input
            ref={inputRef}
            className={styles.titleInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setEditTitle(map.title); setIsEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className={styles.cardTitle}>{map.title}</h3>
        )}
        <div className={styles.cardMeta}>
          <span>{map.nodeCount} nodes</span>
          <span>{formatRelativeTime(map.updatedAt)}</span>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button
          className={styles.actionButton}
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          title="Rename"
        >
          <FiEdit2 size={14} />
        </button>
        <button
          className={`${styles.actionButton} ${confirmDelete ? styles.confirmDelete : ''}`}
          onClick={handleDelete}
          title={confirmDelete ? 'Click again to confirm' : 'Delete'}
        >
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );
};
