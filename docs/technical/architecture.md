# Architecture (Draft)

**Status:** Proposed architecture approved (2026-10-16); local application foundation implemented. Remaining policy details are listed below.
**Last updated:** 2026-10-16

## Context and constraints

- Two-tier web application: React + TypeScript frontend and REST API backend.
- Confirmed backend: Java/Spring Boot.
- Confirmed database: PostgreSQL.
- Each church is a separate tenant.
- MVP voters are anonymous guest users who access ballots through a received voting link; they do not create accounts or sign in.
- The two application roles are `admin` and `guest`; guests have no account. The local POC uses email/password admin accounts, BCrypt hashes, and HTTP Basic authentication in the loopback-only `dev` profile. One admin account owns one church, and each church has one admin.
- Automated password recovery is not implemented because the POC has no mail service; production identity and transport hardening remain release work.
- Named participation status is needed, while ballot choices must remain confidential from church administrators and other users.
- Aggregate results stay hidden until an administrator closes and reveals a round.
- Historical election rounds and administrative decisions must be reviewable.
- Voter access must work well on mobile.
- Requirements are still in discovery; this is a modular monolith recommendation, not an implementation commitment.

## Recommended stack

| Layer | Recommendation | Rationale and tradeoff |
| --- | --- | --- |
| Frontend | React + TypeScript, Vite | Directly matches the requested UI stack; Vite keeps local development/building simple. It requires a separate API contract and deployment artifact. |
| Backend | Java + Spring Boot | Matches the Product Owner's preference; Spring Security, transactions, validation, and mature persistence support fit the authorization- and integrity-sensitive workflow. It does mean maintaining Java and TypeScript across the two tiers. |
| API | Versioned REST (`/api/v1`) described with OpenAPI | Familiar integration boundary, explicit authorization and response contracts, and generated TypeScript client types. Avoids coupling the browser to backend internals. |
| Database | PostgreSQL | Confirmed by the Product Owner. It supports the transactions and constraints needed for elections, rounds, candidates, eligibility, audit events, and tallies. Row-level security may be considered as defense in depth, but never replaces application authorization. |
| Persistence | Spring Data JPA/Hibernate with reviewed Flyway migrations; use transactions and database constraints for ballot submission | Conventional Spring persistence and schema evolution. Keep ballot submission's uniqueness and transactional guarantees explicit, with reviewed SQL where ORM abstractions obscure the required behavior. |
| Monorepo | `pnpm` workspaces, initially without an orchestration layer | Keeps frontend and API together while keeping install/build workflow straightforward. Add a task orchestrator only when execution time or CI needs justify it. |

### Backend alternatives considered

- **Spring Boot (Java, preferred):** Strong security, transaction, validation, and long-term ecosystem support; selected to match the Product Owner's stated preference. It is more operational/tooling surface than a TypeScript-only stack, but appropriate if Java is the desired backend standard.
- **NestJS (Node.js/TypeScript):** Would share a language with the frontend and has useful modular and validation conventions, but is not the preferred backend in light of the Product Owner's choice.
- **FastAPI (Python):** Strong option if the team is Python-first; fast API development and Pydantic validation. It introduces another language, and TypeScript clients/contracts must be generated or maintained from OpenAPI.

## Application shape

Use a **modular monolith**: one deployable API with explicit domain modules, one web frontend, and one PostgreSQL database. There is no current requirement that justifies microservices or asynchronous infrastructure. Modules should communicate through application services and domain-level contracts rather than reaching into one another's persistence details.

Suggested API modules:

- `identity`: local POC admin registration, password hashing, HTTP Basic authentication, and account lifecycle; production identity/recovery policy remains open. Guest voters use scoped voting-link capabilities instead of accounts. Reports are authorized to `admin` or `guest` according to the report policy still to be specified.
- `churches`: tenant identity and one-admin/one-church assignment for the POC. Election services derive church scope from the authenticated account; no client-supplied church ID is trusted.
- `elections`: department-level election cycle and its ordered positions/opening counts.
- `nominations`: position-scoped nomination links, submissions, consolidation/duplicate resolution, and promotion into a round roster.
- `participants`: eligible voter roster and participation status, separate from ballot contents.
- `candidates`: proposed names, normalization, and round candidate snapshots.
- `rounds`: per-position open/close/reveal transitions, administrator-configured selection counts and rosters, majority information, tie-break rounds, and candidate advancement/removal.
- `ballots`: eligibility validation, one-submission enforcement, exact selection-count validation, and confidential selections.
- `reports`: aggregate views and historical records, authorized to `admin` and/or `guest` according to the report policy still to be specified.
- `audit`: append-only administrative event history, with explicit exclusions for ballot selections and identity links.

