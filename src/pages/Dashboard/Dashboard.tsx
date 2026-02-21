import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMapMetadata } from '../../hooks/useMapMetadata';
import { useAuth } from '../../context/AuthContext';
import { useCloudSync } from '../../hooks/useCloudSync';
import { importFromJSONText } from '../../utils/exportUtils';
import { ProfileDropdown } from '../../components/ProfileDropdown';
import { MapCard } from './MapCard';
import type { MapMetadata } from '../../types/mindMap';
import type { CloudMapMeta } from '../../types/sync';
import styles from './Dashboard.module.css';

/** Merge local IDB maps with cloud API maps by UUID */
function mergeMaps(
  localMaps: MapMetadata[],
  cloudMaps: CloudMapMeta[]
): MapMetadata[] {
  const merged = new Map<string, MapMetadata>();

  // Start with local maps
  for (const local of localMaps) {
    merged.set(local.id, {
      ...local,
      syncStatus: local.syncStatus ?? 'local',
    });
  }

  // Overlay cloud maps
  for (const cloud of cloudMaps) {
    const existing = merged.get(cloud.id);
    if (existing) {
      // Exists both locally and in cloud → synced
      merged.set(cloud.id, {
        ...existing,
        syncStatus: 'synced',
        lastSyncedAt: cloud.updated_at,
        updatedAt: new Date(cloud.updated_at) > new Date(existing.updatedAt)
          ? cloud.updated_at
          : existing.updatedAt,
        isPublic: cloud.is_public,
        shareToken: cloud.share_token,
      });
    } else {
      // Cloud-only map
      merged.set(cloud.id, {
        id: cloud.id,
        title: cloud.title,
        createdAt: cloud.created_at,
        updatedAt: cloud.updated_at,
        nodeCount: cloud.node_count,
        syncStatus: 'cloud-only',
        lastSyncedAt: cloud.updated_at,
        isPublic: cloud.is_public,
        shareToken: cloud.share_token,
      });
    }
  }

  // Sort by updatedAt descending
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export const Dashboard: React.FC = () => {
  const { maps: localMaps, loading, createMap, renameMap, deleteMap, importMap, refreshMaps } = useMapMetadata();
  const { isAuthenticated } = useAuth();
  const { fetchCloudMaps, saveToCloud, deleteFromCloud, pullMap, isOnline } = useCloudSync();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mergedMaps, setMergedMaps] = useState<MapMetadata[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan: string; mapCount: number; mapLimit: number | null } | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Handle checkout redirect
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setCheckoutSuccess(true);
      setSearchParams({}, { replace: true });
      setTimeout(() => setCheckoutSuccess(false), 5000);
    }
  }, [searchParams, setSearchParams]);

  // Merge local + cloud maps
  const refreshMergedMaps = useCallback(async () => {
    if (!isAuthenticated || !isOnline) {
      setMergedMaps(localMaps.map((m) => ({ ...m, syncStatus: m.syncStatus ?? 'local' })));
      return;
    }

    setCloudLoading(true);
    const response = await fetchCloudMaps();
    setMergedMaps(mergeMaps(localMaps, response.maps));
    setPlanInfo({ plan: response.plan, mapCount: response.mapCount, mapLimit: response.mapLimit });
    setCloudLoading(false);
  }, [localMaps, isAuthenticated, isOnline, fetchCloudMaps]);

  useEffect(() => {
    refreshMergedMaps();
  }, [refreshMergedMaps]);

  const displayMaps = isAuthenticated ? mergedMaps : localMaps;
  const isAtLimit = planInfo && planInfo.plan !== 'pro' && planInfo.mapLimit !== null && planInfo.mapCount >= planInfo.mapLimit;

  const handleCreateMap = async () => {
    const id = await createMap('Untitled Map');
    if (id) navigate(`/map/${id}`);
  };

  const handleOpenMap = async (id: string) => {
    const map = displayMaps.find((m) => m.id === id);
    if (map?.syncStatus === 'cloud-only') {
      await pullMap(id);
      await refreshMaps();
    }
    navigate(`/map/${id}`);
  };

  const handleDeleteMap = async (id: string) => {
    const map = displayMaps.find((m) => m.id === id);
    await deleteMap(id);
    if (map?.syncStatus === 'synced' || map?.syncStatus === 'cloud-only') {
      await deleteFromCloud(id);
    }
  };

  const handleSaveToCloud = async (id: string) => {
    const success = await saveToCloud(id);
    if (success) {
      await refreshMergedMaps();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromJSONText(text);
      if (!result) {
        alert('Invalid mind map file. Please select a valid JSON export.');
        return;
      }

      const nodes = Array.from(result.state.nodes.values());
      const title = file.name.replace(/\.json$/i, '').replace(/^mindmap-\d+$/, 'Imported Map');

      const id = await importMap(title, nodes, result.state.links, result.notes);
      navigate(`/map/${id}`);
    } catch {
      alert('Failed to import file. Please check the file format.');
    }

    // Reset so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading maps...</div>;
  }

  const footerText = () => {
    if (!isAuthenticated) return 'Sign in to sync maps across devices';
    if (checkoutSuccess) return 'Welcome to Pro! Unlimited cloud maps and sharing.';
    if (planInfo?.plan === 'pro') return 'Pro — Unlimited cloud maps and sharing';
    if (planInfo && planInfo.mapLimit !== null) {
      return `${planInfo.mapCount} of ${planInfo.mapLimit} cloud maps used`;
    }
    return 'Cloud sync enabled';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ThoughtNet</h1>
        <div className={styles.headerActions}>
          <button className={styles.importButton} onClick={handleImportClick}>
            Import JSON
          </button>
          <button className={styles.createButton} onClick={handleCreateMap}>
            + New Map
          </button>
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <Link to="/login" className={styles.signInLink}>Sign in</Link>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />
      </header>

      {checkoutSuccess && (
        <div className={styles.successBanner}>
          Upgrade successful! You now have unlimited cloud maps and sharing.
        </div>
      )}

      {displayMaps.length === 0 && !cloudLoading ? (
        <div className={styles.emptyState}>
          <h2>Welcome to ThoughtNet</h2>
          <p>Create your first mind map to get started</p>
          <button className={styles.createButton} onClick={handleCreateMap}>
            Create Mind Map
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayMaps.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              onOpen={handleOpenMap}
              onRename={renameMap}
              onDelete={handleDeleteMap}
              onSaveToCloud={isAuthenticated && !isAtLimit ? handleSaveToCloud : undefined}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}

      <footer className={styles.proBanner}>
        {footerText()}
      </footer>
    </div>
  );
};
