import { Pool } from 'pg';

export default async function globalTeardown() {
  const pgUri = process.env.PG_URI || 'postgres://thoughtnet:thoughtnet_local@localhost:5433/thoughtnet';
  const pool = new Pool({ connectionString: pgUri });

  // Clean up test data
  await pool.query('DELETE FROM maps');
  await pool.query('DELETE FROM users');
  await pool.end();
}
