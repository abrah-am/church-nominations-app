# E8.2: Define Privacy, Participation, and Retention Policy

- **Epic:** E8 Privacy, Audit, and Production Readiness
- **Priority:** P0 for production policy
- **Workflow status:** Blocked / Product Owner and privacy/security decision needed
- **User story:** Discovery story to define privacy, participation visibility, and retained data.

## Acceptance Criteria
- Decide nomination submission retention/correction behavior and ballot/device-token retention.
- Define what participation status admins may see and ensure it cannot be joined to candidate choices.
- Document the privacy boundary: confidentiality from church users, not unlinkability from system operators or metadata correlation.

## Scope and Dependencies
Cross-product privacy and retention policy. Informs E4.4/E4.5, E6.3-E6.5, E8.3 and US-013.

## Relevant Approved Decisions
Ballot choices are separate from named participation and must not expose voter-choice mapping. The accepted boundary is confidentiality from church users, not system operators or metadata correlation.

## Implementation Notes and Limitations
Exact nomination retention/correction, ballot/profile-token retention, and participation fields remain undecided (PD-004 through PD-006 and PD-008).
