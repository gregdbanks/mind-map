# Testing Strategy for Mind Map Application

## Overview
Our testing strategy focuses on **happy path testing** with a lightweight approach that prioritizes end-to-end tests over unit tests for better ROI.

## Test Pyramid
```
     E2E Tests (Playwright)
    /                     \
   Integration Tests       \
  /                         \
Unit Tests (Critical Logic)  
```

## 1. End-to-End Tests (Primary Focus)
**Tool**: Playwright
**Location**: `/e2e/`
**Command**: `npm run test:e2e`

### Coverage:
- ✅ Initial app load
- ✅ Node creation (click, keyboard)
- ✅ Node editing
- ✅ Node deletion
- ✅ Drag and drop
- ✅ Demo map loading
- ✅ Export/Import functionality
- ✅ Keyboard shortcuts
- ✅ Animation controls

### Benefits:
- Tests real user workflows
- Catches integration issues
- Visual validation via screenshots
- Works with actual browser APIs

## 2. Critical Unit Tests
**Tool**: Jest
**Location**: `src/**/__tests__/`
**Command**: `npm run test:ci`

### What to Unit Test:
- ❌ React components (covered by E2E)
- ✅ Reducers (pure functions, easy to test)
- ✅ Complex algorithms (force calculations)
- ✅ Data transformations (export/import)

## 3. Running Tests

### Development:
```bash
# Run E2E tests with UI
npm run test:e2e:ui

# Run unit tests in watch mode
npm run test
```

### CI/CD:
```bash
# Run all tests
npm run test:ci && npm run test:e2e
```

## 4. Test Writing Guidelines

### E2E Tests:
```typescript
test('should create connected nodes', async ({ page }) => {
  // User-centric actions
  await page.click('text=Load Demo Map');
  
  // Wait for animations
  await page.waitForTimeout(2000);
  
  // Assert visible outcomes
  await expect(page.locator('[data-testid="mind-map-node"]')).toHaveCount(22);
});
```

### Unit Tests:
```typescript
test('should add node with link', () => {
  const action = { type: 'ADD_NODE', payload: { parentId: 'root' } };
  const newState = reducer(state, action);
  
  expect(newState.links).toHaveLength(1);
});
```

## 5. What NOT to Test
- ❌ D3.js internals (trust the library)
- ❌ React rendering (covered by E2E)
- ❌ CSS/styling (visual regression later)
- ❌ Browser APIs (localStorage, IndexedDB mocks)

## 6. Future Considerations
- Visual regression testing with Percy
- Performance testing for large mind maps
- Accessibility testing with axe-playwright
- API testing when backend is added

## Summary
Focus on **E2E tests** that validate user workflows. Keep unit tests minimal and focused on business logic. This approach gives maximum confidence with minimum maintenance overhead.