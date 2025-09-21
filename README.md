# Mind Mapping Application

A powerful web-based mind mapping application with a smooth, intuitive interface for organizing thoughts and ideas. Built with React, TypeScript, and PostgreSQL.

![Mind Map Demo](assets/mindmap-share-demo.gif)

## Features

- 🎨 **Visual node-based editor** with drag-and-drop interface
- 🌳 **Hierarchical relationships** between nodes with parent-child connections
- 🎯 **Smart keyboard shortcuts** for rapid node creation and navigation
  - **Space + Drag**: Pan the canvas
  - **Ctrl/Cmd + A**: Select all nodes
  - **Delete**: Remove selected nodes
  - **Escape**: Clear selection
- 🔍 **Zoom and pan navigation** with mouse wheel and controls
- 📝 **Rich text editing** with customizable node styles
- 🎪 **Collapsible/expandable** branches for better organization
- 💾 **Auto-save** with optimistic updates and caching
- 🚀 **High performance** - handles hundreds of nodes smoothly
- 📤 **Multiple sharing options**:
  - **Interactive HTML**: Self-contained file that works offline
  - **URL Sharing**: Compressed links for quick sharing
  - **JSON Export**: Portable data format for backups
  - **Email Integration**: Share with instructions

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL, TypeORM
- **Frontend**: React 19, TypeScript, Konva.js, React Router v7
- **State Management**: Custom React Context with reducer pattern
- **Testing**: Vitest, React Testing Library, Playwright
- **Build Tools**: Vite, ESBuild

## Project Structure

```
mind/
├── backend/          # Express API server
│   ├── src/
│   │   ├── entities/     # TypeORM entities
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── server.ts     # App entry point
│   └── tests/           # Backend tests
├── frontend/         # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API clients
│   │   ├── store/        # State management
│   │   └── types/        # TypeScript types
│   └── tests/           # Frontend tests
├── scripts/          # Utility scripts
├── assets/          # Images and demos
└── docker-compose.yml # PostgreSQL setup
```

## Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- Docker & Docker Compose
- npm or yarn

### Quick Start

1. **Clone the repository**:
```bash
git clone <repository-url>
cd mind
```

2. **Start PostgreSQL**:
```bash
docker-compose up -d
```

3. **Backend Setup**:
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

4. **Frontend Setup** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

5. **Open the app**: Navigate to http://localhost:5173

## Usage

### Creating a Mind Map

1. Click "Create New" on the home page
2. Give your mind map a title and optional description
3. Double-click anywhere on the canvas to create your first node
4. Type your text and press Enter to save

### Navigation Controls

- **Pan**: Hold Space and drag, or use mouse wheel
- **Zoom**: Ctrl/Cmd + Mouse wheel, or use the zoom buttons
- **Select**: Click nodes to select, Ctrl/Cmd + Click for multiple
- **Edit**: Double-click a node to edit its text

### Node Operations

- **Create Child**: Select a node and double-click nearby
- **Delete**: Select nodes and press Delete
- **Drag**: Click and drag any node to reposition
- **Style**: Right-click for context menu (coming soon)

### Sharing Your Mind Map

1. Click the **Share** button in the top controls
2. Choose from 4 sharing methods:
   - **🌐 Interactive HTML**: Download a fully functional offline viewer
   - **🔗 Share Link**: Get a URL that opens directly in the app
   - **💾 JSON File**: Export for backup or import elsewhere
   - **📧 Email**: Pre-formatted email with instructions

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests with Playwright
cd frontend && npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run typecheck
```

### Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## API Documentation

The backend provides a RESTful API:

- `GET /api/mindmaps` - List all mind maps
- `POST /api/mindmaps` - Create new mind map
- `GET /api/mindmaps/:id` - Get mind map details
- `PUT /api/mindmaps/:id` - Update mind map
- `DELETE /api/mindmaps/:id` - Delete mind map
- `GET /api/mindmaps/:id/nodes` - Get all nodes
- `POST /api/mindmaps/:id/nodes` - Create node
- `PUT /api/nodes/:id` - Update node
- `DELETE /api/nodes/:id` - Delete node

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your feature
4. Implement the feature
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- Canvas rendering powered by Konva.js
- Icons and UI components from the React ecosystem