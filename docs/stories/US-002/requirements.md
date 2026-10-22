# US-002: Tenant Data Isolation

- **Epic:** P0 Security Foundation
- **Priority:** P0
- **Workflow status:** Partially implemented in local POC; not formally accepted
- **User story:** As a church user, I can access only my church's application data.

## Acceptance Criteria
- Every tenant-owned operation checks authenticated church membership/role for admins; guest voting operations validate a scoped voting link and its church/election/round context server-side.
- Cross-tenant access attempts fail even when a valid identifier from another church is supplied.
- Tests cover list, detail, update, ballot, and report endpoints for tenant boundary violations.

## Scope and Dependencies
Applies to tenant-owned API operations, including future report routes. Depends on identity and church-membership authorization. Report coverage depends on approved report access policy.

## Relevant Decisions
For the POC, church scope derives from the authenticated account. MVP roles are `admin` and `guest`; guests have no accounts and use scoped voting links.

## Implementation Notes and Limitations
Backlog reports cross-church reads/writes denied on covered election/board/nomination/ballot routes, and registration/business routes fail closed outside `dev`. Production identity/transport hardening, report routes, and coverage for future endpoints remain incomplete.
