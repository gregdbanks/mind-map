# Quickstart: PixiJS Canvas Migration

**Feature**: PixiJS Canvas Migration  
**Duration**: 15 minutes  
**Prerequisites**: Node.js 18+, running mind map application

## Objective

Validate that the PixiJS renderer maintains feature parity with the current Konva implementation while delivering 60 FPS performance with large mind maps.

## Setup

1. **Enable PixiJS Renderer**
   ```bash
   # In the mind map project root
   npm install
   npm run dev
   
   # Enable feature flag in browser console
   localStorage.setItem('renderer', 'pixi')
   ```

2. **Create Test Data**
   ```bash
   # Generate a large mind map for testing
   npm run generate:test-map -- --nodes=500 --depth=5
   ```

## Validation Steps

### Step 1: Basic Functionality (5 min)

1. **Create Nodes**
   - Double-click empty canvas → Node appears instantly ✓
   - Type text → Updates in real-time ✓
   - Press Enter → Saves text ✓

2. **Drag Nodes**
   - Click and drag node → Smooth movement ✓
   - Release → Position saves ✓
   - Multiple selection (Ctrl+click) → All selected nodes move ✓

3. **Pan and Zoom**
   - Hold Space + drag → Canvas pans smoothly ✓
   - Scroll wheel → Zooms in/out smoothly ✓
   - Zoom controls → Work as expected ✓

### Step 2: Performance Testing (5 min)

1. **Load Large Map**
   ```javascript
   // In browser console
   await testHelpers.loadLargeMap(500) // 500 nodes
   ```

2. **Check FPS**
   - Open Performance Monitor (F12 → Rendering → FPS meter)
   - Pan around rapidly → FPS stays at 60 ✓
   - Zoom in/out quickly → No stuttering ✓

3. **Interaction Responsiveness**
   - Click nodes → Selection immediate (<16ms) ✓
   - Drag multiple nodes → No lag ✓
   - Create new node → Appears instantly ✓

### Step 3: Visual Fidelity (3 min)

1. **Compare Screenshots**
   ```bash
   # Take screenshots with both renderers
   npm run test:visual -- --compare
   ```
   
   Expected: Pixel-perfect match except for anti-aliasing differences

2. **Check Rendering Quality**
   - Text is crisp at all zoom levels ✓
   - Node shadows render correctly ✓
   - Connection lines are smooth ✓
   - Selection outlines display properly ✓

### Step 4: Export Functionality (2 min)

1. **Export as PNG**
   - Click Export → PNG → Image downloads ✓
   - Open image → All nodes visible ✓
   - Quality matches original ✓

2. **Export as JSON**
   - Click Export → JSON → File downloads ✓
   - Import JSON → Map restored perfectly ✓

## Performance Benchmarks

Run automated benchmarks:
```bash
npm run benchmark:renderer
```

Expected results:
- 500 nodes: 60 FPS (✓ PASS)
- 1000 nodes: 60 FPS (✓ PASS)  
- 5000 nodes: >30 FPS (✓ PASS)
- Memory usage: <200MB (✓ PASS)

## Troubleshooting

### Issue: Low FPS
1. Check WebGL support: `npm run check:webgl`
2. Disable browser extensions
3. Check GPU acceleration is enabled

### Issue: Visual differences
1. Clear cache: `npm run clear:cache`
2. Check feature flag: `localStorage.getItem('renderer')`
3. Run visual regression: `npm run test:visual`

### Issue: Nodes not rendering
1. Check console for errors
2. Verify PixiJS loaded: `window.PIXI !== undefined`
3. Check viewport bounds in Performance metrics

## Success Criteria

All checks must pass:
- [ ] All basic functions work identically to Konva
- [ ] 60 FPS maintained with 500+ nodes
- [ ] Visual output matches (except anti-aliasing)
- [ ] Exports work correctly
- [ ] No memory leaks over 10 minutes
- [ ] All existing tests pass

## Rollback

If issues are found:
```bash
# Disable PixiJS renderer
localStorage.setItem('renderer', 'konva')

# Reload page
location.reload()
```

---

**Next Steps**: After validation, gradually roll out to users with monitoring.