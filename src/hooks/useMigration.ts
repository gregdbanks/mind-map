import { useState, useEffect, useRef } from 'react';
import { migrateFromLocalStorage } from '../services/migration';

/**
 * Hook that runs the one-time localStorage → IndexedDB migration.
 *
 * Returns `{ migrating: true }` until the migration promise settles,
 * then `{ migrating: false }`.  Safe to call from multiple components —
 * only the first invocation triggers the actual migration.
 */
export function useMigration() {
  const [migrating, setMigrating] = useState(true);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    migrateFromLocalStorage().finally(() => {
      setMigrating(false);
    });
  }, []);

  return { migrating };
}
