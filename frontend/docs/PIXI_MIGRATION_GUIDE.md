# PixiJS Migration Guide

This guide helps developers migrate from React-Konva to the new PixiJS renderer for the Mind Map application.

## Table of Contents
1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Feature Flag Configuration](#feature-flag-configuration)
4. [Component Migration](#component-migration)
5. [Testing Strategy](#testing-strategy)
6. [Performance Monitoring](#performance-monitoring)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

## Overview

The PixiJS migration introduces a high-performance WebGL-based renderer to replace the existing React-Konva implementation. This migration is designed to be gradual and safe with automatic rollback capabilities.

### Key Benefits
- **60 FPS performance** with 500+ nodes
- **WebGL acceleration** with Canvas2D fallback
- **50-100% performance improvement** in most scenarios
- **Reduced memory usage** through texture atlasing
- **Better mobile performance** with automatic optimizations

### Migration Timeline
1. **Phase 1**: Core renderer implementation ✅
2. **Phase 2**: React integration layer ✅
3. **Phase 3**: Performance optimizations ✅
4. **Phase 4**: Gradual rollout with feature flags
5. **Phase 5**: Full migration and deprecation

## Architecture Changes

### Before (React-Konva)
```
React Components
    ↓
React-Konva Layer
    ↓
Konva.js Canvas
```

### After (PixiJS)
```
React Components
    ↓
PixiMindMapAdapter
    ↓
RendererAPI Interface
    ↓
PixiJS WebGL/Canvas
```

### Key Differences
1. **Decoupled Architecture**: Renderer is now independent of React
2. **Unified API**: Common interface for both renderers
3. **Event System**: Custom event handling for better performance
4. **State Sync**: Automatic synchronization with Redux/Zustand store

## Feature Flag Configuration

### Basic Setup
```typescript
// src/config/featureFlags.ts
export const featureFlags = {
  usePixiRenderer: false, // Enable PixiJS renderer
  enablePerformanceMonitoring: true, // Enable performance overlay
  enableVisualRegressionTests: false // Enable visual testing
}
```

### Gradual Rollout
```typescript
// Enable for specific users (A/B testing)
const flags = getFeatureFlags()
if (flags.usePixiRenderer) {
  // User gets PixiJS renderer
} else {
  // User gets Konva renderer
}
```

### Environment-based Configuration
```bash
# .env.development
REACT_APP_USE_PIXI_RENDERER=true
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true

# .env.production
REACT_APP_USE_PIXI_RENDERER=false
REACT_APP_ROLLOUT_PERCENTAGE=10
```

## Component Migration

### Step 1: Update Mind Map Component
Replace direct Konva usage with the renderer-agnostic component:

```typescript
// Before
import { KonvaMindMap } from './components/KonvaMindMap'

function App() {
  return <KonvaMindMap mindMapId="main" />
}

// After
import { MindMapRenderer } from './components/mindMap/MindMapRenderer'

function App() {
  return <MindMapRenderer mindMapId="main" />
}
```

### Step 2: Update Event Handlers
Migrate from Konva events to the unified event system:

```typescript
// Before
<Circle
  onClick={(e) => handleNodeClick(e.target)}
  onDragEnd={(e) => handleDragEnd(e.target)}
/>

// After
const handleEvents = {
  onNodeClick: (nodeId: string) => {
    // Handle click
  },
  onNodeDragEnd: (nodeId: string, position: { x: number, y: number }) => {
    // Handle drag
  }
}

<PixiMindMapAdapter {...handleEvents} />
```

### Step 3: Update Styles
Migrate from Konva styling to the unified style system:

```typescript
// Before
node.setAttrs({
  fill: 'red',
  fontSize: 16,
  fontFamily: 'Arial'
})

// After
updateNode(nodeId, {
  style: {
    color: '#ff0000',
    fontSize: 16,
    fontFamily: 'Arial'
  }
})
```

## Testing Strategy

### 1. Unit Tests
All renderer functionality is covered by unit tests:
```bash
npm test src/renderer
```

### 2. Integration Tests
Test the complete flow with Playwright:
```bash
npm run test:e2e
```

### 3. Visual Regression Tests
Ensure pixel-perfect rendering with Percy:
```bash
npm run test:visual
```

### 4. Performance Tests
Validate performance improvements:
```bash
npm run test:performance
```

### Test Checklist
- [ ] All existing tests pass
- [ ] Performance benchmarks meet targets
- [ ] Visual regression tests show no unexpected changes
- [ ] Memory usage is within bounds
- [ ] Mobile devices perform well

## Performance Monitoring

### Enable Performance Overlay
Press `F12` to toggle the performance overlay showing:
- FPS (Frames Per Second)
- Frame time (milliseconds)
- Node count (visible/total)
- Draw calls
- Memory usage

### Monitoring Hooks
```typescript
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring'

function MindMap() {
  const { performanceData, checkPerformanceIssues } = usePerformanceMonitoring()
  
  useEffect(() => {
    const issues = checkPerformanceIssues()
    if (issues.length > 0) {
      console.warn('Performance issues:', issues)
    }
  }, [performanceData])
}
```

### Performance Targets
- **FPS**: ≥ 60 with 500 nodes
- **Frame Time**: ≤ 16.67ms
- **Memory**: < 50MB for 1000 nodes
- **Initial Render**: < 100ms

## Rollback Procedures

### Automatic Rollback
The system automatically rolls back if:
- FPS drops below 30 for more than 2 seconds
- More than 5 errors occur within a minute
- WebGL context is lost and cannot be restored
- Memory usage exceeds 200MB

### Manual Rollback
```typescript
// Option 1: Feature flag
setFeatureFlag('usePixiRenderer', false)

// Option 2: Local storage
localStorage.setItem('renderer', 'konva')

// Option 3: URL parameter
?renderer=konva
```

### Monitoring Rollbacks
```typescript
const rollbackManager = new RollbackManager({
  onRollback: (from, to, reason) => {
    // Log to analytics
    analytics.track('renderer_rollback', { from, to, reason })
  }
})
```

## Troubleshooting

### Common Issues

#### 1. WebGL Context Lost
**Symptoms**: Blank canvas, "WebGL context lost" error
**Solution**: 
- Renderer automatically falls back to Canvas2D
- Reduce number of nodes
- Check GPU driver updates

#### 2. Poor Performance
**Symptoms**: Low FPS, stuttering
**Solutions**:
- Enable viewport culling
- Reduce node count
- Check for memory leaks
- Disable unnecessary visual effects

#### 3. Visual Differences
**Symptoms**: Nodes look different between renderers
**Solutions**:
- Run visual regression tests
- Check font loading
- Verify color space settings
- Update styles to match

#### 4. Memory Leaks
**Symptoms**: Increasing memory usage over time
**Solutions**:
- Ensure proper cleanup in useEffect
- Check texture disposal
- Monitor with Chrome DevTools

### Debug Mode
Enable debug mode for detailed logging:
```typescript
localStorage.setItem('debug', 'renderer:*')
```

### Support Channels
- GitHub Issues: Report bugs and issues
- Slack: #renderer-migration channel
- Documentation: /docs/renderer-api.md

## Migration Checklist

### Pre-Migration
- [ ] Review current Konva implementation
- [ ] Identify custom Konva features in use
- [ ] Set up feature flags
- [ ] Configure monitoring

### During Migration
- [ ] Update components to use MindMapRenderer
- [ ] Migrate event handlers
- [ ] Update styles and animations
- [ ] Run all tests

### Post-Migration
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any rollbacks
- [ ] Plan Konva deprecation

## Best Practices

1. **Gradual Rollout**: Start with 5-10% of users
2. **Monitor Actively**: Watch metrics during rollout
3. **Have Rollback Plan**: Know how to quickly revert
4. **Test Thoroughly**: Especially on target devices
5. **Communicate**: Keep users informed of changes

## Future Enhancements

- **WebGPU Support**: Next-generation GPU API
- **WASM Optimization**: Critical path optimization
- **Progressive Enhancement**: Better mobile experience
- **3D Capabilities**: Potential 3D mind maps