# US-005: Register a Church

- **Epic:** POC Identity and Onboarding
- **Priority:** P0
- **Workflow status:** Implemented for local demonstration; formal acceptance not recorded
- **User story:** As an authenticated administrator, I can register a new church so its elections and users have a tenant to belong to.

## Acceptance Criteria
- An authenticated account can create a church using its name.
- The creating administrator becomes the initial administrator for that church, with membership and role recorded server-side.
- Church records have stable identifiers; all subsequent church-owned records are associated with exactly one church.
- A `My churches` view lists the authenticated administrator's church; church creation is available to an account with no church.
- The POC enforces exactly one admin per church and one church per admin; election access derives the church from the authenticated account, not a process-wide church setting.
- Tests cover create/list authorization, no-election-access-before-church, and cross-church election denial.

## Scope and Dependencies
Local onboarding and tenant association. Depends on US-004 and US-002. Church profile fields beyond name and multi-church production policy are unresolved.

## Relevant Decisions
The account creator becomes sole admin; each POC admin owns one church. `My churches` is part of the local flow.

## Implementation Notes and Limitations
Backlog says the flow is implemented locally. It also notes that migrated elections may remain associated with unclaimed church records requiring manual handling before a registered account can manage them. Production hardening is deferred.
