import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { pushMapToCloud } from '../../services/syncService';
import { LIBRARY_CATEGORIES } from '../../types/library';
import styles from './PublishModal.module.css';

interface PublishModalProps {
  mapId: string;
  mapTitle: string;
  onClose: () => void;
  onPublished?: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ mapId, mapTitle, onClose, onPublished }) => {
  const [title, setTitle] = useState(mapTitle);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      // Ensure the map exists in the cloud before publishing
      await pushMapToCloud(mapId, true);
      await apiClient.publishMap({
        mapId,
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
      });
      onPublished?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      setError(message);
    } finally {
      setPublishing(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Publish to Library</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.body}>
          <label className={styles.label}>
            Title
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mind map title"
              maxLength={200}
            />
          </label>

          <label className={styles.label}>
            Description
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this mind map about?"
              rows={3}
              maxLength={500}
            />
          </label>

          <label className={styles.label}>
            Category
            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {LIBRARY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Tags
            <div className={styles.tagInputRow}>
              <input
                className={styles.input}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag and press Enter"
                maxLength={30}
              />
              <button
                type="button"
                className={styles.addTagButton}
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className={styles.tags}>
                {tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button className={styles.removeTag} onClick={() => handleRemoveTag(tag)}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </label>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.publishButton} onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};
