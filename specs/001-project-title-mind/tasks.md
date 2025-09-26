# Tasks: PixiJS Canvas Migration

**Input**: Design documents from `/Users/gregbanks/Desktop/mind/specs/001-project-title-mind/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x, React 18.x, PixiJS 7.x, Vitest, Playwright
   → Structure: Web application (frontend/backend)
2. Load optional design documents:
   → data-model.md: 6 entities (PixiRenderer, PixiNode, PixiConnection, Viewport, InteractionEvent, PerformanceMetrics)
   → contracts/: renderer-api.yaml, renderer-api.test.ts
   → research.md: PixiJS v7.x, Adapter Pattern, Culling+LOD+Pooling
   → quickstart.md: 5 test scenarios (Create Nodes, Drag Nodes, Pan/Zoom, Performance, Export)
3. Generate tasks by category:
   → Setup: PixiJS dependencies, TypeScript configs, test infrastructure
   → Tests: Contract tests, integration tests, visual regression, performance benchmarks
   → Core: 6 entities from data model, renderer implementation
   → Integration: React adapter, feature flags, state sync
   → Polish: Performance optimizations, validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
   → ALL TESTS MUST PASS - no skipping, no deletion
5. Number tasks sequentially (T001-T035)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[TEST]**: Test creation (must fail first, then pass after implementation)
- **[PERF]**: Performance-critical implementation

## Path Conventions
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Backend**: `backend/src/`, `backend/tests/`
- **PixiJS renderer**: `frontend/src/renderers/pixi/`

## Phase 3.1: Setup
- [ ] T001 Install PixiJS v7.x and @pixi/node in frontend/package.json
- [ ] T002 [P] Install @types/pixi.js and update tsconfig.json for WebGL types
- [ ] T003 [P] Create renderer directory structure at frontend/src/renderers/pixi/
- [ ] T004 [P] Set up visual regression testing framework (Percy/Chromatic)
- [ ] T005 [P] Create performance benchmark harness at frontend/tests/benchmarks/
- [ ] T006 Configure feature flag system in frontend/src/config/featureFlags.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
**IMPORTANT: ALL tests must eventually PASS. Never skip tests. Never delete valid tests.**

### Contract Tests
- [ ] T007 [P] [TEST] Contract test: renderer-api.test.ts from contracts/ in frontend/tests/contract/renderer-api.test.ts
- [ ] T008 [P] [TEST] Test initializeRenderer with WebGL fallback in frontend/tests/contract/renderer-initialization.test.ts
- [ ] T009 [P] [TEST] Test updateNodes batch operations in frontend/tests/contract/node-updates.test.ts
- [ ] T010 [P] [TEST] Test viewport updates with animation in frontend/tests/contract/viewport.test.ts
- [ ] T011 [P] [TEST] Test interaction handling (click, drag, zoom) in frontend/tests/contract/interactions.test.ts
- [ ] T012 [P] [TEST] Test performance metrics API in frontend/tests/contract/performance-metrics.test.ts
- [ ] T013 [P] [TEST] Test canvas export (PNG/JPEG) in frontend/tests/contract/export.test.ts

### Integration Tests (from quickstart.md scenarios)
- [ ] T014 [P] [TEST] Integration: Create nodes scenario in frontend/tests/integration/create-nodes.e2e.ts
- [ ] T015 [P] [TEST] Integration: Drag nodes scenario in frontend/tests/integration/drag-nodes.e2e.ts
- [ ] T016 [P] [TEST] Integration: Pan and zoom scenario in frontend/tests/integration/pan-zoom.e2e.ts
- [ ] T017 [P] [TEST] Integration: Large map performance (500+ nodes) in frontend/tests/integration/large-map-performance.e2e.ts
- [ ] T018 [P] [TEST] Integration: Export functionality in frontend/tests/integration/export-functionality.e2e.ts

### Visual & Performance Tests
- [ ] T019 [P] [TEST] Visual regression baseline tests in frontend/tests/visual/baseline.test.ts
- [ ] T020 [P] [TEST] Performance benchmark: 60 FPS with 500 nodes in frontend/tests/benchmarks/fps-benchmark.test.ts
- [ ] T021 [P] [TEST] Memory usage benchmark: <200MB for 10K nodes in frontend/tests/benchmarks/memory-benchmark.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
**Each task below must result in its corresponding tests PASSING**

### Entity Implementations (from data-model.md)
- [ ] T022 [P] PixiRenderer class implementing CanvasRenderer interface in frontend/src/renderers/pixi/PixiRenderer.ts
- [ ] T023 [P] PixiNode class with Container, Graphics, Text in frontend/src/renderers/pixi/PixiNode.ts
- [ ] T024 [P] PixiConnection class with bezier curves in frontend/src/renderers/pixi/PixiConnection.ts
- [ ] T025 [P] Viewport class with bounds calculation in frontend/src/renderers/pixi/Viewport.ts
- [ ] T026 [P] InteractionManager for mouse/touch events in frontend/src/renderers/pixi/InteractionManager.ts
- [ ] T027 [P] PerformanceMonitor for FPS tracking in frontend/src/renderers/pixi/PerformanceMonitor.ts

### Core Systems
- [ ] T028 [PERF] CullingSystem for viewport visibility in frontend/src/renderers/pixi/systems/CullingSystem.ts
- [ ] T029 [PERF] LODSystem for level-of-detail rendering in frontend/src/renderers/pixi/systems/LODSystem.ts
- [ ] T030 WebGL capability detection in frontend/src/renderers/pixi/utils/WebGLDetector.ts

## Phase 3.4: Integration Layer
**Each integration must maintain all existing tests passing**

- [ ] T031 React-PixiJS adapter component in frontend/src/components/PixiCanvasAdapter.tsx
- [ ] T032 Feature flag hook for renderer switching in frontend/src/hooks/useRenderer.ts
- [ ] T033 State synchronization service in frontend/src/renderers/pixi/services/StateSync.ts
- [ ] T034 Update MindMapCanvas.tsx to use renderer abstraction in frontend/src/components/MindMapCanvas.tsx

## Phase 3.5: Performance Optimizations
**Performance benchmarks must pass after each optimization**

- [ ] T035 [P] [PERF] TextureAtlas for node backgrounds in frontend/src/renderers/pixi/optimization/TextureAtlas.ts
- [ ] T036 [P] [PERF] ObjectPool for Graphics reuse in frontend/src/renderers/pixi/optimization/ObjectPool.ts
- [ ] T037 [P] [PERF] BatchRenderer for draw call optimization in frontend/src/renderers/pixi/optimization/BatchRenderer.ts
- [ ] T038 [PERF] TextCache for BitmapText performance in frontend/src/renderers/pixi/optimization/TextCache.ts

## Phase 3.6: Polish & Validation
- [ ] T039 Run ALL tests and ensure 100% pass rate (npm test -- --no-skip)
- [ ] T040 Run performance benchmarks and validate 60 FPS target
- [ ] T041 Run visual regression tests and approve changes
- [ ] T042 Update INSTRUCTIONS.md with PixiJS renderer documentation
- [ ] T043 Create migration guide for developers

## Dependencies
- Setup (T001-T006) must complete before any other work
- ALL tests (T007-T021) must be written and FAILING before implementation
- Core entities (T022-T027) can be implemented in parallel after tests
- Core systems (T028-T030) depend on entities
- Integration (T031-T034) requires core implementation
- Optimizations (T035-T038) require integration complete
- Validation (T039-T043) requires all implementation complete

## Parallel Execution Examples

### Test Sprint (Launch T007-T021 together)
```
Task: "Contract test: renderer-api.test.ts from contracts/ in frontend/tests/contract/renderer-api.test.ts"
Task: "Test initializeRenderer with WebGL fallback in frontend/tests/contract/renderer-initialization.test.ts"
Task: "Test updateNodes batch operations in frontend/tests/contract/node-updates.test.ts"
Task: "Test viewport updates with animation in frontend/tests/contract/viewport.test.ts"
Task: "Test interaction handling (click, drag, zoom) in frontend/tests/contract/interactions.test.ts"
Task: "Test performance metrics API in frontend/tests/contract/performance-metrics.test.ts"
Task: "Test canvas export (PNG/JPEG) in frontend/tests/contract/export.test.ts"
Task: "Integration: Create nodes scenario in frontend/tests/integration/create-nodes.e2e.ts"
Task: "Integration: Drag nodes scenario in frontend/tests/integration/drag-nodes.e2e.ts"
Task: "Integration: Pan and zoom scenario in frontend/tests/integration/pan-zoom.e2e.ts"
Task: "Integration: Large map performance (500+ nodes) in frontend/tests/integration/large-map-performance.e2e.ts"
Task: "Integration: Export functionality in frontend/tests/integration/export-functionality.e2e.ts"
Task: "Visual regression baseline tests in frontend/tests/visual/baseline.test.ts"
Task: "Performance benchmark: 60 FPS with 500 nodes in frontend/tests/benchmarks/fps-benchmark.test.ts"
Task: "Memory usage benchmark: <200MB for 10K nodes in frontend/tests/benchmarks/memory-benchmark.test.ts"
```

### Entity Implementation Sprint (Launch T022-T027 after tests fail)
```
Task: "PixiRenderer class implementing CanvasRenderer interface in frontend/src/renderers/pixi/PixiRenderer.ts"
Task: "PixiNode class with Container, Graphics, Text in frontend/src/renderers/pixi/PixiNode.ts"
Task: "PixiConnection class with bezier curves in frontend/src/renderers/pixi/PixiConnection.ts"
Task: "Viewport class with bounds calculation in frontend/src/renderers/pixi/Viewport.ts"
Task: "InteractionManager for mouse/touch events in frontend/src/renderers/pixi/InteractionManager.ts"
Task: "PerformanceMonitor for FPS tracking in frontend/src/renderers/pixi/PerformanceMonitor.ts"
```

### Optimization Sprint (Launch T035-T037 together)
```
Task: "TextureAtlas for node backgrounds in frontend/src/renderers/pixi/optimization/TextureAtlas.ts"
Task: "ObjectPool for Graphics reuse in frontend/src/renderers/pixi/optimization/ObjectPool.ts"  
Task: "BatchRenderer for draw call optimization in frontend/src/renderers/pixi/optimization/BatchRenderer.ts"
```

## Test Completion Requirements
**MANDATORY**: Every implementation task MUST result in passing tests:
- Do NOT skip tests with .skip() or xit()
- Do NOT delete tests unless functionality is removed
- Do NOT modify test expectations to make them easier
- If a test seems unreasonable, fix the implementation
- All existing React-Konva tests must continue passing
- Run 'npm test' with 0 failures, 0 skipped before marking complete
- Each task completion = its tests turn from RED to GREEN

## Implementation Notes
- Contract tests already exist in renderer-api.test.ts - copy and adapt
- Initialize PIXI.Application with: `{ antialias: true, resolution: 2, backgroundColor: 0xF9F9F9 }`
- Use PIXI.Graphics for rounded rectangles: `drawRoundedRect(x, y, width, height, 8)`
- Implement viewport culling with 100px padding: `bounds.pad(100)`
- Cache PIXI.Text after 100ms idle: `debounce(updateText, 100)`
- Batch node updates in single ticker callback
- Use PIXI.Container for node grouping
- Memory budget tracking: `PIXI.utils.getGPUMemoryUsage()`

## Validation Checklist
- [x] All contracts have test tasks (T007-T013)
- [x] All entities have implementation tasks (T022-T027)
- [x] All quickstart scenarios have tests (T014-T018)
- [x] Tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks operate on different files
- [x] Each task specifies exact file path
- [x] No parallel tasks modify the same file

---

**Total Tasks**: 43
**Estimated Duration**: 4-5 weeks with 2 developers
**Critical Path**: T001-T006 → T007-T021 → T022-T030 → T031-T034 → T039
**Success Criteria**: ALL tests passing (0 failures, 0 skipped)