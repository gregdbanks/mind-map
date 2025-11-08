# Notes Feature Testing Strategy

## Overview
This document outlines the comprehensive testing strategy for the mind map notes feature, ensuring reliability, performance, and user experience.

## Testing Levels

### 1. Unit Tests

#### Components to Test
- **RichTextEditor Component**
  - Text formatting (bold, italic, code)
  - Code block functionality
  - Content persistence
  - Placeholder behavior
  - Read-only mode

- **NotesModal Component**
  - Open/close functionality
  - Save/delete operations
  - Keyboard shortcuts (Ctrl+S, Esc)
  - Unsaved changes warning
  - Portal rendering

- **EnhancedCodeBlock Extension**
  - Language detection
  - Syntax highlighting
  - Code paste handling

#### Hooks to Test
- **useIndexedDBNotes**
  - CRUD operations
  - Data persistence
  - Error handling
  - Database initialization
  - Data migration

#### Utilities to Test
- **exportUtils**
  - Notes serialization
  - Date conversion
  - Import/export with notes
  - Error handling

### 2. Integration Tests

#### Scenarios
1. **Note Creation Flow**
   - Click notes button on node
   - Enter content
   - Save note
   - Verify note indicator appears
   - Verify IndexedDB storage

2. **Note Editing Flow**
   - Open existing note
   - Modify content
   - Save changes
   - Verify updates persist

3. **Note Deletion Flow**
   - Open note
   - Delete note
   - Verify indicator removed
   - Verify IndexedDB cleanup

4. **Export/Import Flow**
   - Create notes on multiple nodes
   - Export mind map
   - Clear data
   - Import mind map
   - Verify notes restored

### 3. E2E Tests

#### User Journeys
1. **Complete Note Management**
   ```
   - Create new mind map
   - Add several nodes
   - Add notes to different nodes
   - Use various formatting options
   - Save and reload page
   - Verify all notes persist
   ```

2. **Keyboard Navigation**
   ```
   - Open note with click
   - Use Ctrl+S to save
   - Use Esc to close
   - Verify shortcuts work consistently
   ```

3. **Performance Testing**
   ```
   - Create 50+ nodes with notes
   - Measure response times
   - Test scrolling performance
   - Verify no memory leaks
   ```

## Test Implementation Plan

### Phase 1: Unit Tests (Priority: High)
1. Create test file: `src/components/RichTextEditor/__tests__/RichTextEditor.test.tsx`
2. Create test file: `src/components/NotesModal/__tests__/NotesModal.test.tsx`
3. Create test file: `src/hooks/__tests__/useIndexedDBNotes.test.ts`
4. Update `src/utils/__tests__/exportUtils.test.ts`

### Phase 2: Integration Tests (Priority: High)
1. Create test file: `src/features/__tests__/notes.integration.test.tsx`
2. Test complete workflows
3. Mock IndexedDB for consistency

### Phase 3: E2E Tests (Priority: Medium)
1. Create test file: `e2e/notes.spec.ts`
2. Test real browser interactions
3. Test persistence across sessions

## Testing Utilities

### Mock Data
```typescript
export const mockNote: NodeNote = {
  id: 'note-1',
  nodeId: 'node-1',
  content: '<p>Test content</p>',
  contentJson: { type: 'doc', content: [...] },
  contentType: 'tiptap',
  plainText: 'Test content',
  tags: [],
  isPinned: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};
```

### Test Helpers
```typescript
export const createMockIndexedDB = () => {
  // Mock IndexedDB implementation
};

export const waitForIndexedDB = async () => {
  // Helper to wait for async DB operations
};
```

## Coverage Goals
- Unit tests: 90%+ coverage
- Integration tests: Key workflows covered
- E2E tests: Critical user paths covered

## Performance Benchmarks
- Note modal open: < 100ms
- Note save: < 200ms
- Export with 100 notes: < 1s
- Import with 100 notes: < 2s

## Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- Focus management
- ARIA attributes

## Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## CI/CD Integration
- Run unit tests on every commit
- Run integration tests on PR
- Run E2E tests before deployment
- Performance regression testing