import request from 'supertest';
import { app } from '../src/app';

describe('Maps API', () => {
  let createdMapId: string;

  it('POST /mindmaps - creates a new map', async () => {
    const res = await request(app)
      .post('/mindmaps')
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

  it('POST /mindmaps - rejects missing title', async () => {
    const res = await request(app)
      .post('/mindmaps')
      .send({ data: { nodes: [], links: [] } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title and data are required');
  });

  it('POST /mindmaps - rejects missing data', async () => {
    const res = await request(app)
      .post('/mindmaps')
      .send({ title: 'No Data Map' });

    expect(res.status).toBe(400);
  });

  it('GET /mindmaps - lists maps for user', async () => {
    const res = await request(app).get('/mindmaps');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('maps');
    expect(res.body).toHaveProperty('plan');
    expect(res.body).toHaveProperty('mapCount');
    expect(res.body).toHaveProperty('mapLimit');
    const { maps } = res.body;
    expect(Array.isArray(maps)).toBe(true);
    expect(maps.length).toBeGreaterThan(0);
    // Listing should NOT include full data blob
    expect(maps[0]).not.toHaveProperty('data');
    expect(maps[0]).toHaveProperty('title');
    expect(maps[0]).toHaveProperty('node_count');
  });

  it('GET /mindmaps/:id - gets full map with data', async () => {
    const res = await request(app).get(`/mindmaps/${createdMapId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.nodes).toHaveLength(1);
    expect(res.body.data.nodes[0].text).toBe('Central Topic');
  });

  it('GET /mindmaps/:id - returns 404 for non-existent map', async () => {
    const res = await request(app)
      .get('/mindmaps/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('PUT /mindmaps/:id - updates map title and data', async () => {
    const res = await request(app)
      .put(`/mindmaps/${createdMapId}`)
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

  it('PUT /mindmaps/:id - rejects empty body', async () => {
    const res = await request(app)
      .put(`/mindmaps/${createdMapId}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('PUT /mindmaps/:id - returns 404 for non-existent map', async () => {
    const res = await request(app)
      .put('/mindmaps/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Ghost Map' });
    expect(res.status).toBe(404);
  });

  it('DELETE /mindmaps/:id - deletes a map', async () => {
    const res = await request(app).delete(`/mindmaps/${createdMapId}`);
    expect(res.status).toBe(204);

    const checkRes = await request(app).get(`/mindmaps/${createdMapId}`);
    expect(checkRes.status).toBe(404);
  });

  it('DELETE /mindmaps/:id - returns 404 for non-existent map', async () => {
    const res = await request(app)
      .delete('/mindmaps/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
