import request from 'supertest'
import app from '../testServer'
import { TestDataSource } from '../setup'
import { MindMap, Node } from '../../src/entities'
import { cleanDatabase } from '../helpers/cleanDatabase'

describe('Node API', () => {
  let testMindMapId: string
  let mindMapRepository: any
  let nodeRepository: any

  beforeAll(async () => {
    // Get repositories after TestDataSource is initialized
    mindMapRepository = TestDataSource.getRepository(MindMap)
    nodeRepository = TestDataSource.getRepository(Node)
    // Clean database and create test mindmap
    await cleanDatabase(TestDataSource)

    const mindMap = mindMapRepository.create({
      title: 'Test Mind Map for Nodes',
      description: 'Testing node operations'
    })
    await mindMapRepository.save(mindMap)
    testMindMapId = mindMap.id
  })

  afterAll(async () => {
    // Cleanup is handled in setup.ts
  })

  describe('POST /api/mindmaps/:mindMapId/nodes', () => {
    it('should create a new node', async () => {
      const newNode = {
        text: 'Test Node',
        positionX: 100,
        positionY: 200,
        backgroundColor: '#ffffff',
        textColor: '#000000'
      }

      const response = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/nodes`)
        .send(newNode)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.text).toBe(newNode.text)
      expect(response.body.positionX).toBe(newNode.positionX)
      expect(response.body.positionY).toBe(newNode.positionY)
      expect(response.body.mindMapId).toBe(testMindMapId)
    })

    it('should create a child node with parent reference', async () => {
      // Create parent node first
      const parentResponse = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/nodes`)
        .send({
          text: 'Parent Node',
          positionX: 0,
          positionY: 0
        })
        .expect(201)

      const parentId = parentResponse.body.id

      // Create child node
      const childNode = {
        text: 'Child Node',
        positionX: 100,
        positionY: 100,
        parentId
      }

      const response = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/nodes`)
        .send(childNode)
        .expect(201)

      expect(response.body.parentId).toBe(parentId)
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/nodes`)
        .send({ text: 'Missing position' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('positionX')
    })

    it('should return 404 for non-existent mindmap', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await request(app)
        .post(`/api/mindmaps/${fakeId}/nodes`)
        .send({
          text: 'Test',
          positionX: 0,
          positionY: 0
        })
        .expect(404)
    })
  })

  describe('GET /api/mindmaps/:mindMapId/nodes', () => {
    beforeEach(async () => {
      // Clear nodes and create test data
      await nodeRepository.delete({ mindMapId: testMindMapId })

      // Create parent node
      const parentNode = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Parent Node',
        positionX: 0,
        positionY: 0
      })
      await nodeRepository.save(parentNode)

      // Create child nodes
      await nodeRepository.save([
        nodeRepository.create({
          mindMapId: testMindMapId,
          text: 'Child 1',
          positionX: 100,
          positionY: 0,
          parentId: parentNode.id
        }),
        nodeRepository.create({
          mindMapId: testMindMapId,
          text: 'Child 2',
          positionX: -100,
          positionY: 0,
          parentId: parentNode.id
        })
      ])
    })

    it('should return all nodes for a mindmap', async () => {
      const response = await request(app)
        .get(`/api/mindmaps/${testMindMapId}/nodes`)
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body.length).toBe(3)
      expect(response.body[0]).toHaveProperty('id')
      expect(response.body[0]).toHaveProperty('text')
      expect(response.body[0]).toHaveProperty('positionX')
      expect(response.body[0]).toHaveProperty('positionY')
    })

    it('should return hierarchical structure when requested', async () => {
      const response = await request(app)
        .get(`/api/mindmaps/${testMindMapId}/nodes?hierarchical=true`)
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      // Should only return root nodes
      const rootNodes = response.body.filter((node: any) => !node.parentId)
      expect(rootNodes.length).toBe(1)
      expect(rootNodes[0]).toHaveProperty('children')
      expect(rootNodes[0].children).toBeInstanceOf(Array)
      expect(rootNodes[0].children.length).toBe(2)
    })
  })

  describe('PUT /api/nodes/:id', () => {
    let testNodeId: string

    beforeEach(async () => {
      const node = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Original Text',
        positionX: 0,
        positionY: 0,
        backgroundColor: '#ffffff',
        textColor: '#000000'
      })
      await nodeRepository.save(node)
      testNodeId = node.id
    })

    it('should update a node', async () => {
      const updates = {
        text: 'Updated Text',
        positionX: 150,
        positionY: 250,
        backgroundColor: '#ff0000',
        fontSize: 16
      }

      const response = await request(app)
        .put(`/api/nodes/${testNodeId}`)
        .send(updates)
        .expect(200)

      expect(response.body.text).toBe(updates.text)
      expect(response.body.positionX).toBe(updates.positionX)
      expect(response.body.positionY).toBe(updates.positionY)
      expect(response.body.backgroundColor).toBe(updates.backgroundColor)
      expect(response.body.fontSize).toBe(updates.fontSize)
    })

    it('should handle node reparenting', async () => {
      // Create a new parent node
      const newParent = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'New Parent',
        positionX: 200,
        positionY: 200
      })
      await nodeRepository.save(newParent)

      const response = await request(app)
        .put(`/api/nodes/${testNodeId}`)
        .send({ parentId: newParent.id })
        .expect(200)

      expect(response.body.parentId).toBe(newParent.id)
    })

    it('should toggle collapsed state', async () => {
      const response = await request(app)
        .put(`/api/nodes/${testNodeId}`)
        .send({ collapsed: true })
        .expect(200)

      expect(response.body.collapsed).toBe(true)
    })

    it('should return 404 for non-existent node', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await request(app)
        .put(`/api/nodes/${fakeId}`)
        .send({ text: 'Update' })
        .expect(404)
    })
  })

  describe('DELETE /api/nodes/:id', () => {
    it('should delete a node and its children', async () => {
      // Create node hierarchy
      const parent = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Parent to delete',
        positionX: 0,
        positionY: 0
      })
      await nodeRepository.save(parent)

      const child = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Child to delete',
        positionX: 100,
        positionY: 100,
        parentId: parent.id
      })
      await nodeRepository.save(child)

      const grandchild = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Grandchild to delete',
        positionX: 200,
        positionY: 200,
        parentId: child.id
      })
      await nodeRepository.save(grandchild)

      // Delete parent node
      await request(app)
        .delete(`/api/nodes/${parent.id}`)
        .expect(204)

      // Verify all nodes in hierarchy are deleted
      const deletedParent = await nodeRepository.findOne({ where: { id: parent.id } })
      const deletedChild = await nodeRepository.findOne({ where: { id: child.id } })
      const deletedGrandchild = await nodeRepository.findOne({ where: { id: grandchild.id } })

      expect(deletedParent).toBeNull()
      expect(deletedChild).toBeNull()
      expect(deletedGrandchild).toBeNull()
    })

    it('should return 404 for non-existent node', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await request(app)
        .delete(`/api/nodes/${fakeId}`)
        .expect(404)
    })
  })

  describe('POST /api/nodes/:id/batch-update', () => {
    it('should update multiple nodes positions', async () => {
      // Create test nodes
      const node1 = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Node 1',
        positionX: 0,
        positionY: 0
      })
      await nodeRepository.save(node1)

      const node2 = nodeRepository.create({
        mindMapId: testMindMapId,
        text: 'Node 2',
        positionX: 100,
        positionY: 100
      })
      await nodeRepository.save(node2)

      const updates = [
        { id: node1.id, positionX: 50, positionY: 50 },
        { id: node2.id, positionX: 150, positionY: 150 }
      ]

      const response = await request(app)
        .post(`/api/mindmaps/${testMindMapId}/nodes/batch-update`)
        .send({ updates })
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body.length).toBe(2)
      expect(response.body.find((n: any) => n.id === node1.id)?.positionX).toBe(50)
      expect(response.body.find((n: any) => n.id === node2.id)?.positionX).toBe(150)
    })
  })
})