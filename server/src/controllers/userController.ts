import pool from '../db/pool';

export async function getProfile(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, cognito_sub, email, username, plan, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
}
