import { Router } from 'express'
import { getDataSource } from '../utils/dataSourceProvider'
import { Node } from '../entities'

const router = Router()

// Update a node
router.put('/:id', async (req, res) => {
  try {
    const nodeRepository = getDataSource().getRepository(Node)
    const { id } = req.params
    const updateData = req.body

    // Check if node exists
    const existing = await nodeRepository.findOne({ where: { id } })

    if (!existing) {
      return res.status(404).json({ error: 'Node not found' })
    }

    // Update the node
    Object.assign(existing, updateData)
    const node = await nodeRepository.save(existing)

    res.json(node)
  } catch (error) {
    console.error('Error updating node:', error)
    res.status(500).json({ error: 'Failed to update node' })
  }
})

// Delete a node and its children
router.delete('/:id', async (req, res) => {
  try {
    const nodeRepository = getDataSource().getRepository(Node)
    const { id } = req.params

    // Check if node exists
    const existing = await nodeRepository.findOne({ where: { id } })

    if (!existing) {
      return res.status(404).json({ error: 'Node not found' })
    }

    // Recursively delete the node and all its children
    await deleteNodeAndChildren(id)

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting node:', error)
    res.status(500).json({ error: 'Failed to delete node' })
  }
})

// Helper function to recursively delete nodes
async function deleteNodeAndChildren(nodeId: string) {
  const nodeRepository = getDataSource().getRepository(Node)
  
  // Find all children
  const children = await nodeRepository.find({
    where: { parentId: nodeId }
  })

  // Delete each child recursively
  for (const child of children) {
    await deleteNodeAndChildren(child.id)
  }

  // Delete the node itself
  await nodeRepository.delete({ id: nodeId })
}

export default router