The frontend should have distinct administration/configuration, nomination intake, voting, and results/report views. The administrator starts at the department election, selects a position to work on, and completes that position's nomination and voting workflow before moving to the next. The completed election view should visually present all positions and each position's nomination consolidation, rounds, results, candidate progression, and elected people. API authorization remains authoritative; hiding a control in the UI is not a security boundary.

## Proposed monorepo structure

```text
docs/
  product/
    requirements.md
    backlog.md
  technical/
    architecture.md
apps/
  web/                         # React + TypeScript; admin, voter, and report views
  api/                         # Spring Boot REST API and domain modules
    src/main/java/              # Java application and domain modules
    src/main/resources/db/migration/ # Flyway database migrations
packages/
  api-client/                  # Generated TypeScript client from the API OpenAPI schema
tests/
  e2e/                         # Critical cross-tier election flows
```

Keep unit and module-level integration tests close to their owning app unless the approved test tooling calls for a central test directory. Do not add a shared domain package until real duplication exists; use the OpenAPI contract as the frontend/backend boundary.

## Core data boundaries (provisional)

Tenant-owned records should carry a `church_id` (or be reachable only through a tenant-owned parent), and every API query must scope access by the authenticated church membership. Add database constraints that prevent cross-tenant references. If PostgreSQL is selected, consider row-level security as defense in depth after the threat model and connection-pooling approach are defined; with either database, application-level authorization remains mandatory.

Likely entities: `Church`, `User`, `ChurchMembership`, `ElectionCycle`, `PositionElection`, `NominationLink`, `NominationSubmission`, `Nominee`, `ElectionParticipant`, `Round`, `RoundCandidate`, `Ballot`, `BallotSelection`, `RoundResult`, `ElectedCandidate`, and `AuditEvent`. An election cycle belongs to a department and contains ordered positions; each `PositionElection` records its opening count and owns its nomination submissions, rounds, and elected outcomes. Multiple identical openings are handled within one position election; different positions have separate nomination and round histories. The opening count is a hard cap. If more candidates reach majority than openings remain in a multi-selection poll, retain those qualified candidates for one-choice runoff rounds and eliminate other candidates; if nobody has majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh tallies until the remaining openings are filled. The authorized administrator chooses the nomination limit, confirms duplicate consolidation, promotes nominees into the first round, sets each round's selection count, and chooses subsequent rosters; the system does not prescribe a fixed count or sequence. Names and exact relationships are not approved schema.

Voting links do not expire and must be scoped to the intended poll. A link resolves only while its poll is active; otherwise the route returns 404. Links act as bearer capabilities: anyone possessing a valid link can attempt to vote. Guest voters do not sign in, and the application does not verify their real-world identity or expose voter identity to church users. While a poll is active, a guest can edit/replace their choice. Prevent a second submission from the same browser-profile credential, but do not claim this guarantees one vote per real-world person or physical device: browser storage can be cleared and another profile/device can be used. Use an opaque, unguessable per-poll browser-profile token; the token must be stored so the user's ballot can be found and replaced, so it is not unlinkable from that ballot to a system operator. Do not associate it with a known person, restrict access, and avoid including it in logs/telemetry.

Poll setup (roster/candidates) is editable before voting begins and locked while the poll is active. Candidate withdrawal is allowed before start or after the poll has ended, but not during active voting. On poll completion/closure, the admin records which candidates are eliminated or promoted to the next round. Results are revealed per round after closure. The approved two-candidate cutoff may be overridden by an admin, who may also reopen the poll.

Nomination links should be scoped to one position and stored separately from voting links and ballots. Their access, expiration, submission limits, and editing policy remain product decisions. Duplicate detection may offer suggestions, but a person must confirm merges so distinct people are not silently collapsed.

