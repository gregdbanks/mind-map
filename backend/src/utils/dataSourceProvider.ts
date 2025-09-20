import { DataSource } from 'typeorm'

let currentDataSource: DataSource

export function setDataSource(dataSource: DataSource) {
  currentDataSource = dataSource
}

export function getDataSource(): DataSource {
  if (!currentDataSource) {
    throw new Error('Data source not initialized')
  }
  return currentDataSource
}