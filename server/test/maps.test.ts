import request from 'supertest';
import { app } from '../src/app';

describe('Maps API', () => {
  let createdMapId: string;

  it('POST /api/maps - creates a new map', async () => {
    const res = await request(app)
      .post('/api/maps')
      .send({
        title: 'Test Mind Map',
        data: {
          nodes: [
            { id: 'root-1', text: 'Central Topic', collapsed: false, parent: null }
          ],
          links: [],
          notes: [],
          lastModified: new Date().toISOString()
        }
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Mind Map');
    expect(res.body.node_count).toBe(1);
    createdMapId = res.body.id;
  });

  it('POST /api/maps - rejects missing title', async () => {
    const res = await request(app)
      .post('/api/maps')
      .send({ data: { nodes: [], links: [] } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title and data are required');
  });

  it('POST /api/maps - rejects missing data', async () => {
    const res = await request(app)
      .post('/api/maps')
      .send({ title: 'No Data Map' });

    expect(res.status).toBe(400);
  });

  it('GET /api/maps - lists maps for user', async () => {
    const res = await request(app).get('/api/maps');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Listing should NOT include full data blob
    expect(res.body[0]).not.toHaveProperty('data');
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('node_count');
  });

  it('GET /api/maps/:id - gets full map with data', async () => {
    const res = await request(app).get(`/api/maps/${createdMapId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.nodes).toHaveLength(1);
    expect(res.body.data.nodes[0].text).toBe('Central Topic');
  });

  it('GET /api/maps/:id - returns 404 for non-existent map', async () => {
    const res = await request(app)
      .get('/api/maps/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PUT /api/maps/:id - updates map title and data', async () => {
    const res = await request(app)
      .put(`/api/maps/${createdMapId}`)
      .send({
        title: 'Updated Title',
        data: {
          nodes: [
            { id: 'root-1', text: 'Updated Topic', collapsed: false, parent: null },
            { id: 'child-1', text: 'Child Node', collapsed: false, parent: 'root-1' }
          ],
          links: [{ source: 'root-1', target: 'child-1' }],
          notes: [],
          lastModified: new Date().toISOString()
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.node_count).toBe(2);
  });

  it('PUT /api/maps/:id - rejects empty body', async () => {
    const res = await request(app)
      .put(`/api/maps/${createdMapId}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('PUT /api/maps/:id - returns 404 for non-existent map', async () => {
    const res = await request(app)
      .put('/api/maps/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Ghost Map' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/maps/:id - deletes a map', async () => {
    const res = await request(app).delete(`/api/maps/${createdMapId}`);
    expect(res.status).toBe(204);

    const checkRes = await request(app).get(`/api/maps/${createdMapId}`);
    expect(checkRes.status).toBe(404);
  });

  it('DELETE /api/maps/:id - returns 404 for non-existent map', async () => {
    const res = await request(app)
      .delete('/api/maps/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
