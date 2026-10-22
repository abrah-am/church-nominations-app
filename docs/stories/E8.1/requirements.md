# E8.1: Resolve Production Identity and Account Lifecycle

- **Epic:** E8 Privacy, Audit, and Production Readiness
- **Priority:** P0 for production release
- **Workflow status:** Blocked / Product Owner decision needed
- **User story:** Discovery story to select production administrator identity and account lifecycle.

## Acceptance Criteria
- Select production identity provider and define email verification, account lifecycle, admin recovery, and session/token policy.
- Retain the local POC behavior only for local development; document the deployment boundary and required transport protections.

## Scope and Dependencies
Production admin identity; guest voters remain account-free. Blocks production exposure and depends on operational/security decisions.

## Relevant Approved Decisions
POC uses email/password, BCrypt, HTTP Basic only in `dev`, open self-registration, one admin per church and one church per admin. Automated recovery is unavailable without mail service. These local decisions do not resolve production identity.

## Implementation Notes and Limitations
Production identity/transport hardening and password recovery are explicitly release prerequisites. Church profile and multi-church rules are related open policies (PD-002).