**Confidentiality constraint:** The ballot payload and stored ballot-choice record must not include a guest's name or account identity. An opaque browser-profile token is needed to enforce one ballot per poll on that profile and allow edits; it may be associated with that ballot internally but must not identify a person or be visible to church users. Keep result totals unavailable until the poll is closed and explicitly revealed. Audit records should record administrative decisions, not voter selections. The Product Owner accepts guest voting without accounts; this does not promise anonymity from system operators or against metadata correlation.

This logical separation provides application-level confidentiality from ordinary church users/admins; it does **not** by itself guarantee unlinkability from privileged database/infrastructure operators. Request timestamps, IP/access logs, transaction timing, backups, or correlated records can reveal relationships. Minimize and redact logs, avoid ballot payloads in telemetry, restrict operational access, and set retention for logs. If operator-proof anonymity is required, evaluate blind credentials or a separately controlled ballot box/tally service before approving the data flow; that is a material increase in complexity and needs specialist security review.

## Security and integrity principles

- Authenticate admins and derive their church membership from trusted server-side identity, never from a client-supplied `church_id` alone. Guest voting links must be unguessable, scoped, validated server-side, and treated as bearer credentials.
- Authorize every election, participant, candidate, ballot, and report read/write against tenant and role.
- Treat opening, closing, revealing, and round candidate changes as explicit state transitions with server-side validation and immutable audit entries.
- Use a database transaction and unique constraint/idempotency strategy to guarantee at most one ballot per device-profile token per poll, while allowing the same token to update/replace its ballot during the active poll. Treat this as a device/profile limit, not proof of one vote per person. Keep the token-to-ballot association unlinkable from church user identities and evaluate metadata correlation.
- Require exactly the round's configured number of distinct selections; reject incomplete ballots before submission.
- Count each accepted ballot once toward the denominator; in a multi-selection poll, each candidate selected on that ballot receives one support count. Present strict-majority results as guidance only; authorized admins decide election outcomes and candidate advancement.
- For a two-candidate, one-selection round with an even-sized voter group `N`, automatically close after `N - 1` ballots have been submitted. The admin may override this cutoff and reopen the poll. Fix the group size before voting and implement the cutoff atomically to avoid accepting an unintended ballot past closure.
- Allow admin roster/poll edits only before activation; lock configuration during active voting. Permit withdrawal only before activation or after closure.
- Start tie-break and subsequent rounds with fresh tallies; do not carry prior-round candidate scores forward.
- Never return partial/live totals from an open round, including through aggregate endpoints, error responses, logs, or frontend caches.
- Do not log ballot selections, full ballot request bodies, or credentials. Review access logs for metadata that could correlate voter identity and ballot submission.
- Use TLS in transit, managed secrets, least-privilege database accounts, encrypted backups, and documented restore procedures when hosting is selected.
- Define operational access, retention, incident response, and deletion/correction policy before production data is collected.

## Testing approach

- Unit tests for election-cycle/position state transitions, nomination consolidation, candidate selection validation, and majority/runoff calculations.
- API integration tests for tenant isolation, role authorization, duplicate ballot rejection, ballot/participation separation, hidden results, and reveal behavior using the selected database engine (preferably through disposable real-engine test infrastructure).
- Frontend tests for critical form states and mobile voting interaction.
- A small end-to-end suite for department and position setup, nomination link submission and consolidation, ballot submission, close/reveal, and visual historical election review.
- Security-focused tests must attempt cross-tenant identifier substitution and ensure no ballot-choice endpoint can reveal voter identity or open-round totals.

## Deployment outline (not yet selected)

Deploy the static web frontend and API separately, with the selected relational database as a managed service where available. Hosting provider, region, environment strategy, backup retention, monitoring, and budget are open. Do not commit infrastructure or deployment configuration until those constraints are supplied.

## Remaining decisions before production or dependent workflow implementation

1. Select production identity/transport protections and define automated password recovery; the POC uses local email/password auth and the one-admin/one-church rule.
2. Define the device-profile identifier used to prevent repeat submissions, its storage/recovery behavior, and the consequences of cleared browser storage or switching devices.
3. Define the participant group size before poll activation and how late arrivals/departures affect the even-group cutoff.
4. Define report audiences within the two roles, report fields, export needs, and retention duration; the report category was approved, but these specifics were not stated.
5. Define nomination-link access/edit rules and operational requirements (hosting, availability, backup/recovery, accessibility, languages, privacy/compliance).