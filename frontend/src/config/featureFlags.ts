/**
 * Feature flag system for gradual PixiJS rollout
 */

export interface FeatureFlags {
  usePixiRenderer: boolean
  enablePerformanceMonitoring: boolean
  enableVisualRegressionTests: boolean
}

class FeatureFlagService {
  private static instance: FeatureFlagService
  private flags: FeatureFlags

  private constructor() {
    // Load flags from localStorage with defaults
    this.flags = {
      usePixiRenderer: this.getFlag('renderer') === 'pixi',
      enablePerformanceMonitoring: this.getFlag('performanceMonitoring') === 'true',
      enableVisualRegressionTests: this.getFlag('visualRegression') === 'true'
    }
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService()
    }
    return FeatureFlagService.instance
  }

  private getFlag(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  }

  private setFlag(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  }

  isPixiRendererEnabled(): boolean {
    return this.flags.usePixiRenderer
  }

  isPerformanceMonitoringEnabled(): boolean {
    return this.flags.enablePerformanceMonitoring
  }

  isVisualRegressionEnabled(): boolean {
    return this.flags.enableVisualRegressionTests
  }

  enablePixiRenderer(): void {
    this.flags.usePixiRenderer = true
    this.setFlag('renderer', 'pixi')
  }

  disablePixiRenderer(): void {
    this.flags.usePixiRenderer = false
    this.setFlag('renderer', 'konva')
  }

  togglePixiRenderer(): void {
    if (this.flags.usePixiRenderer) {
      this.disablePixiRenderer()
    } else {
      this.enablePixiRenderer()
    }
  }

  // Get percentage of users for gradual rollout
  getPixiRolloutPercentage(): number {
    const stored = this.getFlag('pixiRolloutPercentage')
    return stored ? parseInt(stored, 10) : 0
  }

  setPixiRolloutPercentage(percentage: number): void {
    this.setFlag('pixiRolloutPercentage', percentage.toString())
  }

  // Check if current user should use PixiJS based on rollout percentage
  shouldUsePixiBasedOnRollout(): boolean {
    const percentage = this.getPixiRolloutPercentage()
    if (percentage === 0) return false
    if (percentage === 100) return true

    // Generate consistent user ID for A/B testing
    const userId = this.getUserId()
    const hash = this.hashCode(userId)
    const userPercentage = Math.abs(hash) % 100

    return userPercentage < percentage
  }

  private getUserId(): string {
    let userId = this.getFlag('userId')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.setFlag('userId', userId)
    }
    return userId
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagService.getInstance()

// Export for testing
export { FeatureFlagService }