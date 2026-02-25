import React, { useState } from 'react';
import {
  ClipboardList,
  BookOpen,
  Target,
  Users,
  Lightbulb,
  Calendar,
  Download,
} from 'lucide-react';
import { templates } from '../../data/templates';
import type { MindMapTemplate } from '../../data/templates';
import styles from './TemplateModal.module.css';

interface TemplateModalProps {
  onSelect: (template: MindMapTemplate) => void;
  onClose: () => void;
}

const iconMap: Record<string, React.FC<{ size?: number }>> = {
  ClipboardList,
  BookOpen,
  Target,
  Users,
  Lightbulb,
  Calendar,
};

export const TemplateModal: React.FC<TemplateModalProps> = ({ onSelect, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDownload = (e: React.MouseEvent, template: MindMapTemplate) => {
    e.stopPropagation();
    const data = { nodes: template.nodes, links: template.links };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUseTemplate = () => {
    const template = templates.find((t) => t.id === selectedId);
    if (template) onSelect(template);
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>New from Template</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            {templates.map((template) => {
              const Icon = iconMap[template.icon];
              const isSelected = selectedId === template.id;
              return (
                <button
                  key={template.id}
                  className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                  onClick={() => setSelectedId(template.id)}
                >
                  <div className={styles.cardIcon}>
                    {Icon && <Icon size={24} />}
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardName}>{template.name}</h3>
                    <p className={styles.cardDescription}>{template.description}</p>
                    <span className={styles.cardMeta}>
                      {template.nodes.length} nodes
                    </span>
                  </div>
                  <button
                    className={styles.downloadButton}
                    onClick={(e) => handleDownload(e, template)}
                    title="Download JSON"
                  >
                    <Download size={14} />
                  </button>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.useButton}
            onClick={handleUseTemplate}
            disabled={!selectedId}
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};
