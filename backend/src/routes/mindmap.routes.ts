import { Router } from 'express'
import { getDataSource } from '../utils/dataSourceProvider'
import { MindMap } from '../entities'

const router = Router()

// Get all mindmaps
router.get('/', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const { page = 1, limit = 10 } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    
    if (req.query.page !== undefined && req.query.limit !== undefined) {
      // Paginated response
      const skip = (pageNum - 1) * limitNum
      const [data, total] = await mindMapRepository.findAndCount({
        skip,
        take: limitNum,
        order: { updatedAt: 'DESC' }
      })

      return res.json({
        data,
        total,
        page: pageNum,
        limit: limitNum
      })
    }

    // Non-paginated response
    const mindMaps = await mindMapRepository.find({
      order: { updatedAt: 'DESC' }
    })
    res.json(mindMaps)
  } catch (error) {
    console.error('Error fetching mindmaps:', error)
    res.status(500).json({ error: 'Failed to fetch mindmaps' })
  }
})

// Get single mindmap
router.get('/:id', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const { id } = req.params
    const { include } = req.query

    const relations = []
    if (include?.toString().includes('nodes')) {
      relations.push('nodes')
    }
    if (include?.toString().includes('canvas')) {
      relations.push('canvasState')
    }

    const mindMap = await mindMapRepository.findOne({
      where: { id },
      relations
    })

    if (!mindMap) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    res.json(mindMap)
  } catch (error) {
    console.error('Error fetching mindmap:', error)
    res.status(500).json({ error: 'Failed to fetch mindmap' })
  }
})

// Create mindmap
router.post('/', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const { title, description } = req.body

    if (!title) {
      return res.status(400).json({ error: 'title is required' })
    }

    const mindMap = mindMapRepository.create({
      title,
      description
    })

    await mindMapRepository.save(mindMap)

    res.status(201).json(mindMap)
  } catch (error) {
    console.error('Error creating mindmap:', error)
    res.status(500).json({ error: 'Failed to create mindmap' })
  }
})

// Update mindmap
router.put('/:id', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const { id } = req.params
    const { title, description, version } = req.body

    // Check if mindmap exists
    const existing = await mindMapRepository.findOne({ where: { id } })

    if (!existing) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    // Version checking for concurrent updates
    if (version !== undefined && existing.version !== version) {
      return res.status(409).json({ 
        error: 'Version mismatch - the mindmap has been updated by another user'
      })
    }

    // Update fields
    if (title !== undefined) existing.title = title
    if (description !== undefined) existing.description = description

    const mindMap = await mindMapRepository.save(existing)

    res.json(mindMap)
  } catch (error) {
    console.error('Error updating mindmap:', error)
    res.status(500).json({ error: 'Failed to update mindmap' })
  }
})

// Delete mindmap
router.delete('/:id', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const { id } = req.params

    // Check if mindmap exists
    const existing = await mindMapRepository.findOne({ where: { id } })

    if (!existing) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    // Delete mindmap (cascade will handle nodes and canvas state)
    await mindMapRepository.remove(existing)

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting mindmap:', error)
    res.status(500).json({ error: 'Failed to delete mindmap' })
  }
})

export default router