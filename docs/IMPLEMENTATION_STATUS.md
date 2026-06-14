# Implementation Status

> Progress checklist for the project against [REQUIREMENTS.md](./REQUIREMENTS.md).
> Update this file as items are completed or new gaps are identified.
>
> **Last reviewed:** 2026-06-14

---

## Executive Summary

| Area | Progress | Notes |
|------|----------|-------|
| Functional Requirements (FR-001 to FR-005) | ✅ ~95% | Core complete; CREATE_ORDER intent not implemented |
| Non-Functional Requirements | ✅ ~90% | SKIP LOCKED, injection guard, logs; no real LLM |
| Technical Requirements | 🟡 ~75% | NestJS instead of Next.js + Vercel AI SDK |
| Deliverables | ✅ ~95% | CI/CD, Docker, tests, `.env.example` |
| Automated tests | ✅ | 147 unit + 22 E2E passing (`npm run test:all`) |

**Legend:** ✅ Done · 🟡 Partial / with caveats · ❌ Pending · 🔴 Blocked / failing

---

## Functional Requirements

### FR-001 — Order creation and listing

- [x] `POST /api/orders` — create order with multiple items (productId, quantity, unitPrice)
- [x] Item validation (non-empty array, required fields) — DTO + service layer
- [x] `GET /api/orders` — general listing
- [x] Filter by status via `?status=` query
- [x] Order created with initial `PENDING` status
- [x] Order total calculation (sum of quantity × unitPrice)
- [x] Unit and E2E tests

### FR-002 — Details retrieval

- [x] `GET /api/orders/:id`
- [x] 404 for non-existent order
- [x] Response includes items, status, total, and timestamps
- [x] UUID validation via `ParseUUIDPipe`
- [x] Unit and E2E tests

### FR-003 — Automatic status transition (Background Job)

- [x] Job runs every 5 minutes (`setInterval` of 300,000 ms)
- [x] `PENDING` → `PROCESSING` transition
- [x] Distributed concurrency with `SELECT ... FOR UPDATE SKIP LOCKED`
- [x] Batch limit (100 orders per run)
- [x] Immediate run on startup (disabled in tests via `VITEST`)
- [x] Unit tests
- [ ] E2E test validating real transition after 5 min — *optional; covered by unit tests*

### FR-004 — Transactional cancellation rule

- [x] `DELETE /api/orders/:id`
- [x] Cancellation allowed only in `PENDING` status
- [x] Rejection for `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` (HTTP 400)
- [x] Deterministic validation in domain (`Order.canCancel()`, `Order.cancel()`)
- [x] AI agent tool calling also enforces the rule
- [x] `CANCELLED` enum in `prisma/schema.prisma`
- [x] Unit and E2E tests

### FR-005 — Intelligent support agent

- [x] `POST /api/ai/chat` (HTTP 200)
- [x] Read policies from `knowledge_base.json` (RAG by intent)
- [x] Cross-reference with actual order status (`orderId` in body)
- [x] Tool Calling: autonomous cancellation via `cancelOrder()` when rules allow
- [x] Explanatory response when cancellation is denied
- [x] RAG response for general questions (`GENERAL_HELP`)
- [x] Intent classification: `CANCEL_ORDER`, `CHECK_STATUS`, `GENERAL_HELP`, `CREATE_ORDER`
- [x] `GET /api/ai/logs` — observability
- [ ] Real LLM integration (OpenAI/Anthropic/Vercel AI SDK) — *local deterministic agent*
- [ ] `CREATE_ORDER` intent — *detected but not implemented*
- [x] Unit and E2E tests

---

## Non-Functional Requirements

### Concurrency in distributed environments

- [x] `FOR UPDATE SKIP LOCKED` in background job
- [x] Documented in README (SDD section)
- [ ] Integration test simulating multiple concurrent instances

### Prompt injection security

- [x] Regex pattern detection before processing
- [x] Safe rejection response when injection is detected
- [x] `promptInjectionDetected` flag in logs
- [x] Unit and E2E tests

