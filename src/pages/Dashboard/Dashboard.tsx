import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapMetadata } from '../../hooks/useMapMetadata';
import { MapCard } from './MapCard';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const { maps, loading, createMap, renameMap, deleteMap } = useMapMetadata();
  const navigate = useNavigate();

  const handleCreateMap = async () => {
    const id = await createMap('Untitled Map');
    if (id) navigate(`/map/${id}`);
  };

  const handleOpenMap = (id: string) => {
    navigate(`/map/${id}`);
  };

  if (loading) {
    return <div className={styles.loading}>Loading maps...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ThoughtNet</h1>
        <button className={styles.createButton} onClick={handleCreateMap}>
          + New Map
        </button>
      </header>

      {maps.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Welcome to ThoughtNet</h2>
          <p>Create your first mind map to get started</p>
          <button className={styles.createButton} onClick={handleCreateMap}>
            Create Mind Map
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {maps.map((map) => (
            <MapCard
              key={map.id}
              map={map}
              onOpen={handleOpenMap}
              onRename={renameMap}
              onDelete={deleteMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};
