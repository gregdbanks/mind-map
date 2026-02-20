import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapProvider } from '../../context/MindMapContext';
import { MindMapCanvas } from '../../components/MindMapCanvas/MindMapCanvas';
import { DirtyIndicator } from '../../components/DirtyIndicator';

export const Editor: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();

  if (!mapId) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <MindMapProvider>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <MindMapCanvas mapId={mapId} />
        <DirtyIndicator />
      </div>
    </MindMapProvider>
  );
};
