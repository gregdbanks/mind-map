import React from 'react';
import styles from './NodeActions.module.css';

interface NodeActionsProps {
  nodeId: string;
  onAdd: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  x: number;
  y: number;
  nodeRadius: number;
}

export const NodeActions: React.FC<NodeActionsProps> = ({ 
  nodeId, 
  onAdd, 
  onEdit, 
  onDelete,
  nodeRadius
}) => {
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(nodeId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(nodeId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this node and all its children?')) {
      onDelete(nodeId);
    }
  };

  // Position actions in a circle around the node
  const actionRadius = nodeRadius + 25;
  const actions = [
    { icon: '+', onClick: handleAdd, angle: -90, title: 'Add child node' },
    { icon: '✎', onClick: handleEdit, angle: 0, title: 'Edit node' },
    { icon: '×', onClick: handleDelete, angle: 90, title: 'Delete node' }
  ];

  return (
    <g className={styles.nodeActions}>
      {actions.map((action, index) => {
        const angleRad = (action.angle * Math.PI) / 180;
        const actionX = Math.cos(angleRad) * actionRadius;
        const actionY = Math.sin(angleRad) * actionRadius;
        
        return (
          <g key={index} transform={`translate(${actionX}, ${actionY})`}>
            <circle
              className={styles.actionButton}
              r="12"
              onClick={action.onClick}
            />
            <text
              className={styles.actionIcon}
              textAnchor="middle"
              dy=".35em"
              pointerEvents="none"
            >
              {action.icon}
            </text>
            <title>{action.title}</title>
          </g>
        );
      })}
    </g>
  );
};