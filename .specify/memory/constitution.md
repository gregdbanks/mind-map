<!-- Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles: Principle II expanded with library-ready component separation
Added sections: Component Library Separation subsection
Removed sections: None
Templates requiring updates: ✅ All templates use generic placeholders
Follow-up TODOs: None
-->

# Mind Map Application Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)
Every feature and fix must follow shift-left testing principles. Write tests first in a red-green fashion - tests must fail initially, then implementation makes them pass. All tests must pass before any code changes can proceed. Development happens in watch mode with continuous test execution. No commits without passing tests.

### II. Modularity & Component-Driven Architecture
Build systems as composable, independent modules. Each component should have a single responsibility and clear interfaces. Prefer component-driven development where features are built as self-contained units that can be developed, tested, and deployed independently. All UI components must be developed with clear separation from business logic, structured so they can theoretically be extracted into an external package without modification.

### III. Pragmatic Technology Selection
Default to JavaScript/TypeScript solutions for consistency and team expertise, but choose the best tool for the specific job when justified. Technology decisions should be driven by problem requirements, not preferences. Document rationale when deviating from defaults.

### IV. Continuous Quality Assurance
Automated testing runs on every commit. Test coverage must be maintained or improved with each change. Testing includes unit tests, integration tests, and when applicable, end-to-end tests. Performance and accessibility testing should be automated where possible.

## Development Standards

### Component Library Separation
- UI components must live in a dedicated components directory separate from application code
- Components cannot import from application business logic - only props and callbacks
- Each component must be self-contained with its own tests and documentation
- Components should work with mock data and be showcased in isolation (e.g., Storybook)
- Component APIs must be stable and versioned when breaking changes occur

### Testing Requirements
- Red-Green-Refactor cycle mandatory for all new features
- Minimum 80% code coverage for critical paths
- Tests must be deterministic and isolated
- Mock external dependencies appropriately
- Test names must clearly describe the scenario being tested

### Code Quality Gates
- All linting errors must be resolved before commit
- Type checking must pass (when using TypeScript)
- No console.log statements in production code
- Clear error handling with appropriate logging
- Consistent code formatting enforced via tooling

## Governance

- This constitution supersedes all project practices and conventions
- Amendments require documented rationale and team consensus
- All pull requests must verify compliance with these principles
- Deviations from principles require explicit justification in code comments or documentation
- Regular reviews ensure principles remain relevant and effective

**Version**: 1.1.0 | **Ratified**: 2025-01-20 | **Last Amended**: 2025-01-20