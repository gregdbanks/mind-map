# Mind Map Backend API

Backend REST API for the Mind Mapping application built with Express, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL:
```bash
docker-compose up -d
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run migrations:
```bash
npx prisma migrate dev
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at http://localhost:3001

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Check coverage:
```bash
npm run test:coverage
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run format` - Format code
- `npm run typecheck` - Check TypeScript types

## API Endpoints

- `GET /health` - Health check endpoint

More endpoints coming soon...