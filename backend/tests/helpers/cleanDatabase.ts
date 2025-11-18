import { DataSource } from 'typeorm'
import { CanvasState, Node, MindMap } from '../../src/entities'

export async function cleanDatabase(dataSource: DataSource) {
  const canvasRepository = dataSource.getRepository(CanvasState)
  const nodeRepository = dataSource.getRepository(Node)
  const mindMapRepository = dataSource.getRepository(MindMap)
  
  // Delete in correct order to respect foreign key constraints
  // First delete canvas states
  await canvasRepository.createQueryBuilder().delete().execute()
  
  // Then delete nodes
  await nodeRepository.createQueryBuilder().delete().execute()
  
  // Finally delete mind maps
  await mindMapRepository.createQueryBuilder().delete().execute()
}