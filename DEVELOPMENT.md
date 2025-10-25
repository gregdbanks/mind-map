# Development Guide

## Quick Start

```bash
git clone https://github.com/gregdbanks/mind-map.git
cd mind-map
npm install
npm run dev
```

Open http://localhost:3000 to start mapping!

## Controls

| Action | Method |
|--------|--------|
| Create node | Hover over node → green + button |
| Edit text | Hover over node → blue edit button |
| Delete node | Hover over node → red × button |
| Pan canvas | **Spacebar** + drag |
| Zoom | Mouse wheel |
| Fit to view | Toolbar fit icon |
| Intelligent positioning | Auto-layout with manual override |
| Export/Import | Toolbar icons |

## Testing

All core functionality is tested with 100% pass rate:

```bash
npm test          # Unit tests
npm run test:e2e  # E2E tests (9/9 passing)
```

**What we test:**
- ✅ Canvas rendering and toolbar functionality
- ✅ Demo map loading and node creation
- ✅ Icon button interactions
- ✅ Export/import features
- ✅ Node operations (Enter/Delete keys)
- ✅ Consistent positioning with manual override
- ✅ Runtime error detection

## Tech Stack

- **Frontend**: React 18, TypeScript, CSS Modules
- **Visualization**: D3.js for SVG rendering
- **State**: Zustand with reducer pattern
- **Storage**: IndexedDB with debounced saves
- **Testing**: Jest, Playwright E2E
- **Build**: Vite

## Project Structure

```
src/
├── components/           # React components
│   ├── MindMapCanvas/   # Main canvas component
│   ├── NodeEditor/      # Inline text editing
│   └── NodeTooltip/     # Node information display
├── hooks/               # Custom React hooks
├── utils/               # Layout algorithms and utilities
├── context/             # React Context for state management
└── types/               # TypeScript type definitions
```

## Recent Improvements

- Fixed action button positioning during fast drags
- Spacebar-only panning mode (no accidental canvas dragging)
- Icon-based toolbar with tooltips
- Debounced persistence (prevents IndexedDB bottlenecks)
- 100% test coverage with reliable E2E tests

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test && npm run test:e2e`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request