# Setup Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Generate Prisma client
npx prisma generate

# 3. Start dev server
npm run dev
```

Open `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npx vitest run` | Run all tests |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma studio` | Open Prisma Studio |
| `npm run docker:up` | Start PostgreSQL |
| `npm run docker:down` | Stop PostgreSQL |

## Project Structure

```
├── docker-compose.yml          # PostgreSQL container
├── prisma/schema.prisma        # Database schema
├── src/
│   ├── app/
│   │   ├── api/solve/route.ts  # API endpoint
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── SolvePage.tsx       # Main UI
│   └── lib/
│       ├── prisma.ts           # Prisma client
│       ├── solvers.ts          # Problem solvers
│       └── solvers.test.ts     # Unit tests
├── .env                        # Database URL
└── package.json
```

## Problems Solved

| Problem | Title | Function |
|---------|-------|----------|
| 1079 | Weighted Averages | `solve1079` |
| 1070 | Six Odd Numbers | `solve1070` |
| 1114 | Fixed Password | `solve1114` |
| 1113 | Fixed Altitude | `solve1113` |
