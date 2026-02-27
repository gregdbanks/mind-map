import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, GitFork, Star } from 'lucide-react';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';
import { ProfileDropdown } from '../../components/ProfileDropdown';
import { AdBanner } from '../../components/AdBanner';
import { apiClient } from '../../services/apiClient';
import { LIBRARY_CATEGORIES, LIBRARY_SORT_OPTIONS } from '../../types/library';
import type { LibraryMapSummary } from '../../types/library';
import styles from './Library.module.css';

const MapCard: React.FC<{ map: LibraryMapSummary; onClick: () => void }> = ({ map, onClick }) => (
  <button className={styles.card} onClick={onClick} type="button">
    <div className={styles.cardHeader}>
      <span className={styles.categoryBadge}>{map.category}</span>
      <span className={styles.nodeCount}>{map.node_count} nodes</span>
    </div>
    <h3 className={styles.cardTitle}>{map.title}</h3>
    {map.description && <p className={styles.cardDescription}>{map.description}</p>}
    <div className={styles.cardMeta}>
      <span className={styles.author}>{map.author_name || 'Anonymous'}</span>
      <div className={styles.cardStats}>
        <span className={styles.stat}>
          <Star size={13} fill={Number(map.rating_avg) > 0 ? '#f59e0b' : 'none'} stroke={Number(map.rating_avg) > 0 ? '#f59e0b' : '#64748b'} />
          {Number(map.rating_avg) > 0 ? Number(map.rating_avg).toFixed(1) : '\u2014'}
        </span>
        <span className={styles.stat}>
          <GitFork size={13} />
          {map.fork_count}
        </span>
      </div>
    </div>
    {map.tags.length > 0 && (
      <div className={styles.cardTags}>
        {map.tags.slice(0, 3).map((tag) => (
          <span key={tag} className={styles.cardTag}>{tag}</span>
        ))}
        {map.tags.length > 3 && <span className={styles.cardTag}>+{map.tags.length - 3}</span>}
      </div>
    )}
  </button>
);

export const Library: React.FC = () => {
  const { maps, pagination, loading, error, sort, category, search, setPage, setSort, setCategory, setSearch } = useLibrary();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getPlanStatus().then((status) => {
      setIsPro(status.plan === 'pro');
    }).catch(() => {});
  }, [isAuthenticated]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.logo}>ThoughtNet</Link>
          <span className={styles.divider}>/</span>
          <span className={styles.pageTitle}>
            <BookOpen size={18} />
            Library
          </span>
        </div>
        <div className={styles.headerRight}>
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <Link to="/login" className={styles.signInLink}>Sign in</Link>
          )}
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search mind maps..."
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {LIBRARY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            {LIBRARY_SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading library...</span>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p className={styles.errorText}>{error}</p>
        </div>
      ) : maps.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>No mind maps found</h2>
          <p className={styles.emptyText}>
            {search || category ? 'Try adjusting your filters' : 'Be the first to publish a mind map!'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {maps.map((map) => (
              <MapCard key={map.id} map={map} onClick={() => navigate(`/library/${map.id}`)} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className={styles.pageButton}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <AdBanner isPro={isPro} />

      <footer className={styles.footer}>
        <span>Community mind map library</span>
        <Link to="/" className={styles.footerLink}>Back to Dashboard</Link>
      </footer>
    </div>
  );
};
