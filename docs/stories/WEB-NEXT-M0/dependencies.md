# Integration dependencies and policy conflicts

These are not M0 backend tasks. No backend change is authorized by this story.

## Backend implementation dependencies

Treat these as integration work requiring endpoint/schema verification and
separate implementation stories, not permission to rewrite the backend.

| Dependency | Existing evidence | Required before |
| --- | --- | --- |
| Terms/departments and term-scoped context | Product backlog already lists persisted term management as proposed work | Real setup/workspace context |
| Unified nomination/voting poll history and approved roster snapshots | Existing nomination clients expose position-scoped intake; voting has round DTOs | Real poll navigator and nomination history |
| Stable session resolver and separate audience capability | API contract is a policy/security contract, not finalized wire schemas | Voter/Presentation integration |
| Candidate response and position lifecycle persistence | Prototype models append-only responses and lifecycle; PD-020 authorizes policy, not implementation | Acceptance/finalize/reopen integration |
| Decision history/revisions and audit projection | Verify existing decision/undo DTOs and persistence before claiming missing support | History and candidate status integration |
| PD-018 replacement operations | Eligibility/invitation API requires separate design and verification | Vacancy recovery integration |
| Auth, church ownership and authorization mapping | Existing POC auth is dev-only; PD-001 production identity remains open | Any production/admin integration |

M0 ports are application contracts, not claimed existing backend schemas. Future
HTTP adapters must map verified DTOs and pass shared contract tests. Mock mode
must remain explicit; it must never silently replace a failed HTTP request.

## Apparent prototype/product conflicts: escalated, not resolved

| ID | Evidence | Disposition |
| --- | --- | --- |
| C1 | Prototype README/handoff allows separate aggregate participation on Presentation; API contract forbids participation counts/status | Do not implement audience projection in M0; Product Owner clarification before viewer work |
| C2 | Prototype documents closed-only explicit result reveal; PD-019/API contract allow Audience Presentation-controlled live totals | Preserve reference; no publication logic ported; clarify before result/viewer work |
| C3 | Prototype uses `Declined` as a decision status in legacy fixtures; PD-020 distinguishes Elected/Advanced/Eliminated decisions from separate responses | Legacy decision derivation may preserve source values without inventing conversion; no decision-writing UI/port until reconciled |
| C4 | Prototype explicitly creates later polls; PD-019 says valid saved decisions create a fresh Advanced-only draft | No transition/poll-creation logic ported; clarify before decision-saving workflow |

M0 port scope deliberately excludes these behaviors. A pure derivation returning
source status does not authorize exposing a legacy option as an election action.
Likewise, prototype fixture ballots and localStorage migrations are not
production-facing DTOs or persistence requirements.
