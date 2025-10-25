import { useState } from 'react';
import { MindMapBridge } from '../components/MindMapBridge';
import type { MindMapState } from '../types/mindMap';

const initialState: MindMapState = {
  nodes: new Map([
    ['1', {
      id: '1',
      text: 'Test Root',
      x: 300,
      y: 200,
      collapsed: false,
      parent: null,
    }],
    ['2', {
      id: '2', 
      text: 'Child Node',
      x: 450,
      y: 300,
      collapsed: false,
      parent: '1',
    }],
    ['3', {
      id: '3',
      text: 'Another Child',
      x: 150,
      y: 300,
      collapsed: false,
      parent: '1',
    }],
  ]),
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
  ],
  selectedNodeId: null,
  editingNodeId: null,
  lastModified: new Date(),
};

export const TestPage = () => {
  const [state] = useState(initialState);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1 style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
        Bridge Component Test
      </h1>
      <MindMapBridge 
        state={state}
        width={window.innerWidth}
        height={window.innerHeight}
        testMode={true}
      />
    </div>
  );
};