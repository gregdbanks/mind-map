import { Router } from 'express'
import mindmapRoutes from './mindmap.routes'
import nodeRoutes from './node.routes'
import individualNodeRoutes from './individualNode.routes'
import canvasRoutes from './canvas.routes'

const router = Router()

// API routes
router.use('/mindmaps', mindmapRoutes)
router.use('/mindmaps', nodeRoutes)
router.use('/mindmaps', canvasRoutes)
router.use('/nodes', individualNodeRoutes)

export default router