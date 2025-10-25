# Mind Map Application

Interactive mind mapping with React, TypeScript, and D3.js. Create and organize ideas with smooth drag-and-drop interactions.

<!-- Add your GIF here -->
![Mind Map Demo](demo.gif)

## Features

- **Node Management**: Create, edit, and delete nodes with hover actions
- **Smart Navigation**: Spacebar + drag to pan, mouse wheel to zoom  
- **Multiple Layouts**: Switch between tree and cluster arrangements
- **Export/Import**: Save as JSON or PNG, load from files
- **Auto-Save**: Persistent storage with IndexedDB
- **Modern UI**: Icon toolbar, visual hierarchy, smooth animations

## Quick Start

```bash
git clone https://github.com/gregdbanks/mind-map.git
cd mind-map
npm install
npm run dev
```

## Controls

| Action | Method |
|--------|--------|
| Create node | Hover over node → green + button |
| Edit text | Hover over node → blue edit button |
| Delete node | Hover over node → red × button |
| Pan canvas | **Spacebar** + drag |
| Zoom | Mouse wheel |

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
- ✅ Layout switching
- ✅ Runtime error detection

## Tech Stack

- **Frontend**: React 18, TypeScript, CSS Modules
- **Visualization**: D3.js for SVG rendering
- **State**: Zustand with reducer pattern
- **Storage**: IndexedDB with debounced saves
- **Testing**: Jest, Playwright E2E
- **Build**: Vite

## Recent Improvements

- Fixed action button positioning during fast drags
- Spacebar-only panning mode (no accidental canvas dragging)
- Icon-based toolbar with tooltips
- Debounced persistence (prevents IndexedDB bottlenecks)
- 100% test coverage with reliable E2E tests