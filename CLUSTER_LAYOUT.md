# Cluster Layout - Vibration-Free Mind Mapping

## Overview

The Cluster Layout is a fixed-position layout algorithm that eliminates the vibration/oscillation issues present in force-directed layouts. It positions nodes in a hierarchical radial pattern with guaranteed stability.

## How to Use

### Method 1: Button Click
1. Load your mind map
2. Click the layout button (currently showing "Tree Layout" when in force mode)
3. Click again to cycle to "Cluster Layout"

### Method 2: Keyboard Shortcut
- Press `C` key to instantly switch to Cluster Layout

## Features

1. **No Vibration**: Nodes are positioned once and remain completely stable
2. **Hierarchical Organization**: 
   - Root node at center
   - First-level branches arranged in a circle
   - Sub-branches fan out at consistent angles
3. **Drag Support**: Nodes can still be manually repositioned
4. **Smooth Transitions**: 750ms animated transition when switching layouts

## Technical Details

- Uses fixed positioning (`node.fx` and `node.fy`) to prevent any movement
- Disables force simulation entirely in this mode
- Calculates positions based on:
  - Branch assignment (which main branch each node belongs to)
  - Radial distribution with configurable angles
  - Consistent spacing between hierarchy levels

## When to Use

- When experiencing vibration/oscillation in force layout
- For presentations where stability is crucial
- When you need predictable, reproducible layouts
- For large mind maps where force simulation becomes unstable

## Layout Comparison

| Feature | Force Layout | Tree Layout | Cluster Layout |
|---------|-------------|-------------|----------------|
| Dynamic positioning | Yes | No | No |
| Vibration-free | No | Yes | Yes |
| Organic appearance | Yes | No | Somewhat |
| Drag & reposition | Yes | Limited | Yes |
| Performance | Good for small maps | Excellent | Excellent |

## Implementation

The cluster layout algorithm (`createClusteredLayout` in `clusterLayout.ts`):
1. Identifies the root node
2. Finds all first-level branches
3. Distributes branches evenly around a circle
4. Recursively positions children with appropriate angles
5. Returns fixed positions for all nodes