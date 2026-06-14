---
name: coverage-until-100
description: >-
  Autonomous coverage agent. Runs Jest coverage, identifies gaps in src/,
  adds or adjusts unit tests under test/unit/ (Clean Architecture layout),
  and repeats until global coverage reaches 100%. Use after refactors or when
  coverage thresholds fail.
---

# Coverage Until 100% Agent

## Goal

Reach **100%** global coverage (statements, branches, functions, lines) defined in `jest.config.js`. Do not stop early.

## Workflow

1. Run `npm run test:cov` and capture output.
2. If thresholds pass, run `npm run test:all` and stop.
3. If thresholds fail:
   - Read `coverage/coverage-summary.json` for files below 100%.
   - For each gap, read the source file and the matching spec under `test/unit/`.
   - Add focused tests; prefer domain/application layers over e2e for unit gaps.
   - Exclude pure TypeScript ports/interfaces via `collectCoverageFrom` (e.g. `!src/domain/**/*.repository.ts`) instead of testing interfaces.
4. Repeat from step 1 until `test:cov` exits 0.

## Test layout (Clean Architecture)

```
test/unit/domain/          # entities, value objects
test/unit/application/     # services (use cases)
test/unit/infrastructure/  # repositories, prisma
test/unit/presentation/    # controllers
test/unit/composition/     # modules, bootstrap
test/e2e/                  # HTTP flows only
```

## Commands

```bash
npm run test:cov          # unit + coverage gate
npm run test:all          # unit + e2e
node scripts/coverage-until-100.mjs   # loop helper (CI-friendly)
```

## Rules

- Use Jest (`jest.fn`, `jest.spyOn`), not Vitest.
- Mock at port boundaries (repositories, Prisma), not domain entities.
- Do not lower `coverageThreshold` to pass.
- Do not commit until `test:cov` and `test:all` pass.
