import { DataSource } from 'typeorm'
import { AppDataSource } from './database'
import { TestDataSource } from '../../tests/setup'

export function getDataSource(): DataSource {
  if (process.env.NODE_ENV === 'test') {
    return TestDataSource
  }
  return AppDataSource
}