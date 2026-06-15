# E-Commerce AI Support System

A NestJS backend application that provides an AI-powered support agent for an e-commerce platform, with order management, background job processing, and LLM integration.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [AI Agent](#ai-agent)
- [Documentation](#documentation)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
│  ┌──────────────────┐    ┌──────────────────────────┐   │
│  │  NestJS Server   │    │     PostgreSQL DB        │   │
│  │                  │    │                          │   │
│  │  /api/orders     │◄──►│  Order / OrderItem       │   │
│  │  /api/ai/chat    │    │  AILog                   │   │
│  │  /api/ai/logs    │    │                          │   │
│  │  /api/health     │    │                          │   │
│  │                  │    │                          │   │
│  │  Background Job  │    │                          │   │
│  │  (SKIP LOCKED)   │    │                          │   │
│  └──────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

The system follows **Domain-Driven Design (DDD)** and **SOLID principles** with a clean architecture layout.

## Features

- **Order Management** — Full CRUD with strict state machine (PENDING → PROCESSING → SHIPPED → DELIVERED)
- **AI Support Agent** — Intent classification, RAG contextualization, tool calling, and prompt injection guardrails
- **Background Jobs** — Distributed order processing with `SELECT ... FOR UPDATE SKIP LOCKED`
- **LLM Integration** — Pluggable LLM service with observability logging
- **Swagger/OpenAPI** — Auto-generated API documentation
- **100% Test Coverage** — Unit and E2E tests with Jest

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| ORM | Prisma |
| Database | PostgreSQL |
| Testing | Jest |
| Linting | ESLint v9 (Flat Config) |
| Containerization | Docker Compose |
| API Docs | Swagger/OpenAPI |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL via Docker
docker compose up -d

# Run migrations (if any)
npx prisma generate
```

### Development

```bash
# Start in watch mode
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create a new order |
| GET | `/api/orders` | List orders (optional `?status=`) |
| GET | `/api/orders/:id` | Get order details |
| DELETE | `/api/orders/:id` | Cancel order (PENDING only) |
| POST | `/api/ai/chat` | AI support agent chat |
| GET | `/api/ai/logs` | AI observability logs |
| GET | `/api/health` | Health check |

Swagger UI is available at `/api` when the server is running.

## Testing

```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Test Coverage

| Component | Coverage |
|-----------|----------|
| Orders | 100% |
| AI Agent | 100% |
| Background Job | 100% |
| LLM Service | 100% |
| **Overall** | **100%** |

## Project Structure

```
src/
├── ai-agent/          # AI support agent module
│   ├── __tests__/     # Unit tests
│   ├── ai-agent.controller.ts
│   ├── ai-agent.service.ts
│   ├── ai-agent.module.ts
│   ├── dto/           # Data transfer objects
│   └── entities/      # Domain entities
├── background-job/    # Background job processing
├── common/            # Shared modules
│   ├── health/        # Health check
│   └── prisma/        # Prisma ORM module
├── orders/            # Order management module
│   ├── __tests__/     # Unit tests
│   ├── dto/
│   ├── entities/
│   └── ...
├── app.module.ts
├── bootstrap.ts
└── main.ts
```

## AI Agent

The AI support agent (`/api/ai/chat`) implements:

1. **Prompt Injection Guardrails** — Detects and rejects injection patterns before LLM processing
2. **Intent Classification** — Identifies user intent: `CANCEL_ORDER`, `CHECK_STATUS`, `GENERAL_HELP`, `CREATE_ORDER`
3. **RAG Contextualization** — Injects corporate policies based on detected intent
4. **Tool Calling** — Autonomously cancels orders when business rules allow
5. **Transaction Security** — All cancellations validated by deterministic code (never delegated to LLM)
6. **LLM Observability** — Logs metadata per call: intent, tokens, response time, tool usage, injection detection

### Security

- All AI decisions affecting business state are validated by deterministic code
- LLM only suggests actions; the database layer enforces rules
- Prompt injection detection runs before any LLM processing
- AI log failures are handled silently to avoid breaking the main flow

## Documentation

All project documentation is located in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [Programming Test Final](docs/PROGRAMMING_TEST_FINAL.md) | Full test specification and requirements |
| [Implementation Checklist](docs/CHECKLIST.md) | Complete implementation status per requirement |
| [GenAI Report](docs/GENAI_REPORT.md) | AI-assisted development log — tools, prompts, failures, and corrections |
| [OpenAPI Specification](docs/swagger.json) | Exported Swagger 3.0 schema for all API endpoints |

> **Note:** Docker PostgreSQL is exposed on host port **5433** to avoid conflicts with local Postgres installations on port 5432.
