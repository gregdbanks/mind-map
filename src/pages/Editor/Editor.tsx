import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MindMapProvider } from '../../context/MindMapContext';
import { useMindMap } from '../../context/MindMapContext';
import { MindMapCanvas } from '../../components/MindMapCanvas/MindMapCanvas';
import { EditorHeader } from '../../components/EditorHeader';
import type { SaveStatus } from '../../components/EditorHeader';
import { useCloudSync } from '../../hooks/useCloudSync';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { VersionHistoryPanel } from '../../components/VersionHistoryPanel';

const EditorContent: React.FC<{ mapId: string }> = ({ mapId }) => {
  const { state, dispatch } = useMindMap();
  const { syncStatus, canSync, isOnline } = useCloudSync();
  const { isAuthenticated } = useAuth();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isPro, setIsPro] = useState(false);
  const [isAtCloudLimit, setIsAtCloudLimit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewingVersionId, setPreviewingVersionId] = useState<string | null>(null);
  const prevDirtyRef = useRef(state.isDirty);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsPro(false);
      setIsAtCloudLimit(false);
      return;
    }
    apiClient.getPlanStatus().then((status) => {
      setIsPro(status.plan === 'pro');
      setIsAtCloudLimit(status.plan !== 'pro' && status.mapLimit !== null && status.mapCount >= status.mapLimit);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const wasDirty = prevDirtyRef.current;
    const isDirty = state.isDirty;
    prevDirtyRef.current = isDirty;

    if (!wasDirty && isDirty) {
      // Became dirty → saving in progress
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveStatus('saving');
    } else if (wasDirty && !isDirty) {
      // Became clean → saved locally
      if (canSync) {
        // Cloud sync will update status via syncStatus
        setSaveStatus('saved');
      } else if (!isOnline) {
        setSaveStatus('offline');
        timerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('saved');
        timerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.isDirty, canSync, isOnline]);

  // React to cloud sync status changes
  useEffect(() => {
    if (!canSync) return;

    if (syncStatus === 'syncing') {
      setSaveStatus('syncing');
    } else if (syncStatus === 'synced') {
      setSaveStatus('synced');
      timerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } else if (syncStatus === 'error') {
      setSaveStatus('sync-error');
      timerRef.current = setTimeout(() => setSaveStatus('idle'), 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncStatus, canSync]);

  const handlePreviewVersion = async (versionId: string) => {
    if (!versionId) {
      setPreviewingVersionId(null);
      // Reload current map to exit preview
      try {
        const currentMap = await apiClient.getMap(mapId);
        if (currentMap.data) {
          dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: currentMap.data.nodes, links: currentMap.data.links } });
        }
      } catch {
        // fall through
      }
      return;
    }
    try {
      const version = await apiClient.getVersion(mapId, versionId);
      setPreviewingVersionId(versionId);
      dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: version.data.nodes, links: version.data.links } });
    } catch {
      alert('Failed to load version preview.');
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const restoredMap = await apiClient.restoreVersion(mapId, versionId);
      setPreviewingVersionId(null);
      if (restoredMap.data) {
        dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: restoredMap.data.nodes, links: restoredMap.data.links } });
      }
      setShowHistory(false);
    } catch {
      alert('Failed to restore version.');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <EditorHeader
        mapId={mapId}
        saveStatus={saveStatus}
        isPro={isPro}
        isAtCloudLimit={isAtCloudLimit}
        onToggleHistory={() => setShowHistory((prev) => !prev)}
        showingHistory={showHistory}
      />
      <MindMapCanvas mapId={mapId} />
      {showHistory && (
        <VersionHistoryPanel
          mapId={mapId}
          onClose={() => {
            setShowHistory(false);
            if (previewingVersionId) handlePreviewVersion('');
          }}
          onPreview={handlePreviewVersion}
          onRestore={handleRestoreVersion}
          previewingVersionId={previewingVersionId}
        />
      )}
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
