# Test Architecture

Tests follow **Clean Architecture** layers, mirroring production code responsibilities (SOLID / separation of concerns).

```
test/
├── unit/
│   ├── domain/              # Entities, value objects, domain rules (no I/O)
│   ├── application/         # Use cases / services (orchestration)
│   ├── infrastructure/      # Adapters: Prisma, repositories, external systems
│   ├── presentation/        # Controllers, DTOs (HTTP adapters)
│   └── composition/         # NestJS modules & bootstrap wiring
├── e2e/                     # Full HTTP flows against real PostgreSQL
└── support/                 # Shared setup, E2E app bootstrap
```

## Commands

| Command | Description |
|---------|-------------|
| `npm test` | Unit tests (Jest) |
| `npm run test:cov` | Unit tests + coverage report |
| `npm run test:e2e` | E2E tests (Jest + Supertest) |
| `npm run test:all` | Unit + E2E |

## Conventions

- Unit specs: `*.spec.ts` under `test/unit/<layer>/`
- E2E specs: `*.e2e-spec.ts` under `test/e2e/`
- Import production code via `@/` path alias (maps to `src/`)
