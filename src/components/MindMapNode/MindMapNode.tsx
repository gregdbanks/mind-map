import React, { useState, useEffect, useRef } from 'react';
import type { Node } from '../../types/mindMap';
import styles from './MindMapNode.module.css';

interface MindMapNodeProps {
  node: Node;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (nodeId: string) => void;
  onStartEdit: (nodeId: string) => void;
  onTextChange: (nodeId: string, newText: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  hasChildren: boolean;
  onMouseDown?: (nodeId: string, event: React.MouseEvent) => void;
}

export const MindMapNode: React.FC<MindMapNodeProps> = ({
  node,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onTextChange,
  onToggleCollapse,
  onDelete,
  hasChildren,
  onMouseDown,
}) => {
  const [editText, setEditText] = useState(node.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditText(node.text);
  }, [node.text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEdit(node.id);
  };

  const handleTextSubmit = () => {
    const trimmedText = editText.trim();
    if (trimmedText) {
      onTextChange(node.id, trimmedText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent event from bubbling up to canvas
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditText(node.text);
      onSelect(node.id); // Exit edit mode by selecting
    }
  };

  const handleBlur = () => {
    handleTextSubmit();
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleCollapse(node.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(node.id);
  };

  const nodeRadius = 30;
  const collapseButtonRadius = 8;

  return (
    <g 
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      data-testid="mind-map-node"
    >
      {/* Main node circle */}
      <circle
        className={`${styles.nodeCircle} ${isSelected ? styles.selected : ''}`}
        r={nodeRadius}
        role="button"
        tabIndex={0}
        aria-label={node.text}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={(e) => onMouseDown?.(node.id, e)}
      />

      {/* Node text or input */}
      {isEditing ? (
        <foreignObject
          x={-nodeRadius * 2}
          y={-nodeRadius / 2}
          width={nodeRadius * 4}
          height={nodeRadius}
          className={styles.foreignObject}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            role="textbox"
            className={styles.editInput}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => e.stopPropagation()}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </foreignObject>
      ) : (
        <text
          className={styles.nodeText}
          textAnchor="middle"
          dominantBaseline="central"
          pointerEvents="none"
        >
          {node.text}
        </text>
      )}

      {/* Delete button - only show when selected */}
      {isSelected && (
        <g
          transform={`translate(${-nodeRadius - collapseButtonRadius}, 0)`}
          onClick={handleDeleteClick}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          className={styles.deleteButton}
          role="button"
          aria-label="delete"
          style={{ pointerEvents: 'all' }}
        >
          <circle
            r={collapseButtonRadius}
            className={styles.deleteButtonCircle}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className={styles.deleteButtonText}
            pointerEvents="none"
          >
            ×
          </text>
        </g>
      )}

      {/* Collapse/expand button */}
      {hasChildren && (
        <g
          transform={`translate(${nodeRadius + collapseButtonRadius}, 0)`}
          onClick={handleCollapseClick}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          className={styles.collapseButton}
          role="button"
          aria-label={node.collapsed ? 'expand' : 'collapse'}
          style={{ pointerEvents: 'all' }}
        >
          <circle
            r={collapseButtonRadius}
            className={styles.collapseButtonCircle}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className={styles.collapseButtonText}
            pointerEvents="none"
          >
            {node.collapsed ? '+' : '-'}
          </text>
        </g>
      )}
    </g>
  );
};