### LLM observability

- [x] Log persistence in `AILog` table (Prisma)
- [x] Metadata: intent, model, tokensUsed, responseTimeMs, toolCalled, toolSuccess
- [x] rawInput / rawOutput stored
- [x] Query endpoint with filters (intent, injection, limit)
- [ ] tokensUsed is a proxy (`message.length`) — does not reflect real LLM tokens

### Technological isolation (Docker Compose)

- [x] `docker-compose.yml` with PostgreSQL + app
- [x] PostgreSQL healthcheck
- [x] `docker compose up -d` brings up functional API + DB
- [x] `.env.example` with documented variables
- [x] `knowledge_base.json` copied into Docker image
- [x] Dockerfile fixed (multi-stage build)

---

## Technical Requirements

### Chosen stack

| PDF requirement | Implemented | Status |
|-----------------|-------------|--------|
| TypeScript | ✅ Yes | — |
| Next.js (App Router / API Routes) | ❌ NestJS | 🟡 Deviation — alternative TypeScript backend |
| Prisma ORM | ✅ Yes | — |
| Vercel AI SDK | ❌ No | ❌ Local deterministic agent |
| Docker + Docker Compose | ✅ Yes | — |
| PostgreSQL | ✅ Yes | — |

### Input assets

| Asset | Status | Notes |
|-------|--------|-------|
| `knowledge_base.json` | ✅ Present | Extended beyond PDF example (8 rules) |
| `swagger.json` | ❌ Missing as file | Swagger generated dynamically at `/api` via `@nestjs/swagger` |

---

## Deliverables

### GitHub repository

- [x] Remote repository configured (`origin`: `LuizHAP/beecrowd-final-test`)
- [x] Organized commit history
- [x] CI/CD via GitHub Actions (`.github/workflows/ci.yml`)
- [ ] Commit + push changes from this session

### Complete source code

- [x] Backend API (NestJS)
- [x] Background Job
- [x] AI orchestration layer (deterministic)
- [ ] Real LLM integration

### Containerized environment

- [x] `docker-compose.yml`
- [x] `Dockerfile` (multi-stage, fixed)
- [x] Smoke test validated (`docker compose up -d` + POST /api/orders → 201)

### Automated testing

- [x] Unit suite — **147 tests passing** (`npm test`)
- [x] E2E suite — **22 tests passing** (`npm run test:e2e`)
- [x] Unified script `npm run test:all`
- [x] Coverage for status transitions and AI tool calling

### SDD & GenAI Report (README.md)

- [x] SDD section with architecture and database design
- [x] GenAI Report section
- [x] Updated test counts
- [ ] Document stack deviation (NestJS vs Next.js) and rationale

---

## CI/CD

- [x] GitHub Actions workflow: unit tests → E2E → build → docker build
- [x] PostgreSQL service container in CI
- [x] `prisma generate` + `prisma db push` in E2E setup
- [x] Concurrency group to cancel duplicate runs

---

## Pending Items — Priority

### 🟡 Medium (improve score)

1. [ ] Integrate real LLM (Vercel AI SDK or OpenAI/Anthropic SDK) while keeping deterministic validation
2. [ ] Export/commit static `swagger.json` (or document generation at `/api`)
3. [ ] E2E test for PENDING → PROCESSING transition via background job
4. [ ] NestJS stack rationale in README
5. [ ] Implement `CREATE_ORDER` intent in the agent

### 🟢 Low (nice-to-have)

6. [ ] Multi-instance concurrency test for background job
7. [ ] Expand prompt injection detection patterns
8. [ ] Migrate background job to `@nestjs/schedule` (already in dependencies)

---

## Verification Commands

```bash
# All tests
npm run test:all

# Start full environment
cp .env.example .env
docker compose up -d
```

---

## Revision History

| Date | Change |
|------|--------|
| 2026-06-14 | Initial creation — full codebase vs PDF analysis |
| 2026-06-14 | Fixes: Prisma CANCELLED, DTOs, Dockerfile, E2E, CI/CD — 169 tests passing |
