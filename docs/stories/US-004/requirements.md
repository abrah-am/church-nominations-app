# US-004: Register an Administrator Account

- **Epic:** POC Identity and Onboarding
- **Priority:** P0
- **Workflow status:** Implemented for local demonstration; formal acceptance not recorded
- **User story:** As a prospective church administrator, I can create an application account so I can register a church and administer it.

## Acceptance Criteria
- Open self-registration is allowed in the local `dev` profile; no invitation or approval is required.
- Email is the sign-in username. Passwords are BCrypt-hashed and never returned by registration or account APIs.
- Creating an account alone does not grant access to church data; administrator capabilities require an explicit church membership/role association.
- Automated tests cover successful registration, invalid or duplicate registration, password verification, authentication, and denial of tenant data access without church membership.

## Scope and Dependencies
Local POC registration only. Depends on identity persistence and role/tenant authorization. Password reset email delivery and production identity are excluded.

## Relevant Decisions
Anyone may self-register. Email is username; local auth is enabled only in `dev`. Account creation alone grants no church access.

## Implementation Notes and Limitations
Backlog reports BCrypt-backed PostgreSQL credentials and dev-only HTTP Basic. No mail service or automated password recovery exists. Production identity lifecycle and transport protections are unresolved (E8.1).
