import React from 'react';
import type { Node } from '../../types/mindMap';
import { isAWSService } from '../../utils/awsServices';
import styles from './NodeTooltip.module.css';

interface NodeTooltipProps {
  node: Node;
  depth: number;
  childCount: number;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({ node, depth, childCount }) => {
  const isAWS = isAWSService(node.text);
  
  return (
    <div className={styles.tooltip}>
      <h3 className={styles.title}>{node.text}</h3>
      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>ID:</span>
          <span className={styles.value}>{node.id}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Depth:</span>
          <span className={styles.value}>Level {depth}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Children:</span>
          <span className={styles.value}>{childCount}</span>
        </div>
        {node.parent && (
          <div className={styles.row}>
            <span className={styles.label}>Parent ID:</span>
            <span className={styles.value}>{node.parent}</span>
          </div>
        )}
        {isAWS && (
          <div className={styles.row}>
            <span className={styles.label}>Type:</span>
            <span className={styles.value} style={{ color: '#FF9900' }}>AWS Service</span>
          </div>
        )}
      </div>
    </div>
  );
};