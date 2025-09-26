# Mind Map Application Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-24

## Active Technologies
- TypeScript 5.x + React 18.x (existing)
- PixiJS 7.x + WebGL (001-project-title-mind)
- PostgreSQL + Express (backend)
- Vitest + Playwright (testing)

## Project Structure
```
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── renderers/     # NEW: PixiJS renderer
│   │   └── pixi/
│   ├── pages/
│   └── services/
└── tests/
```

## Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build

# Testing
npm test                 # Run tests in watch mode
npm run test:visual      # Visual regression tests
npm run benchmark:renderer # Performance benchmarks

# PixiJS Migration
npm run generate:test-map -- --nodes=500  # Generate test data
localStorage.setItem('renderer', 'pixi')  # Enable PixiJS
```

## Code Style
- TypeScript: Strict mode, explicit types
- React: Functional components with hooks
- PixiJS: Batch updates, object pooling
- Testing: TDD with contract tests first

## Performance Requirements
- 60 FPS with 500+ nodes
- <16ms interaction latency
- <200MB memory for 10,000 nodes
- Linear scaling up to 10,000 nodes

## Recent Changes
- 001-project-title-mind: Added PixiJS renderer for 10x performance improvement
- Implemented viewport culling and LOD system
- Added WebGL fallback to Canvas2D

<!-- MANUAL ADDITIONS START -->
# Global Claude Code Context

## ⚠️ CRITICAL RULES - NEVER VIOLATE
- **NEVER include "Claude", "AI", "LLM", "assistant", or any AI-related references in commit messages**
  - ❌ Bad: "Fixed bug with Claude's help"
  - ❌ Bad: "AI-generated component updates"
  - ✅ Good: "Fix authentication bug in login flow"
  - ✅ Good: "Add error handling to API requests"
- **NEVER commit secrets, API keys, or .env files**

## Core Rules
- Always run tests before marking any task as complete
- Never skip or ignore failing tests
- Never ignore linting errors - fix them immediately
- Use descriptive, professional commit messages focusing on what changed and why

## Development Standards
- Run available test commands (npm test, pytest, etc.) after making changes
- Run linting/formatting tools (eslint, prettier, ruff, etc.) and fix all issues
- Verify no TypeScript errors before completing tasks
- Check for and resolve any build warnings

## React Development Standards
- Always run ESLint before completing any React task
- Fix all ESLint warnings and errors - no exceptions
- Run Prettier for consistent code formatting
- Use functional components with hooks (no class components unless necessary)
- Implement proper error boundaries for error handling
- Add PropTypes or TypeScript types for all props
- Follow React naming conventions (PascalCase for components, camelCase for functions)
- Place useEffect hooks as low as possible in the component, preferably right before the return statement
- Clean up effects with proper return statements in useEffect
- Avoid inline function definitions in JSX props when possible
- Use semantic HTML elements for accessibility
- Add key props to all list items
- Never mutate state directly - always create new objects/arrays
- Run build command to ensure no compilation errors

## Git & Version Control
- **REMINDER: Never include "Claude" or AI references in commits**
- Use descriptive branch names: feature/*, bugfix/*, hotfix/*, chore/*
- Write clear PR descriptions explaining what changed and why
- Follow conventional commit format when appropriate (feat:, fix:, docs:, etc.)
- Never commit .env files, secrets, or API keys
- Always use .gitignore for build outputs and dependencies

## Error Handling
- Always wrap async operations in try-catch blocks
- Log errors with context (user action, timestamp, relevant data)
- Return user-friendly error messages, never expose stack traces
- Implement proper error boundaries in React applications
- Use appropriate HTTP status codes for API errors

## Code Organization
- Use consistent file naming (prefer kebab-case for files, PascalCase for components)
- Keep React component files under 150-200 lines - break up if larger
- Organize imports: React → third-party → local, with blank lines between groups
- Group related functionality into modules/folders
- Separate business logic from UI components
- Extract custom hooks when logic is reused or complex

## Performance
- Implement lazy loading for route-based code splitting
- Optimize images (compress, use appropriate formats, lazy load)
- Use React.memo sparingly and only after profiling
- Debounce/throttle expensive operations
- Monitor bundle size and address bloat

## Security
- Store all secrets in environment variables
- Never commit API keys, passwords, or tokens
- Sanitize and validate all user inputs
- Use HTTPS for all external API calls
- Implement proper authentication checks
- Follow OWASP security guidelines

## Documentation
- Add JSDoc comments for complex functions and utilities
- Keep README files up-to-date with setup instructions
- Document API endpoints with request/response examples
- Use clear, self-documenting variable and function names
- Add inline comments only for non-obvious logic

## Testing Standards
- Maintain minimum 80% code coverage for critical paths
- Name test files with *.test.{js,jsx,ts,tsx} pattern
- Test user behavior and outcomes, not implementation details
- Mock external dependencies and API calls
- Write descriptive test names that explain the scenario
- Include edge cases and error scenarios in tests
- Run tests in CI/CD pipeline before merging

## API Documentation
- Exam Service API: ~/CLAUDE-EXAM-API.md

## Additional Context
<!-- Add your project-specific patterns, preferences, and instructions below -->
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
<!-- MANUAL ADDITIONS END -->