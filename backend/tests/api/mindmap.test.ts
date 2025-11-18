import request from 'supertest'
import app from '../testServer'
import { TestDataSource } from '../setup'
import { MindMap, Node } from '../../src/entities'
import { cleanDatabase } from '../helpers/cleanDatabase'

describe('MindMap API', () => {
  let mindMapRepository: any
  let nodeRepository: any

  beforeAll(async () => {
    // Get repositories after TestDataSource is initialized
    mindMapRepository = TestDataSource.getRepository(MindMap)
    nodeRepository = TestDataSource.getRepository(Node)
  })

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase(TestDataSource)
  })

  afterAll(async () => {
    // Cleanup is handled in setup.ts
  })

  describe('POST /api/mindmaps', () => {
    it('should create a new mindmap', async () => {
      const newMindMap = {
        title: 'Test Mind Map',
        description: 'A test mind map'
      }

      const response = await request(app)
        .post('/api/mindmaps')
        .send(newMindMap)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.title).toBe(newMindMap.title)
      expect(response.body.description).toBe(newMindMap.description)
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body.version).toBe(1)
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/mindmaps')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('title')
    })
  })

  describe('GET /api/mindmaps', () => {
    beforeEach(async () => {
      // Create test data
      await mindMapRepository.save([
        mindMapRepository.create({ title: 'Mind Map 1', description: 'First map' }),
        mindMapRepository.create({ title: 'Mind Map 2', description: 'Second map' }),
        mindMapRepository.create({ title: 'Mind Map 3', description: 'Third map' })
      ])
    })

    it('should return all mindmaps', async () => {
      const response = await request(app)
        .get('/api/mindmaps')
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body.length).toBeGreaterThanOrEqual(3)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('title')
      expect(response.body[0]).toHaveProperty('description')
    })

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/mindmaps?page=1&limit=2')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('page')
      expect(response.body).toHaveProperty('limit')
      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })
  })

  describe('GET /api/mindmaps/:id', () => {
    let testMindMapId: string

    beforeEach(async () => {
      const mindMap = mindMapRepository.create({
        title: 'Test Mind Map',
        description: 'Test description'
      })
      await mindMapRepository.save(mindMap)
      testMindMapId = mindMap.id
    })

    it('should return a specific mindmap', async () => {
      const response = await request(app)
        .get(`/api/mindmaps/${testMindMapId}`)
        .expect(200)

      expect(response.body.id).toBe(testMindMapId)
      expect(response.body.title).toBe('Test Mind Map')
    })

    it('should return 404 for non-existent mindmap', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .get(`/api/mindmaps/${fakeId}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should include nodes when requested', async () => {
      // Create test nodes
      await nodeRepository.save([
        nodeRepository.create({
          mindMapId: testMindMapId,
          text: 'Root Node',
          positionX: 0,
          positionY: 0
        }),
        nodeRepository.create({
          mindMapId: testMindMapId,
          text: 'Child Node',
          positionX: 100,
          positionY: 100
        })
      ])

      const response = await request(app)
        .get(`/api/mindmaps/${testMindMapId}?include=nodes`)
        .expect(200)

      expect(response.body.nodes).toBeInstanceOf(Array)
      expect(response.body.nodes.length).toBe(2)
    })
  })

  describe('PUT /api/mindmaps/:id', () => {
    let testMindMapId: string

    beforeEach(async () => {
      const mindMap = mindMapRepository.create({
        title: 'Original Title',
        description: 'Original description'
      })
      await mindMapRepository.save(mindMap)
      testMindMapId = mindMap.id
    })

    it('should update a mindmap', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      }

      const response = await request(app)
        .put(`/api/mindmaps/${testMindMapId}`)
        .send(updates)
        .expect(200)

      expect(response.body.title).toBe(updates.title)
      expect(response.body.description).toBe(updates.description)
      expect(response.body.version).toBe(2)
    })

    it('should handle concurrent updates with version checking', async () => {
      const updates1 = { title: 'Update 1', version: 1 }
      const updates2 = { title: 'Update 2', version: 1 }

      // First update should succeed
      await request(app)
        .put(`/api/mindmaps/${testMindMapId}`)
        .send(updates1)
        .expect(200)

      // Second update with same version should fail
      const response = await request(app)
        .put(`/api/mindmaps/${testMindMapId}`)
        .send(updates2)
        .expect(409)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.toLowerCase()).toContain('version')
    })
  })

  describe('DELETE /api/mindmaps/:id', () => {
    let testMindMapId: string

    beforeEach(async () => {
      const mindMap = mindMapRepository.create({
        title: 'To Delete',
        description: 'Will be deleted'
      })
      await mindMapRepository.save(mindMap)
      testMindMapId = mindMap.id
    })

    it('should delete a mindmap and cascade to nodes', async () => {
      // Create associated nodes
      const node = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Node to delete',
        positionX: 0,
        positionY: 0
      })
      await nodeRepository.save(node)

      await request(app)
        .delete(`/api/mindmaps/${testMindMapId}`)
        .expect(204)

      // Verify mindmap is deleted
      const mindMap = await mindMapRepository.findOne({
        where: { id: testMindMapId }
      })
      expect(mindMap).toBeNull()

      // Verify nodes are deleted
      const nodes = await nodeRepository.find({
        where: { mindMapId: testMindMapId }
      })
      expect(nodes).toHaveLength(0)
    })

    it('should return 404 for non-existent mindmap', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await request(app)
        .delete(`/api/mindmaps/${fakeId}`)
        .expect(404)
    })
  })
})