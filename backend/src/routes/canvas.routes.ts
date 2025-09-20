import { Router } from 'express'
import { getDataSource } from '../utils/dataSourceProvider'
import { CanvasState, MindMap, Node } from '../entities'

const router = Router()

// Get canvas state for a mindmap
router.get('/:mindMapId/canvas', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const canvasRepository = getDataSource().getRepository(CanvasState)
    const { mindMapId } = req.params

    // Check if mindmap exists
    const mindMapExists = await mindMapRepository.findOne({ where: { id: mindMapId } })

    if (!mindMapExists) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    // Get canvas state
    let canvasState = await canvasRepository.findOne({
      where: { mindMapId }
    })

    // Return default state if none exists
    if (!canvasState) {
      return res.json({
        zoom: 1.0,
        panX: 0,
        panY: 0,
        mindMapId
      })
    }

    res.json(canvasState)
  } catch (error) {
    console.error('Error fetching canvas state:', error)
    res.status(500).json({ error: 'Failed to fetch canvas state' })
  }
})

// Update canvas state
router.put('/:mindMapId/canvas', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const canvasRepository = getDataSource().getRepository(CanvasState)
    const { mindMapId } = req.params
    const { zoom, panX, panY } = req.body

    // Validate zoom range
    if (zoom !== undefined && (zoom <= 0 || zoom > 5)) {
      return res.status(400).json({ error: 'zoom must be between 0.1 and 5' })
    }

    // Check if mindmap exists
    const mindMapExists = await mindMapRepository.findOne({ where: { id: mindMapId } })

    if (!mindMapExists) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    // Check if canvas state exists
    let existing = await canvasRepository.findOne({
      where: { mindMapId }
    })

    let canvasState
    if (existing) {
      // Update existing
      if (zoom !== undefined) existing.zoom = zoom
      if (panX !== undefined) existing.panX = panX
      if (panY !== undefined) existing.panY = panY
      canvasState = await canvasRepository.save(existing)
    } else {
      // Create new
      canvasState = canvasRepository.create({
        mindMapId,
        zoom: zoom ?? 1.0,
        panX: panX ?? 0,
        panY: panY ?? 0
      })
      canvasState = await canvasRepository.save(canvasState)
    }

    res.json(canvasState)
  } catch (error) {
    console.error('Error updating canvas state:', error)
    res.status(500).json({ error: 'Failed to update canvas state' })
  }
})

// Reset canvas state
router.post('/:mindMapId/canvas/reset', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const canvasRepository = getDataSource().getRepository(CanvasState)
    const nodeRepository = getDataSource().getRepository(Node)
    const { mindMapId } = req.params
    const { centerOnNodes } = req.body || {}

    // Check if mindmap exists
    const mindMapExists = await mindMapRepository.findOne({ where: { id: mindMapId } })

    if (!mindMapExists) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    let zoom = 1.0
    let panX = 0
    let panY = 0

    if (centerOnNodes) {
      // Calculate center of all nodes
      const nodes = await nodeRepository.find({
        where: { mindMapId }
      })

      if (nodes.length > 0) {
        const avgX = nodes.reduce((sum, node) => sum + node.positionX, 0) / nodes.length
        const avgY = nodes.reduce((sum, node) => sum + node.positionY, 0) / nodes.length
        panX = -avgX
        panY = -avgY
      }
    }

    // Update or create canvas state
    let canvasState = await canvasRepository.findOne({ where: { mindMapId } })
    
    if (canvasState) {
      canvasState.zoom = zoom
      canvasState.panX = panX
      canvasState.panY = panY
    } else {
      canvasState = canvasRepository.create({ mindMapId, zoom, panX, panY })
    }
    
    await canvasRepository.save(canvasState)

    res.json(canvasState)
  } catch (error) {
    console.error('Error resetting canvas state:', error)
    res.status(500).json({ error: 'Failed to reset canvas state' })
  }
})

export default router