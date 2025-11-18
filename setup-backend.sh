#!/bin/bash
# Autonomous Backend Setup Script
# This handles T001-T008 in one go

set -e  # Exit on any error

echo "🚀 Starting Mind Map Backend Setup..."

# T001: Create Docker Compose with Postgres
echo "📦 Setting up Postgres with Docker..."
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mindmap_user
      POSTGRES_PASSWORD: mindmap_pass
      POSTGRES_DB: mindmap_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start Postgres
docker-compose up -d

# T002: Create database setup script
mkdir -p backend/scripts
cat > backend/scripts/setup-db.sh << 'EOF'
#!/bin/bash
echo "Waiting for Postgres to be ready..."
until docker-compose exec -T postgres pg_isready -U mindmap_user; do
  sleep 1
done
echo "✅ Postgres is ready!"
EOF
chmod +x backend/scripts/setup-db.sh

# T003: Initialize Node.js backend with TypeScript
echo "🔧 Setting up backend..."
mkdir -p backend
cd backend

# Initialize package.json
cat > package.json << 'EOF'
{
  "name": "mindmap-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write ."
  }
}
EOF

# T004: Install dependencies
echo "📦 Installing dependencies..."
npm install express cors dotenv
npm install @prisma/client
npm install -D prisma @types/express @types/cors @types/node
npm install -D typescript ts-node nodemon
npm install -D jest @types/jest ts-jest supertest @types/supertest

# T005: Configure TypeScript
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowJs": false,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# Configure ESLint
cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
EOF

# Configure Prettier
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF

# T006: Setup Jest
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
EOF

# T007: Create Prisma schema
echo "🗃️ Setting up Prisma..."
mkdir -p prisma
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MindMap {
  id          String   @id @default(uuid())
  title       String
  description String?
  rootNodeId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  version     Int      @default(1)
  
  nodes       Node[]
  canvasState CanvasState?
  
  @@map("mind_maps")
}

model Node {
  id              String   @id @default(uuid())
  mindMapId       String
  text            String
  positionX       Float
  positionY       Float
  width           Float?
  height          Float?
  backgroundColor String   @default("#ffffff")
  textColor       String   @default("#000000")
  fontSize        Int      @default(14)
  fontWeight      String   @default("normal")
  fontStyle       String   @default("normal")
  textDecoration  String   @default("none")
  borderColor     String   @default("#cccccc")
  borderWidth     Int      @default(1)
  borderRadius    Int      @default(4)
  parentId        String?
  collapsed       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  mindMap         MindMap  @relation(fields: [mindMapId], references: [id], onDelete: Cascade)
  parent          Node?    @relation("NodeHierarchy", fields: [parentId], references: [id])
  children        Node[]   @relation("NodeHierarchy")
  
  @@map("nodes")
  @@index([mindMapId])
  @@index([parentId])
}

model CanvasState {
  id            String   @id @default(uuid())
  mindMapId     String   @unique
  zoom          Float    @default(1.0)
  panX          Float    @default(0)
  panY          Float    @default(0)
  
  mindMap       MindMap  @relation(fields: [mindMapId], references: [id], onDelete: Cascade)
  
  @@map("canvas_states")
}
EOF

# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://mindmap_user:mindmap_pass@localhost:5432/mindmap_dev"
PORT=3001
NODE_ENV=development
EOF

# T008: Create initial migration
echo "🔄 Creating database migration..."
npx prisma generate
npx prisma migrate dev --name init --skip-seed

# Create basic server file for testing
mkdir -p src
cat > src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
EOF

echo "✅ Backend setup complete!"
echo "📝 Next: Run 'npm run dev' to start the server"