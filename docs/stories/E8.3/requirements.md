# E8.3: Complete Tenant and Privacy Security Verification

- **Epic:** E8 Privacy, Audit, and Production Readiness
- **Priority:** P0 for production
- **Workflow status:** Partially covered in local POC; full verification not recorded
- **User story:** As a church administrator and voter, I want tenant boundaries and ballot confidentiality enforced server-side.

## Acceptance Criteria
- Every tenant-owned admin endpoint checks church authorization server-side.
- Guest endpoints validate active scoped links; unauthorized and inactive access follows the approved response policy.
- Tests cover cross-tenant reads/writes, ballot replacement authorization, no live totals, and absence of voter-to-choice exposure.
- Logs and audit events exclude credentials and ballot selections.

## Scope and Dependencies
Security verification across all current/future tenant and guest endpoints. Depends on tenant isolation US-002, privacy policy E8.2 and result/link policy E6.4/E6.5.

## Relevant Approved Decisions
API authorization is authoritative; client-side controls do not secure data. Ballot selections and credentials must not enter logs/audit; no live totals.

## Implementation Notes and Limitations
Backlog reports covered cross-church operations and tests, but future endpoints/report routes remain. Complete production verification is not yet established.
