import { DataSource } from 'typeorm'
import { MindMap, Node, CanvasState } from '../entities'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'mindmap_user',
  password: 'mindmap_pass',
  database: process.env.NODE_ENV === 'test' ? 'mindmap_test' : 'mindmap_dev',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [MindMap, Node, CanvasState],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
})