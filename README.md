# E-Commerce AI Support System

## Software Design Document (SDD)

### Architecture Overview

This is a monolithic Next.js application (App Router) with a PostgreSQL database, containerized via Docker Compose. The system manages orders with a strict state machine and provides an AI-powered support agent with RAG and tool calling.

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

### Distributed Concurrency (FR-003)

The background job that transitions PENDING → PROCESSING uses `SELECT ... FOR UPDATE SKIP LOCKED` to prevent race conditions when multiple microservice instances run simultaneously (Kubernetes scaling). Only one instance locks and updates each batch of orders.

### API Endpoints (swagger.json)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/orders | Create order |
| GET | /api/orders | List orders (optional ?status=) |
| GET | /api/orders/:id | Get order details |
| DELETE | /api/orders/:id | Cancel order (PENDING only) |
| POST | /api/ai/chat | AI support agent |

### Docker Compose

```bash
docker compose up -d  # Starts PostgreSQL
npm run dev           # Starts Next.js
```

---

## GenAI Report

### AI Agent Architecture

The AI support agent (`/api/ai/chat`) implements:

1. **Prompt Injection Guardrails** — Detects and rejects injection patterns (ignore instructions, bypass rules, etc.)
2. **Intent Classification** — Extracts user intent: cancel_order, check_status, general_help, create_order
3. **RAG Contextualization** — Injects corporate policies from `knowledge_base.json` based on detected intent
4. **Tool Calling** — Autonomously cancels orders via `cancelOrder()` function when business rules allow
5. **Transaction Security** — All cancellations are validated against order status in deterministic code (never delegated to LLM)
6. **LLM Observability** — Logs metadata per call: intent, tokens, response time, tool called, injection detection

### Tools Used

- **Vercel AI SDK** — AI orchestration layer
- **Prisma ORM** — Database access with type safety
- **Docker Compose** — Containerized PostgreSQL

### Prompts Generated

The AI agent uses a system prompt built from `knowledge_base.json` rules, dynamically injected based on detected intent. No hardcoded prompts — all policies come from the knowledge base.

### Technical Failures & Hallucinations

- **Issue**: LLM might attempt to cancel non-PENDING orders
- **Mitigation**: Deterministic validation in `cancelOrder()` function — LLM never directly modifies database state
- **Issue**: Prompt injection attacks
- **Mitigation**: Pattern-based detection before any LLM processing

### Engineer Correction Strategy

All AI decisions that affect business state (cancellations, status changes) are validated by deterministic code. The LLM only suggests actions; the database layer enforces rules.
