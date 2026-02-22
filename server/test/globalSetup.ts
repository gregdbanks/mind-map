import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  const pgUri = process.env.PG_URI || 'postgres://thoughtnet:thoughtnet_local@localhost:5434/thoughtnet';

  const pool = new Pool({ connectionString: pgUri });

  // Run schema
  const schema = fs.readFileSync(
    path.join(__dirname, '../src/db/schema.sql'),
    'utf-8'
  );
  await pool.query(schema);

  // Create test user
  const TEST_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  await pool.query(
    `INSERT INTO users (id, cognito_sub, email, username, plan)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (cognito_sub) DO UPDATE SET plan = 'free', stripe_customer_id = NULL`,
    [TEST_USER_ID, 'test-cognito-sub', 'test@example.com', 'testuser', 'free']
  );

  // Store for tests
  process.env.TEST_USER_ID = TEST_USER_ID;
  process.env.PG_URI = pgUri;

  await pool.end();
}
