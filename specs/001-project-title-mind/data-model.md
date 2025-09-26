# Data Model: PixiJS Canvas Components

**Feature**: PixiJS Canvas Migration  
**Version**: 1.0.0  
**Date**: 2025-09-24

## Entity Definitions

### 1. PixiRenderer
**Purpose**: Main rendering engine managing the PixiJS application instance

**Properties**:
```typescript
interface PixiRenderer {
  id: string                    // Unique renderer instance ID
  app: PIXI.Application        // PixiJS application instance  
  viewport: Viewport           // Current view state
  nodes: Map<string, PixiNode> // Node graphics cache
  connections: Map<string, PixiConnection> // Connection graphics cache
  interactionManager: InteractionManager // Handle user inputs
  performanceMonitor: PerformanceMonitor // Track FPS and metrics
}
```

**State Transitions**:
- `uninitialized` → `initializing` → `ready` → `rendering` → `disposed`

### 2. PixiNode
**Purpose**: Visual representation of a mind map node in PixiJS

**Properties**:
```typescript
interface PixiNode {
  id: string                   // Links to domain Node.id
  container: PIXI.Container    // Main container for all elements
  background: PIXI.Graphics    // Node background shape
  text: PIXI.Text | PIXI.BitmapText // Node text content
  selectionOutline: PIXI.Graphics // Selection indicator
  shadow: PIXI.Graphics        // Drop shadow effect
  bounds: Rectangle            // Cached bounds for culling
  isVisible: boolean           // Viewport culling state
  lodLevel: 0 | 1 | 2         // Level of detail (0=full, 2=minimal)
}
```

**Validation Rules**:
- Text must be non-empty and < 1000 characters
- Position must be within world bounds (-50000, 50000)
- Colors must be valid hex values

### 3. PixiConnection
**Purpose**: Visual line connecting parent and child nodes

**Properties**:
```typescript
interface PixiConnection {
  id: string                   // Format: `${parentId}-${childId}`
  line: PIXI.Graphics          // Bezier curve graphics
  startPoint: Point            // Parent node connection point
  endPoint: Point              // Child node connection point
  isVisible: boolean           // Viewport culling state
}
```

### 4. Viewport
**Purpose**: Camera state controlling visible area of infinite canvas

**Properties**:
```typescript
interface Viewport {
  x: number                    // World X coordinate of center
  y: number                    // World Y coordinate of center
  zoom: number                 // Scale factor (0.1 - 10)
  width: number                // Viewport pixel width
  height: number               // Viewport pixel height
  bounds: Rectangle            // Calculated visible world bounds
}
```

**Validation Rules**:
- Zoom must be between 0.1 and 10
- Width/height must be positive integers

### 5. InteractionEvent
**Purpose**: Normalized interaction event from PixiJS

**Properties**:
```typescript
interface InteractionEvent {
  type: 'click' | 'drag' | 'hover' | 'rightclick' | 'doubleclick'
  nodeId?: string              // Affected node if any
  worldPosition: Point         // Position in world coordinates
  screenPosition: Point        // Position in screen coordinates
  modifiers: {
    ctrl: boolean
    shift: boolean
    alt: boolean
  }
  timestamp: number
}
```

### 6. PerformanceMetrics
**Purpose**: Real-time performance measurements

**Properties**:
```typescript
interface PerformanceMetrics {
  fps: number                  // Current frames per second
  frameTime: number            // MS per frame (16.67ms target)
  drawCalls: number            // WebGL draw calls per frame
  nodeCount: number            // Total nodes in scene
  visibleNodeCount: number     // Nodes after culling
  memoryUsage: number          // Estimated GPU memory (MB)
  lastUpdate: number           // Timestamp of last update
}
```

## Relationships

### Entity Relationship Diagram

```
PixiRenderer
    |
    ├── 1:1 Viewport (composition)
    ├── 1:1 InteractionManager (composition)
    ├── 1:1 PerformanceMonitor (composition)
    ├── 0:N PixiNode (manages)
    └── 0:N PixiConnection (manages)

PixiNode
    ├── References → Domain Node (by ID)
    └── Connected to → PixiConnection (0:N)

PixiConnection
    ├── References → Parent PixiNode
    └── References → Child PixiNode
```

### Data Flow

1. **React State → PixiRenderer**
   - Node changes trigger `updateNode()` calls
   - Batch updates within single frame

2. **User Input → InteractionManager → React State**
   - PixiJS captures all canvas interactions
   - Converts to domain events
   - Updates React state
   - State change triggers re-render

3. **Viewport Updates → Culling System**
   - Pan/zoom changes update viewport
   - Culling system shows/hides nodes
   - Only visible nodes are rendered

## Constraints & Invariants

### Performance Constraints
- Maximum 10,000 nodes in single map
- Maximum 20,000 connections
- Viewport culling must maintain O(1) visibility checks
- Text rendering cached after 100ms of no changes

### Memory Constraints  
- Single node: ~2KB GPU memory
- Texture atlas: Maximum 4096x4096 pixels
- Total GPU memory budget: 200MB

### Consistency Rules
1. Every PixiNode must correspond to exactly one domain Node
2. Connections can only exist between nodes in the same map
3. Node positions must be synchronized with domain state
4. Selection state must match React component state

## Migration Mapping

### Konva → PixiJS Component Mapping

| Konva Component | PixiJS Equivalent | Notes |
|-----------------|-------------------|--------|
| Stage | PIXI.Application | Single app instance |
| Layer | PIXI.Container | Use containers for layering |
| Group | PIXI.Container | Direct mapping |
| Rect | PIXI.Graphics | Draw rounded rectangles |
| Text | PIXI.Text / BitmapText | Use bitmap for performance |
| Line | PIXI.Graphics | Bezier curves for connections |

### State Preservation

All existing node properties must map:
- `positionX/Y` → `container.position`
- `backgroundColor` → `background.tint`
- `textColor` → `text.style.fill`
- `isSelected` → `selectionOutline.visible`

---

**Model Status**: ✅ Complete - Ready for contract generation