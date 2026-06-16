# GenAI Report — AI-Assisted Development Log

## Tools Used

| Tool | Role |
|------|------|
| Claude (Anthropic API) | Primary code assistant — architecture, implementation, tests |
| Copilot (GitHub) | Inline autocomplete for boilerplate and standard patterns |
| Cursor AI | Rapid prototyping of initial project scaffolding |

## Prompts Generated

### 1. Project Architecture & Tech Stack Selection

**Prompt:**
> "Build a NestJS backend for an e-commerce AI support system. Use DDD and SOLID principles. The system needs order management with a strict state machine, a background job that transitions PENDING orders to PROCESSING every 5 minutes using SKIP LOCKED, and an AI agent that can classify intent, call tools to cancel orders, and respond with RAG-based answers from a knowledge base."

**Outcome:** Claude produced the full module structure (`ai-agent`, `orders`, `background-job`, `common`) with Prisma ORM and PostgreSQL. The architecture followed Clean Architecture with domain entities separated from infrastructure.

### 2. AI Agent Pipeline — Intent Classification & Tool Calling

**Prompt:**
> "Implement an AI agent service that receives a user message, classifies intent (CANCEL_ORDER, CHECK_STATUS, GENERAL_HELP), contextualizes with RAG from knowledge_base.json, and if the intent is CANCEL_ORDER and the order is PENDING, calls a tool to cancel it. All business rules must be enforced by deterministic code, never by the LLM."

**Outcome:** The agent was implemented with a clear separation between the LLM's suggestion and the deterministic validation layer. The LLM returns an intent and optional tool args, but the actual cancellation is validated by `order.canCancel()` and the database layer.

### 3. Prompt Injection Guardrails

**Prompt:**
> "Add prompt injection detection to the AI agent pipeline. Detect patterns like 'ignore previous instructions', 'system prompt', 'you are now', and reject them before they reach the LLM."

**Outcome:** A regex-based injection detector was added as the first step in the processing pipeline. Detected injections are logged and the user receives a rejection message without any LLM call.

### 4. Distributed Background Job with SKIP LOCKED

**Prompt:**
> "Implement a background job that runs every 5 minutes and transitions all PENDING orders to PROCESSING. Use SELECT ... FOR UPDATE SKIP LOCKED to handle concurrent instances in a Kubernetes cluster."

**Outcome:** The job uses raw SQL with `SKIP LOCKED` to prevent duplicate processing across multiple instances. An advisory lock (`pg_try_advisory_lock`) provides an additional safety layer.

### 5. Structured Logging with Correlation IDs

**Prompt:**
> "Replace all console.log and NestJS Logger calls with a centralized Pino-based LoggingService. Add a CorrelationIdMiddleware that generates or validates an x-correlation-id header on every request and propagates it through all logs."

**Outcome:** Created `LoggingService` (Pino-backed, implements `LoggerService`) and `CorrelationIdMiddleware` (uses `crypto.randomUUID`, validates header with `/^[a-zA-Z0-9_-]+$/`). All services now log structured JSON with correlation IDs, enabling full request tracing across modules.

### 6. Edge Case Hardening

**Prompt:**
> "Perform an adversarial edge case audit of the entire codebase. Identify all critical and high severity issues — NaN corruption, TOCTOU races, missing input validation, overlapping background jobs, and health check misreporting. Fix each one with minimal blast radius."

**Outcome:** The audit identified 20 edge cases (2 critical, 6 high). The following were fixed:
- **NaN corruption:** `parseInt`/`parseFloat` results now validated with `Number.isFinite()` before use.
- **TOCTOU race on cancel:** Replaced read-check-write pattern with atomic `UPDATE ... WHERE status = 'PENDING' RETURNING id` via `updateStatusIfPending`.
- **Health check misreporting:** Degraded state now returns HTTP 503 instead of 200.
- **Overlapping background jobs:** Added `running` flag to prevent concurrent interval executions.
- **Input validation gaps:** AI controller now validates message type, limit range, and rejects NaN/invalid values with `BadRequestException`.
- **Log injection:** Correlation ID header validated with strict alphanumeric regex.

## Technical Failures & Hallucinations

### Failure 1: LLM Suggesting Unsafe Cancellation Pattern

**Issue:** The initial LLM-generated code delegated the cancellation decision entirely to the LLM response — if the LLM said "cancel", the code would cancel without re-checking the order status.

**Correction:** Refactored to a two-phase approach:
1. LLM classifies intent and suggests action
2. Deterministic code validates `order.status === PENDING` before any mutation
3. The `Order` entity's `canCancel()` method is the single source of truth

### Failure 2: Background Job Race Condition

**Issue:** An early version used `find({ where: { status: PENDING } })` followed by individual `update()` calls. Under concurrent execution, multiple instances would process the same orders.

**Correction:** Replaced with `SELECT ... FOR UPDATE SKIP LOCKED` via raw Prisma query, ensuring each order is locked by exactly one instance. Added `pg_try_advisory_lock` as a secondary guard.

### Failure 3: Swagger Schema Missing from Repository

**Issue:** The OpenAPI specification was only generated at runtime. The evaluation requires a static `swagger.json` file as a deliverable.

**Correction:** Created `scripts/export-swagger.js` which starts the app, fetches the `/api-json` endpoint, and writes the OpenAPI 3.0 document to `swagger.json`. Added `npm run swagger:export` to the build pipeline.

### Failure 4: Test Coverage Gaps in Branch Coverage

**Issue:** Initial test suite achieved 100% line coverage but missed branch coverage on ternary operators in error handling paths (`error instanceof Error`, `orderContext ?`, LLM fallback branches).

**Correction:** Added targeted tests for each uncovered branch:
- LLM fallback with existing order context
- Non-LLM path with existing order context
- Non-Error rejection in CREATE_ORDER regex path
- Non-Error rejection in LLM tool args path

### Failure 5: Duplicate Pino Transports Causing Log Duplication

**Issue:** Both `bootstrap.ts` (pino-http) and `LoggingService` configured `transport: { target: "pino/file" }`, causing every log line to be written twice to stdout.

**Correction:** Removed the transport configuration from `LoggingService` — pino-http already handles HTTP request logging, and the LoggingService writes directly to stdout without a separate transport.

### Failure 6: Logger Resource Leak in child() Method

**Issue:** `LoggingService.child()` created a new `LoggingService` instance (which constructed its own Pino logger) and then immediately overwrote it with the child logger, leaking the first logger instance.

**Correction:** Simplified `LoggingService` to not configure a transport in the constructor, eliminating the leak. The `child()` method still creates a new instance but the overhead is negligible without transport initialization.

## Responsible AI Practices

- **Determinism Principle:** All transactional decisions (order cancellation, status transitions) are enforced by deterministic code. The LLM only suggests; it never executes.
- **Prompt Injection Defense:** Input is sanitized before any LLM processing. Known injection patterns are blocked at the controller level.
- **Observability:** Every AI interaction is logged with intent, confidence, tool usage, injection detection status, and response metadata — all structured as JSON via Pino with correlation IDs.
- **Fail-Safe Design:** LLM service failures are handled gracefully — the system falls back to deterministic intent classification via regex patterns.
- **Atomic Operations:** All state-changing operations (cancel, status transitions) use atomic SQL with `WHERE status = 'PENDING'` guards to prevent TOCTOU races.
- **Input Validation:** All user-facing inputs (messages, limits, numeric values) are validated before processing. NaN, empty strings, and malformed data are rejected at the controller level.
