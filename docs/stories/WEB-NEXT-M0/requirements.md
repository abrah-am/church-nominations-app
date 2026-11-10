# WEB-NEXT-M0: Frontend foundation

Status: implementation authorized by the Product Owner on 2026-11-09; final acceptance pending.

As a frontend contributor, I want an isolated, tested frontend foundation so
that approved Prototype V2 screens can be implemented incrementally.

## Scope and acceptance criteria

- REQ-001: Create `apps/web-next` with React, TypeScript, Vite, Tailwind CSS,
  shadcn/ui configuration, linting, Vitest and Testing Library. Commit a lockfile
  and document a supported Node version. Build, lint and tests must execute.
- REQ-002: Establish `app`, `domain`, `data` and feature-based boundaries.
  Future Position Workspace features split into nomination, voting, results,
  decisions and history modules as needed, not a monolithic component.
- REQ-003: Port relevant pure, non-conflicting prototype derivations with
  source-linked tests. Keep fixtures and browser storage outside domain logic.
  Preserve append-only election/response history and accepted-opening semantics.
  Do not invent automatic election or next-round behavior.
- REQ-004: Define a small asynchronous, typed, read-only data port and an
  in-memory substitute. Mocks implement the same application-facing contract as
  a future HTTP adapter; they do not duplicate election rules. Clearly distinguish
  this port from approved backend wire schemas. No fabricated HTTP endpoints.
  Missing data rejects explicitly; snapshots cannot mutate stored fixtures.
  Do not expose individual ballots or identity through the port.
- REQ-005: Preserve `apps/web`, `apps/api`, and `docs/prototype-v2` unchanged.
  No Bootstrap dependency or cross-app source imports. No Admin shell, production
  authentication, routing experience, backend work, or functional screen.
- REQ-006: Record API dependencies and apparent policy conflicts separately.
  Do not resolve prototype/product discrepancies by assumption.
- REQ-007: After M0 checks, prepare 2-3 actual visual references for M1 using
  official shadcn blocks/components/themes. Product Owner selection is required
  before visual tokens and Admin shell implementation are authorized.

## Constraints

Prototype V2 remains the approved functional/UX reference. Product decisions
remain authoritative for election policy; apparent conflicts block dependent
implementation, not this tooling-only story. M0 theme values are provisional
neutral defaults, not an approved visual direction.

M0 has no user-facing workflow requiring visual design approval. The development
entry page is an explicitly non-production foundation placeholder. Future screens
require references and validation at 1440px, 390px and 320px, keyboard and
screen-reader checks, and accessibility testing.

## Dependencies and decisions

See [dependencies.md](dependencies.md). Existing auth/tenant isolation and
ballot confidentiality must be enforced server-side when integration is
authorized. M0 does not claim production readiness, mock security or real API
parity. No merge or deployment is authorized.

## UX refinement requested 2026-11-09 (design only)

The Product Owner reviewed A/B/C and prefers A as a foundation, with B's
efficient use of workspace width and a restrained accent palette inspired by C.
This is not final visual approval or M1 implementation authorization.

- Separate application navigation from election context. Use approved
  application destinations only; examples such as Dashboard do not authorize
  new destinations or features.
- Put Church -> Term -> Department -> Position in compact breadcrumbs or
  selectors, not duplicated in the sidebar and header.
- Keep full navigation labels, neutral professional surfaces and restrained
  selected-navigation/status accents.
- Preserve workspace width and demonstrate representative candidate lists,
  voting results and decisions instead of placeholder cards.
- Provide one refined direction at 1440px, 390px and 320px using shadcn
  blocks/components as the visual foundation.
- Preserve Prototype V2 workflows and all unresolved policy holds. References
  are design-only; do not modify application source or implement the shell.

The refined reference requires Product Owner review before M1 may begin.
