# Claude Code Context - Mind Mapping Application

## Project Overview
Building a web-based mind mapping application MVP with visual node editor, drag-and-drop, hierarchical relationships, and real-time editing.

## Tech Stack
**Language/Version**: TypeScript 5.x / JavaScript ES2022  
**Framework**: React 18+ with react-konva for canvas rendering  
**State Management**: Zustand for application state  
**Testing**: Jest + React Testing Library, Playwright for E2E  
**Build Tools**: Vite, ESBuild  
**Storage**: IndexedDB with LocalStorage fallback

## Key Libraries
- **konva**: Canvas rendering and interactions
- **react-konva**: React bindings for Konva
- **zustand**: State management
- **d3-hierarchy**: Auto-layout algorithms
- **uuid**: Node ID generation

## Architecture Patterns
- **Component Library Separation**: All UI components in dedicated directory, ready for package extraction
- **Command Pattern**: For undo/redo functionality
- **TDD Approach**: Tests written before implementation
- **Modular Structure**: Clear separation between components, services, and business logic

## Testing Strategy
```bash
npm test          # Run tests in watch mode (TDD)
npm run test:ci   # Single test run
npm run test:e2e  # Playwright E2E tests
npm run storybook # Component development
```

## Key Commands
```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint check
npm run typecheck # TypeScript validation
```

## Project Structure
```
frontend/
   src/
      components/    # Reusable UI components
      services/      # Business logic
      hooks/         # Custom React hooks
      types/         # TypeScript definitions
   tests/            # Test files
```

## Development Workflow - REQUIRED

**CRITICAL: All changes MUST be made in feature branches. NEVER work directly on main branch.**

### Branch Protection Active
- Main branch is protected with required status checks
- All changes must go through pull request process
- CI/CD pipeline enforces quality gates

### Required Workflow for ALL Changes:
1. **Create feature branch**: `git checkout -b feature/descriptive-name` or `git checkout -b fix/issue-description`
2. **Make changes** on the feature branch
3. **Commit changes**: Use descriptive commit messages
4. **Push branch**: `git push origin feature-name`
5. **Create pull request** to main branch
6. **Wait for CI checks** to pass (unit tests, E2E tests, TypeScript)
7. **Merge only after** all status checks are green

### Branch Naming Convention:
- `feature/feature-name` - New functionality
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/update-type` - Documentation updates

### CI/CD Pipeline Requirements:
- All unit tests must pass (123 tests)
- E2E tests must pass
- TypeScript compilation must succeed
- Tests run on Node.js 18.x and 20.x

**Remember: Branch protection prevents direct pushes to main. Always create a feature branch first!**

## Current Focus Areas
1. Canvas component with Konva integration
2. Node creation and editing functionality
3. Drag-and-drop with parent-child relationships
4. Keyboard shortcut implementation
5. Export functionality (PNG/JSON)

## Performance Targets
- 60 FPS during drag operations
- <100ms node creation
- <3MB initial bundle size

## Recent Changes
- Set up React 18+ with TypeScript
- Integrated Konva.js for canvas rendering
- Implemented Zustand for state management
- Created base component structure
- Established CI/CD pipeline with branch protection
- Achieved 100% test coverage (123/123 tests passing)