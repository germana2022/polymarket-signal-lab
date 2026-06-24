# Repository Guidelines

## Project Structure & Module Organization

This repository is a monorepo with two runnable applications:

- `backend/`: Node.js + TypeScript API and worker (`src/`, `Dockerfile`, `package.json`, `tsconfig.json`, `src/db/schema.sql`).
- `frontend/`: React + Vite dashboard (`src/`, `vite.config.ts`, `index.html`).
- `docs/`: design and API references (`ARCHITECTURE.md`, `API.md`).
- `docker-compose.yml`: local stack (`api`, `worker`, `frontend`, `postgres`, `redis`).
- `.env.example`: environment template; copy to `.env` before running locally.

## Build, Test, and Development Commands

Run these from the repository root unless noted:

- `npm run dev:backend` → starts the backend server in watch mode.
- `npm run dev:worker` → runs background signal jobs in watch mode.
- `npm run dev:frontend` → starts the frontend Vite dev server.
- `npm --prefix backend run build` → type-checks and compiles backend TypeScript.
- `npm --prefix frontend run build` → bundles frontend for production.
- `npm run test` → runs backend tests with Vitest.
- `npm run migrate` (inside `backend/`) → executes DB migration SQL bootstrap.
- `docker compose up --build` → runs the complete local stack.

## Coding Style & Naming Conventions

- Use 2-space indentation and semicolons, matching existing TypeScript style.
- Prefer `camelCase` for variables/functions, `PascalCase` for classes/types, and `kebab-case` file names only when already established.
- Keep shared data shapes in `backend/src/types` and service logic in domain modules (`backend/src/modules`).
- No formatter/linter config is currently enforced in-repo; keep style consistent with adjacent files.

## Testing Guidelines

- Backend tests use Vitest and `*.test.ts` filenames (example: `backend/src/modules/scoring/scoringService.test.ts`).
- Keep unit tests close to implementation.
- Run `npm run test` before pushing behavior changes.
- For integration/API validation, use local endpoints directly (`GET /health`, `GET /api/signals/latest`, etc.) after `docker compose up`.

## Commit & Pull Request Guidelines

- Git history is not present in this workspace (`.git` is not available), so no repository-specific commit convention can be recovered.
- Use Conventional Commits for new work (e.g. `feat: add signal backfill endpoint`, `fix: normalize score threshold logic`, `test: add scoring edge cases`).
- PRs should include:
  - short summary, rationale, and testing performed,
  - linked ticket/issue,
  - API or UI evidence for behavior changes (curl output/screenshot).

## Security & Configuration Tips

- Never commit secrets (`DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, etc.).
- Keep `DATA_MODE=mock` by default for local development.
- Use `DATA_MODE=live` only with approved API credentials and safe limits.
