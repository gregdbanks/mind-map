import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { E2ETestSetup } from './setup'

const API_URL = 'http://localhost:3002/api'

describe('Mind Map E2E Tests', () => {
  const setup = new E2ETestSetup()

  beforeAll(async () => {
    await setup.setup()
  }, 30000)

  afterAll(async () => {
    await setup.teardown()
  })

  it('should create, read, update, and delete a mind map', async () => {
    // Create mind map
    const createResponse = await fetch(`${API_URL}/mindmaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Mind Map',
        description: 'Testing with real database',
      }),
    })
    
    expect(createResponse.status).toBe(201)
    const mindMap = await createResponse.json()
    expect(mindMap.title).toBe('E2E Test Mind Map')
    expect(mindMap.id).toBeTruthy()

    // Get mind map
    const getResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}`)
    expect(getResponse.status).toBe(200)
    const fetchedMindMap = await getResponse.json()
    expect(fetchedMindMap.title).toBe('E2E Test Mind Map')

    // Update mind map
    const updateResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated E2E Test',
        version: mindMap.version,
      }),
    })
    expect(updateResponse.status).toBe(200)
    const updatedMindMap = await updateResponse.json()
    expect(updatedMindMap.title).toBe('Updated E2E Test')
    expect(updatedMindMap.version).toBe(2)

    // Delete mind map
    const deleteResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}`, {
      method: 'DELETE',
    })
    expect(deleteResponse.status).toBe(204)

    // Verify deletion
    const verifyResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}`)
    expect(verifyResponse.status).toBe(404)
  })

  it('should handle nodes and relationships', async () => {
    // Create mind map
    const mindMapResponse = await fetch(`${API_URL}/mindmaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Node Test Mind Map',
      }),
    })
    const mindMap = await mindMapResponse.json()

    // Create parent node
    const parentResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Parent Node',
        positionX: 400,
        positionY: 300,
      }),
    })
    const parentNode = await parentResponse.json()
    expect(parentNode.text).toBe('Parent Node')

    // Create child node
    const childResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Child Node',
        positionX: 600,
        positionY: 300,
        parentId: parentNode.id,
      }),
    })
    const childNode = await childResponse.json()
    expect(childNode.parentId).toBe(parentNode.id)

    // Get hierarchical nodes
    const hierarchicalResponse = await fetch(
      `${API_URL}/mindmaps/${mindMap.id}/nodes?hierarchical=true`
    )
    const nodes = await hierarchicalResponse.json()
    expect(nodes).toHaveLength(1) // Only parent at root
    expect(nodes[0].children).toHaveLength(1)
    expect(nodes[0].children[0].id).toBe(childNode.id)

    // Cleanup
    await fetch(`${API_URL}/mindmaps/${mindMap.id}`, { method: 'DELETE' })
  })

  it('should handle canvas state', async () => {
    // Create mind map
    const mindMapResponse = await fetch(`${API_URL}/mindmaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Canvas Test Mind Map',
      }),
    })
    const mindMap = await mindMapResponse.json()

    // Get initial canvas state
    const canvasResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}/canvas`)
    const canvas = await canvasResponse.json()
    expect(canvas.zoom).toBe(1)
    expect(canvas.panX).toBe(0)
    expect(canvas.panY).toBe(0)

    // Update canvas state
    const updateResponse = await fetch(`${API_URL}/mindmaps/${mindMap.id}/canvas`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoom: 1.5,
        panX: 100,
        panY: 50,
      }),
    })
    const updatedCanvas = await updateResponse.json()
    expect(updatedCanvas.zoom).toBe(1.5)
    expect(updatedCanvas.panX).toBe(100)

    // Cleanup
    await fetch(`${API_URL}/mindmaps/${mindMap.id}`, { method: 'DELETE' })
  })
})