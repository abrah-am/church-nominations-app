# E4.4: Document and Validate Device-Profile Limitations

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (production policy blocker)
- **Workflow status:** Blocked / Product Owner and security decision needed
- **User story:** Discovery story; define the device-profile behavior and validate that claims match its guarantees.

## Acceptance Criteria
- Decide the intended browser-profile token lifetime, storage, recovery, and cleared-storage behavior.
- UI and documentation do not claim one ballot per real-world person or physical device.
- Validate authorization, tenant scoping, duplicate ballot behavior, and replacement access server-side.

## Scope and Dependencies
Policy and validation; not a guarantee of real-world voter identity. Depends on ballot credential design and privacy/retention decision E8.2.

## Relevant Approved Decisions
Current guarantee is at most one ballot per opaque profile credential per poll, with replacement while active. Clearing browser data or using another profile/device may bypass it. Privacy is not operator-proof anonymity.

## Implementation Notes and Limitations
Device-profile token behavior exists in local POC, but production lifetime/storage/recovery and cleared-storage outcomes remain unresolved (PD-004).
