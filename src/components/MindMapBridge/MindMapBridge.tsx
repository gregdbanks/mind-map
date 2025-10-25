import React from 'react';
import { MindMap } from '@gbdev20053/simple-comp-ui';
import type { MindMapData, MindMapNode as ComponentNode } from '@gbdev20053/simple-comp-ui';
import type { MindMapState, Node as FrontendNode } from '../../types/mindMap';

/**
 * Bridge component that converts frontend MindMapState to reusable component format
 * This allows testing compatibility without breaking existing functionality
 */
export interface MindMapBridgeProps {
  /** Frontend state object */
  state: MindMapState;
  /** Optional width override */
  width?: number;
  /** Optional height override */
  height?: number;
  /** Test mode - adds data-testid attributes */
  testMode?: boolean;
}

/**
 * Converts frontend Node to component MindMapNode format
 */
function convertNode(node: FrontendNode): ComponentNode {
  return {
    id: node.id,
    text: node.text,
    x: node.x,
    y: node.y,
    vx: node.vx,
    vy: node.vy,
    fx: node.fx,
    fy: node.fy,
    collapsed: node.collapsed,
    parent: node.parent,
  };
}

/**
 * Converts frontend MindMapState to component MindMapData format
 */
function convertState(state: MindMapState): MindMapData {
  const nodes = Array.from(state.nodes.values()).map(convertNode);
  const links = state.links.map(link => ({
    source: link.source,
    target: link.target,
  }));

  return { nodes, links };
}

export const MindMapBridge: React.FC<MindMapBridgeProps> = ({
  state,
  width = window.innerWidth,
  height = window.innerHeight,
  testMode = false,
}) => {
  const data = convertState(state);

  return (
    <div data-testid={testMode ? "mind-map-bridge" : undefined}>
      <MindMap
        data={data}
        width={width}
        height={height}
        className="mind-map-bridge"
      />
    </div>
  );
};