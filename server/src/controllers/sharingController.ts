import crypto from 'crypto';
import pool from '../db/pool';

/** Get sharing status for a map */
export async function getShareStatus(mapId: string, userId: string) {
  const { rows } = await pool.query(
    `SELECT is_public, share_token, shared_at
     FROM maps
     WHERE id = $1 AND user_id = $2`,
    [mapId, userId]
  );

  if (rows.length === 0) return null;

  return {
    is_public: rows[0].is_public,
    share_token: rows[0].share_token,
    shared_at: rows[0].shared_at,
  };
}

/** Enable sharing for a map — generates a unique share token */
export async function shareMap(mapId: string, userId: string) {
  // Check if already shared
  const { rows: existing } = await pool.query(
    `SELECT share_token FROM maps WHERE id = $1 AND user_id = $2`,
    [mapId, userId]
  );

  if (existing.length === 0) return null;

  // If already has a token, just enable public flag
  if (existing[0].share_token) {
    const { rows } = await pool.query(
      `UPDATE maps
       SET is_public = TRUE, shared_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING share_token, shared_at`,
      [mapId, userId]
    );
    return rows[0];
  }

  // Generate new share token
  const shareToken = crypto.randomBytes(16).toString('hex');

  const { rows } = await pool.query(
    `UPDATE maps
     SET is_public = TRUE,
         share_token = $3,
         shared_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING share_token, shared_at`,
    [mapId, userId, shareToken]
  );

  return rows[0] || null;
}

/** Disable sharing for a map */
export async function unshareMap(mapId: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE maps
     SET is_public = FALSE
     WHERE id = $1 AND user_id = $2`,
    [mapId, userId]
  );
  return (rowCount ?? 0) > 0;
}

/** Get a public map by share token (no authentication required) */
export async function getPublicMap(shareToken: string) {
  const { rows } = await pool.query(
    `SELECT id, title, data, node_count, created_at
     FROM maps
     WHERE share_token = $1 AND is_public = TRUE`,
    [shareToken]
  );

  return rows[0] || null;
}
