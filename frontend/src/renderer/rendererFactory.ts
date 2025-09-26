import { RendererAPI, RendererFactory } from './types'
import { PixiRenderer } from './PixiRenderer'
import { KonvaRenderer } from './KonvaRenderer'
import { getFeatureFlags } from '../config/featureFlags'

// Renderer registry
const rendererRegistry: Record<string, RendererFactory> = {
  pixi: () => new PixiRenderer(),
  konva: () => new KonvaRenderer()
}

/**
 * Create a renderer instance based on feature flags and configuration
 */
export function createRenderer(): RendererAPI {
  const flags = getFeatureFlags()
  
  // Check if PixiJS renderer should be used
  if (flags.usePixiRenderer) {
    try {
      return rendererRegistry.pixi()
    } catch (error) {
      console.error('Failed to create PixiJS renderer, falling back to Konva:', error)
      return rendererRegistry.konva()
    }
  }
  
  // Default to Konva renderer
  return rendererRegistry.konva()
}

/**
 * Register a custom renderer
 */
export function registerRenderer(name: string, factory: RendererFactory): void {
  rendererRegistry[name] = factory
}

/**
 * Get available renderer names
 */
export function getAvailableRenderers(): string[] {
  return Object.keys(rendererRegistry)
}

/**
 * Create a specific renderer by name
 */
export function createRendererByName(name: string): RendererAPI {
  const factory = rendererRegistry[name]
  if (!factory) {
    throw new Error(`Renderer "${name}" not found. Available renderers: ${getAvailableRenderers().join(', ')}`)
  }
  return factory()
}