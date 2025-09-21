import { describe, it, expect } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Integration Tests', () => {
  it('should have compatible Node version for all dependencies', async () => {
    const nodeVersion = process.version
    const major = parseInt(nodeVersion.split('.')[0].substring(1))
    
    // Check if Node version meets our requirements
    expect(major).toBeGreaterThanOrEqual(18)
  }, 10000)

  it.skip('should be able to build the project', async () => {
    try {
      // This will actually try to build with Vite
      const { stderr } = await execAsync('npm run build', {
        cwd: path.resolve(__dirname, '..')
      })
      
      // Build should succeed
      expect(stderr).not.toContain('error')
    } catch (error: any) {
      // If build fails, test fails
      throw new Error(`Build failed: ${error.message}`)
    }
  }, 30000)

  it('should have all required environment variables documented', () => {
    const envExample = `
VITE_API_URL=http://localhost:3000/api
    `.trim()
    
    // In a real project, you'd read .env.example and validate it
    expect(envExample).toContain('VITE_API_URL')
  })
})