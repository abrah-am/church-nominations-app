# US-001: Reproducible Local Database Environment

- **Epic:** P0 Developer Foundation
- **Priority:** P0
- **Workflow status:** Implemented locally; formal acceptance not recorded
- **User story:** As a developer, I can start the local PostgreSQL database with one command so I can run the API and verify migrations without provisioning a database manually.

## Acceptance Criteria
- A pinned PostgreSQL major version starts through Docker Compose and binds only to the local host interface.
- A health check reports when PostgreSQL is ready; a named volume preserves local data between container restarts.
- Local credentials are configurable via an ignored `.env` file with a non-secret example template; no production credentials are committed.
- Documentation covers start/stop, API environment variables, Flyway startup migration, and how to reset the local data volume.
- A real PostgreSQL-backed API test/build verifies Flyway migrations and election setup persistence; H2-only results do not satisfy this check.

## Scope and Dependencies
Local developer environment, Compose and migration verification. Depends on Docker Compose and PostgreSQL-backed integration-test infrastructure. Production database operations are excluded.

## Implementation Notes and Limitations
Backlog reports PostgreSQL 16 Compose, loopback binding, readiness health check, named volume, ignored `.env` configuration, start/stop/reset documentation, and a Testcontainers migration/election persistence test as implemented. Treat as local implementation evidence, not formal acceptance.
