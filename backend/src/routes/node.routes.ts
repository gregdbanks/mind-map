import { Router } from 'express'
import { getDataSource } from '../utils/dataSourceProvider'
import { Node, MindMap } from '../entities'

const router = Router()

// Get all nodes for a mindmap
router.get('/:mindMapId/nodes', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const nodeRepository = getDataSource().getRepository(Node)
    const { mindMapId } = req.params
    const { hierarchical } = req.query

    // Check if mindmap exists
    const mindMapExists = await mindMapRepository.findOne({ where: { id: mindMapId } })

    if (!mindMapExists) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    if (hierarchical === 'true') {
      // Return hierarchical structure - get all nodes and build tree in memory
      const allNodes = await nodeRepository.find({
        where: { mindMapId },
        order: { createdAt: 'ASC' }
      })

      // Build tree structure
      type NodeWithChildren = Node & { children: NodeWithChildren[] }
      const nodeMap = new Map<string, NodeWithChildren>(
        allNodes.map(node => [node.id, { ...node, children: [] }])
      )
      const rootNodes: NodeWithChildren[] = []

      allNodes.forEach(node => {
        const currentNode = nodeMap.get(node.id)
        if (!currentNode) return
        
        if (node.parentId) {
          const parent = nodeMap.get(node.parentId)
          if (parent) {
            parent.children.push(currentNode)
          }
        } else {
          rootNodes.push(currentNode)
        }
      })

      return res.json(rootNodes)
    }

    // Return flat list
    const nodes = await nodeRepository.find({
      where: { mindMapId },
      order: { createdAt: 'ASC' }
    })

    res.json(nodes)
  } catch (error) {
    console.error('Error fetching nodes:', error)
    res.status(500).json({ error: 'Failed to fetch nodes' })
  }
})

// Create a new node
router.post('/:mindMapId/nodes', async (req, res) => {
  try {
    const mindMapRepository = getDataSource().getRepository(MindMap)
    const nodeRepository = getDataSource().getRepository(Node)
    const { mindMapId } = req.params
    const { text, positionX, positionY, parentId, ...otherProps } = req.body

    // Validate required fields
    if (!text || positionX === undefined || positionY === undefined) {
      return res.status(400).json({ 
        error: 'text, positionX, and positionY are required' 
      })
    }

    // Check if mindmap exists
    const mindMapExists = await mindMapRepository.findOne({ where: { id: mindMapId } })

    if (!mindMapExists) {
      return res.status(404).json({ error: 'MindMap not found' })
    }

    // Create the node
    const node = nodeRepository.create({
      mindMapId,
      text,
      positionX,
      positionY,
      parentId,
      ...otherProps
    })

    await nodeRepository.save(node)

    res.status(201).json(node)
  } catch (error) {
    console.error('Error creating node:', error)
    res.status(500).json({ error: 'Failed to create node' })
  }
})

// Batch update nodes
router.post('/:mindMapId/nodes/batch-update', async (req, res) => {
  try {
    const { updates } = req.body

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates array is required' })
    }

    // Update nodes in a transaction
    const updatedNodes = await getDataSource().transaction(async manager => {
      const results = []
      
      for (const update of updates) {
        const { id, ...updateData } = update
        const node = await manager.findOne(Node, { where: { id } })
        
        if (node) {
          Object.assign(node, updateData)
          results.push(await manager.save(node))
        }
      }
      
      return results
    })

    res.json(updatedNodes)
  } catch (error) {
    console.error('Error batch updating nodes:', error)
    res.status(500).json({ error: 'Failed to batch update nodes' })
  }
})

export default router