import request from 'supertest'
import app from '../testServer'
import { TestDataSource } from '../setup'
import { MindMap, Node, CanvasState } from '../../src/entities'
import { cleanDatabase } from '../helpers/cleanDatabase'

describe('Canvas State API', () => {
  let testMindMapId: string
  let mindMapRepository: any
  let nodeRepository: any
  let canvasRepository: any

  beforeAll(async () => {
    // Get repositories after TestDataSource is initialized
    mindMapRepository = TestDataSource.getRepository(MindMap)
    nodeRepository = TestDataSource.getRepository(Node)
    canvasRepository = TestDataSource.getRepository(CanvasState)
    // Clean database and create test mindmap
    await cleanDatabase(TestDataSource)

    const mindMap = mindMapRepository.create({
      title: 'Test Mind Map for Canvas',
      description: 'Testing canvas state operations'
    })
    await mindMapRepository.save(mindMap)
    testMindMapId = mindMap.id
  })

  afterAll(async () => {
    // Cleanup is handled in setup.ts
  })

  describe('GET /api/mindmaps/:mindMapId/canvas', () => {
    it('should return default canvas state if none exists', async () => {
      const response = await request(app)
        .get(`/api/mindmaps/${testMindMapId}/canvas`)
        .expect(200)

      expect(response.body).toHaveProperty('zoom', 1.0)
      expect(response.body).toHaveProperty('panX', 0)
      expect(response.body).toHaveProperty('panY', 0)
      expect(response.body).toHaveProperty('mindMapId', testMindMapId)
    })

    it('should return existing canvas state', async () => {
      // Create canvas state
      const canvasState = canvasRepository.create({
        mindMapId: testMindMapId,
        zoom: 1.5,
        panX: 100,
        panY: -50
      })
      await canvasRepository.save(canvasState)

      const response = await request(app)
        .get(`/api/mindmaps/${testMindMapId}/canvas`)
        .expect(200)

      expect(response.body.zoom).toBe(1.5)
      expect(response.body.panX).toBe(100)
      expect(response.body.panY).toBe(-50)
    })

    it('should return 404 for non-existent mindmap', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await request(app)
        .get(`/api/mindmaps/${fakeId}/canvas`)
        .expect(404)
    })
  })

  describe('PUT /api/mindmaps/:mindMapId/canvas', () => {
    beforeEach(async () => {
      // Clear any existing canvas state  
      await canvasRepository.delete({ mindMapId: testMindMapId })
    })

    it('should create canvas state if it does not exist', async () => {
      const canvasUpdate = {
        zoom: 2.0,
        panX: 200,
        panY: 150
      }

      const response = await request(app)
        .put(`/api/mindmaps/${testMindMapId}/canvas`)
        .send(canvasUpdate)
        .expect(200)

      expect(response.body.zoom).toBe(canvasUpdate.zoom)
      expect(response.body.panX).toBe(canvasUpdate.panX)
      expect(response.body.panY).toBe(canvasUpdate.panY)
    })

    it('should update existing canvas state', async () => {
      // Create initial canvas state
      const canvasState = canvasRepository.create({
        mindMapId: testMindMapId,
        zoom: 1.0,
        panX: 0,
        panY: 0
      })
      await canvasRepository.save(canvasState)

      const canvasUpdate = {
        zoom: 0.75,
        panX: -100,
        panY: -100
      }

      const response = await request(app)
        .put(`/api/mindmaps/${testMindMapId}/canvas`)
        .send(canvasUpdate)
        .expect(200)

      expect(response.body.zoom).toBe(canvasUpdate.zoom)
      expect(response.body.panX).toBe(canvasUpdate.panX)
      expect(response.body.panY).toBe(canvasUpdate.panY)
    })

    it('should validate zoom range', async () => {
      const invalidZooms = [0, -1, 6]

      for (const zoom of invalidZooms) {
        const response = await request(app)
          .put(`/api/mindmaps/${testMindMapId}/canvas`)
          .send({ zoom })
          .expect(400)

        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toContain('zoom')
      }
    })

    it('should handle partial updates', async () => {
      // Create initial canvas state
      const canvasState = canvasRepository.create({
        mindMapId: testMindMapId,
        zoom: 1.5,
        panX: 100,
        panY: 200
      })
      await canvasRepository.save(canvasState)

      // Update only zoom
      const response = await request(app)
        .put(`/api/mindmaps/${testMindMapId}/canvas`)
        .send({ zoom: 2.0 })
        .expect(200)

      expect(response.body.zoom).toBe(2.0)
      expect(response.body.panX).toBe(100) // Should remain unchanged
      expect(response.body.panY).toBe(200) // Should remain unchanged
    })
  })

  describe('POST /api/mindmaps/:mindMapId/canvas/reset', () => {
    beforeEach(async () => {
      // Clear any existing canvas state
      await canvasRepository.delete({ mindMapId: testMindMapId })
    })

    it('should reset canvas state to defaults', async () => {
      // Create canvas state with non-default values
      const canvasState = canvasRepository.create({
        mindMapId: testMindMapId,
        zoom: 2.5,
        panX: 300,
        panY: -200
      })
      await canvasRepository.save(canvasState)

      const response = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/canvas/reset`)
        .expect(200)

      expect(response.body.zoom).toBe(1.0)
      expect(response.body.panX).toBe(0)
      expect(response.body.panY).toBe(0)
    })

    it('should center canvas on nodes when requested', async () => {
      // Create some nodes
      await nodeRepository.save([
        nodeRepository.create({
          mindMapId: testMindMapId,
          text: 'Node 1',
          positionX: -100,
          positionY: -100
        }),
        nodeRepository.create({
          mindMapId: testMindMapId,
          text: 'Node 2',
          positionX: 100,
          positionY: 100
        })
      ])

      const response = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/canvas/reset`)
        .send({ centerOnNodes: true })
        .expect(200)

      // Canvas should be centered on the nodes (center at 0,0)
      expect(response.body.panX).toBe(0)
      expect(response.body.panY).toBe(0)
      expect(response.body.zoom).toBe(1.0)
    })
  })
})