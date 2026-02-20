import pool from '../db/pool';

interface MapData {
  nodes: unknown[];
  links: unknown[];
  notes?: unknown[];
  lastModified: string;
}

interface CreateMapBody {
  id?: string;
  title: string;
  data: MapData;
}

interface UpdateMapBody {
  title?: string;
  data?: MapData;
}

export async function listMaps(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, title, node_count, created_at, updated_at
     FROM maps
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
}

export async function getMap(mapId: string, userId: string) {
  const { rows } = await pool.query(
    `SELECT id, title, data, node_count, created_at, updated_at
     FROM maps
     WHERE id = $1 AND user_id = $2`,
    [mapId, userId]
  );
  return rows[0] || null;
}

export async function createMap(body: CreateMapBody, userId: string) {
  const nodeCount = body.data?.nodes?.length ?? 0;
  const { rows } = await pool.query(
    `INSERT INTO maps (id, user_id, title, data, node_count)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5)
     RETURNING id, title, node_count, created_at, updated_at`,
    [body.id || null, userId, body.title, JSON.stringify(body.data), nodeCount]
  );
  return rows[0];
}

export async function updateMap(mapId: string, body: UpdateMapBody, userId: string) {
  const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (body.title !== undefined) {
    setClauses.push(`title = $${paramIndex}`);
    values.push(body.title);
    paramIndex++;
  }

  if (body.data !== undefined) {
    setClauses.push(`data = $${paramIndex}`);
    values.push(JSON.stringify(body.data));
    paramIndex++;

    setClauses.push(`node_count = $${paramIndex}`);
    values.push(body.data.nodes?.length ?? 0);
    paramIndex++;
  }

  values.push(mapId);
  values.push(userId);

  const { rows } = await pool.query(
    `UPDATE maps
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING id, title, node_count, created_at, updated_at`,
    values
  );
  return rows[0] || null;
}

export async function deleteMap(mapId: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM maps WHERE id = $1 AND user_id = $2`,
    [mapId, userId]
  );
  return (rowCount ?? 0) > 0;
}
