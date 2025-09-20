import { spawn } from 'child_process'
import { DataSource } from 'typeorm'

export class E2ETestSetup {
  private backendProcess: any
  private dataSource: DataSource

  async setup() {
    // Connect to test database
    this.dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'mindmap',
      password: 'mindmap',
      database: 'mindmap_test', // Use separate test database
      synchronize: true,
      dropSchema: true, // Clean database before each test run
      entities: ['../backend/src/entities/*.ts'],
    })

    await this.dataSource.initialize()
    console.log('Test database initialized')

    // Start backend server
    return new Promise<void>((resolve) => {
      this.backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: '../backend',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT: '3002',
          DB_NAME: 'mindmap_test',
        },
      })

      this.backendProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString()
        if (output.includes('Server running')) {
          resolve()
        }
      })

      this.backendProcess.stderr.on('data', (data: Buffer) => {
        console.error('Backend error:', data.toString())
      })
    })
  }

  async teardown() {
    // Clean up
    if (this.backendProcess) {
      this.backendProcess.kill()
    }
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy()
    }
  }
}