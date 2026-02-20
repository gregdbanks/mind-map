import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMapMetadata } from '../../hooks/useMapMetadata';
import { useAuth } from '../../context/AuthContext';
import { importFromJSONText } from '../../utils/exportUtils';
import { ProfileDropdown } from '../../components/ProfileDropdown';
import { MapCard } from './MapCard';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const { maps, loading, createMap, renameMap, deleteMap, importMap } = useMapMetadata();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateMap = async () => {
    const id = await createMap('Untitled Map');
    if (id) navigate(`/map/${id}`);
  };

  const handleOpenMap = (id: string) => {
    navigate(`/map/${id}`);
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

      <footer className={styles.proBanner}>
        Coming soon: Cloud sync, exports &amp; sharing
      </footer>
    </div>
  );
};
