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

## Product-policy conflicts: resolved by Product Owner (2026-11-10)

| ID | Evidence | Disposition |
| --- | --- | --- |
| C1 | Prototype allows aggregate participation on Presentation; the earlier API contract prohibited it | Admin may independently enable aggregate participation counts. Metric is ballots cast for the current poll only, with no eligible-voter denominator; public API projection remains M6 work. Never expose voter identity or ballot data. |
| C2 | Earlier result visibility wording combined reveal with poll closure | Admin independently controls aggregate result visibility, including during an open poll; visibility does not follow poll lifecycle. |
| C3 | Legacy data may use `Declined` as a decision value, while new policy separates decisions and candidate responses | Display historical values as `Declined (Legacy)` without migration. New decisions are Elected, Advanced, Eliminated; responses are Awaiting Acceptance, Accepted, Declined. |
| C4 | Earlier policy created an Advanced-only draft on decision save | Saving decisions creates no poll. Admin explicitly chooses Create Next Poll; Advanced candidates are preselected for review. Historical polls remain unchanged. |

These decisions authorize future frontend mock behavior, not backend changes.
The [product decisions](../../product/product-decisions.md),
[requirements](../../product/requirements.md), and
[API contract](../../technical/api-contract.md) are the current policy sources.
M0 remains read-only; prototype fixture ballots and localStorage migrations are
not production-facing DTOs or persistence requirements.
