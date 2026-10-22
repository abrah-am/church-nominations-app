# US-003: Maintain Church Users and Permissions

- **Epic:** P0 Security Foundation
- **Priority:** P0
- **Workflow status:** Partially implemented in local POC; not formally accepted
- **User story:** As an administrator, I can maintain a church's users and permissions.

## Acceptance Criteria
- Admin capabilities are explicit and enforced by the API. Guests have no accounts; ballot access is authorized by an active-poll link. Nomination-submit access will use `admin` or `guest`, not a third role.
- Production identity hardening, account recovery, and any change to the POC one-admin/one-church rule are resolved before production use.
- Role overlap and cross-church access behavior are covered by automated tests.

## Scope and Dependencies
Defines application roles and church-admin authorization. Depends on account registration, church registration, and tenant isolation. Production identity and recovery are tracked separately under E8.1.

## Relevant Decisions
POC assigns the creator sole admin membership; each admin administers one church. MVP roles are only `admin` and `guest`; guests do not sign in.

## Implementation Notes and Limitations
Local email/password admin authentication uses BCrypt and HTTP Basic in `dev`; a church has one admin. Production identity, recovery, and possible cardinality changes remain unresolved.
