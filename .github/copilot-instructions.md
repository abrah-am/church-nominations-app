# Repository Instructions

Church Nominations App uses React/TypeScript/Vite in `apps/web` and Java/Spring Boot/Gradle with PostgreSQL/Flyway in `apps/api`.

## Context

- Use `README.md`'s Code Map to locate relevant domains and components.
- For a story, read its `requirements.md`; read `handoff.md` when resuming.
- Search relevant sections of product and technical docs. Load more context when needed for dependencies, API contracts, privacy, authorization, tenant isolation, data handling, or correctness.
- Search source before opening files, and avoid rereading unchanged context.

## Engineering

- Follow existing architecture and keep changes focused; avoid unrelated refactors and unjustified dependencies.
- Preserve tenant isolation, authorization, ballot confidentiality, and voter privacy.
- Add or update focused tests for changed behavior. Do not claim checks passed unless executed.
- Never commit credentials or secrets.

## Workflow

`docs/development-workflow.md` is authoritative for phases, approvals, delegation, QA evidence, review, and handoffs. Do not implement unapproved scope.

Do not merge or deploy without explicit authorization. Preserve unrelated work and report changed files and executed checks.