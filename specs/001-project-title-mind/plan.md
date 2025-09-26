
# Implementation Plan: PixiJS Canvas Migration

**Branch**: `001-project-title-mind` | **Date**: 2025-09-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/Users/gregbanks/Desktop/mind/specs/001-project-title-mind/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Migrate the mind map canvas from React-Konva to PixiJS to resolve performance issues with large mind maps. The migration must maintain complete feature parity while achieving 60 FPS performance with 500+ nodes and responsive interactions at scale.

## Technical Context
**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: React 18.x, PixiJS 7.x (target), PostgreSQL, Express  
**Storage**: PostgreSQL for mind map data persistence  
**Testing**: Vitest for unit tests, Playwright for E2E tests  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: web - frontend React application with backend API  
**Performance Goals**: 60 FPS with 500+ nodes, smooth panning/zooming, instant node creation  
**Constraints**: <16ms interaction latency, support 5000+ nodes, maintain current memory footprint  
**Scale/Scope**: Support mind maps with up to 10,000 nodes and 20,000 connections

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-Driven Development
- [ ] Will write failing tests first for all new PixiJS components
- [ ] Will maintain continuous test execution during development
- [ ] All existing tests must continue to pass during migration

### II. Modularity & Component-Driven Architecture  
- [ ] Canvas renderer will be isolated as swappable module
- [ ] PixiJS components will be separate from business logic
- [ ] Components remain extractable to external package

### III. Pragmatic Technology Selection
- [ ] PixiJS justified by performance requirements (60 FPS with 500+ nodes)
- [ ] WebGL renderer needed for large-scale canvas operations
- [ ] Rationale documented for moving from React-Konva

### IV. Continuous Quality Assurance
- [ ] Performance benchmarks automated (FPS, latency measurements)
- [ ] Visual regression tests for canvas rendering
- [ ] Accessibility maintained or improved

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application structure (frontend + backend detected)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Contract tests for renderer API (6 test suites) [P]
- PixiJS entity implementations (5 core entities) [P]
- Integration tests for each user story (5 scenarios)
- Migration adapter implementation
- Performance benchmark suite
- Visual regression test setup

**Ordering Strategy**:
1. **Testing Infrastructure** (Tasks 1-5)
   - Set up visual regression framework
   - Create performance benchmark harness
   - Write all contract tests (must fail initially)

2. **Core Implementation** (Tasks 6-15)
   - PixiRenderer base class [P]
   - PixiNode component [P]
   - PixiConnection component [P]
   - Viewport and culling system
   - InteractionManager

3. **Integration Layer** (Tasks 16-20)
   - React-PixiJS adapter
   - Feature flag system
   - State synchronization

4. **Performance & Polish** (Tasks 21-25)
   - Implement culling optimizations
   - Add texture atlasing
   - Memory pooling
   - WebGL fallback

5. **Validation** (Tasks 26-30)
   - Run performance benchmarks
   - Visual regression validation
   - E2E test updates
   - Documentation updates

**Task Markers**:
- [P] = Parallelizable (can be done independently)
- [TEST] = Test creation (must fail first)
- [PERF] = Performance-critical implementation

**Estimated Output**: 30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
