import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapProvider } from '../../context/MindMapContext';
import { useMindMap } from '../../context/MindMapContext';
import { MindMapCanvas } from '../../components/MindMapCanvas/MindMapCanvas';
import { EditorHeader } from '../../components/EditorHeader';
import type { SaveStatus } from '../../components/EditorHeader';

const EditorContent: React.FC<{ mapId: string }> = ({ mapId }) => {
  const { state } = useMindMap();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const prevDirtyRef = useRef(state.isDirty);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasDirty = prevDirtyRef.current;
    const isDirty = state.isDirty;
    prevDirtyRef.current = isDirty;

    if (!wasDirty && isDirty) {
      // Became dirty → saving in progress
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveStatus('saving');
    } else if (wasDirty && !isDirty) {
      // Became clean → saved
      setSaveStatus('saved');
      timerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.isDirty]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <EditorHeader mapId={mapId} saveStatus={saveStatus} />
      <MindMapCanvas mapId={mapId} />
    </div>
  );
};

export const Editor: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();

  if (!mapId) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <MindMapProvider>
      <EditorContent mapId={mapId} />
    </MindMapProvider>
  );
};
