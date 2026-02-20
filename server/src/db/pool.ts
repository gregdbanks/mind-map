import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.PG_URI,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;
