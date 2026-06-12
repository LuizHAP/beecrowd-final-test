# E-Commerce AI Support System

## Software Design Document (SDD)

### Architecture Overview

This is a NestJS backend application with a PostgreSQL database, containerized via Docker Compose. The system manages orders with a strict state machine and provides an AI-powered support agent with RAG and tool calling.

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

### Database Design

**Table: Order**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| status | Enum | PENDING → PROCESSING → SHIPPED → DELIVERED |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Table: OrderItem**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| orderId | UUID | FK → Order.id (cascade delete) |
| productId | String | Product identifier |
| quantity | Int | Number of units |
| unitPrice | Float | Price per unit |

**Table: AILog**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| orderId | UUID? | FK → Order.id (nullable) |
| intent | Enum | CANCEL_ORDER, CHECK_STATUS, GENERAL_HELP, CREATE_ORDER |
| model | String | Model identifier |
| tokensUsed | Int | Token consumption |
| responseTimeMs | Int | Response time in milliseconds |
| toolCalled | Enum? | CANCEL_ORDER or null |
| toolSuccess | Boolean? | Tool execution result |
| promptInjectionDetected | Boolean | Injection detection flag |
| rawInput | String? | Original user message |
| rawOutput | String? | AI response |
| timestamp | DateTime | Log timestamp |

### Distributed Concurrency (FR-003)

The background job that transitions PENDING → PROCESSING uses `SELECT ... FOR UPDATE SKIP LOCKED` to prevent race conditions when multiple microservice instances run simultaneously (Kubernetes scaling). Only one instance locks and updates each batch of orders (max 100 per batch).

### API Endpoints (swagger.json)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/orders | Create order |
| GET | /api/orders | List orders (optional ?status=) |
| GET | /api/orders/:id | Get order details |
| DELETE | /api/orders/:id | Cancel order (PENDING only) |
| POST | /api/ai/chat | AI support agent |
| GET | /api/ai/logs | AI observability logs |
| GET | /api/health | Health check |

### Docker Compose

```bash
docker compose up -d  # Starts PostgreSQL
npm run start:dev     # Starts NestJS in watch mode
```

---

## GenAI Report

### AI Agent Architecture

The AI support agent (`/api/ai/chat`) implements:

1. **Prompt Injection Guardrails** — Detects and rejects injection patterns (ignore instructions, bypass rules, etc.) before any LLM processing
2. **Intent Classification** — Extracts user intent: CANCEL_ORDER, CHECK_STATUS, GENERAL_HELP, CREATE_ORDER
3. **RAG Contextualization** — Injects corporate policies from `knowledge_base.json` based on detected intent
4. **Tool Calling** — Autonomously cancels orders via `cancelOrder()` function when business rules allow
5. **Transaction Security** — All cancellations are validated against order status in deterministic code (never delegated to LLM)
6. **LLM Observability** — Logs metadata per call to database: intent, tokens, response time, tool called, injection detection

### Tools Used

- **NestJS** — Backend framework
- **Prisma ORM** — Database access with type safety
- **Docker Compose** — Containerized PostgreSQL

### Prompts Generated

The AI agent uses a system prompt built from `knowledge_base.json` rules, dynamically injected based on detected intent. No hardcoded prompts — all policies come from the knowledge base.

### Technical Failures & Hallucinations

- **Issue**: LLM might attempt to cancel non-PENDING orders
- **Mitigation**: Deterministic validation in `cancelOrder()` function — LLM never directly modifies database state
- **Issue**: Prompt injection attacks
- **Mitigation**: Pattern-based detection before any LLM processing
- **Issue**: AI log persistence failures
- **Mitigation**: Fail silently — logging should never break the main flow

### Engineer Correction Strategy

All AI decisions that affect business state (cancellations, status changes) are validated by deterministic code. The LLM only suggests actions; the database layer enforces rules.

### Test Coverage

| Component | Tests | Coverage |
|-----------|-------|----------|
| Orders Service | 10 | Create, list, detail, cancel, validation |
| Background Job | 4 | Success, empty, error, SKIP LOCKED |
| AI Agent | 7 | Injection, cancel, status, help, logging |
| **Total** | **21** | **All passing** |
