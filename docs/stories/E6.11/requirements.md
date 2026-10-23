# E6.11: Reuse One Participant Link Across an Active Session

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Blocked by E6.10 policy approval
- **User story:** As a participant, I want one session link to take me to the current nomination intake or voting round on my device so I do not need a new link for each phase or round.

## Acceptance Criteria
- Provide one stable participant link at the active election-session level and an admin share/copy action there. Round-specific screens do not create, copy, or share a new link.
- The link resolves only the server-authorized current phase of its own active session: current nomination intake, current active poll, or the approved closed/revealed results state.
- During an active poll, the link shows the ballot and no totals. When closed but unrevealed, it shows the existing `poll is not active` message. After reveal, it shows the same responsive, read-only results view and approved snapshot as the presentation. Reopening returns it to the inactive message; a later close requires a new reveal.
- As the session moves to a subsequent authorized round, the same URL resolves to that round without requiring redistribution. Ballot edit/uniqueness behavior across polls follows the approved E6.10 policy.
- No-active-phase, ended, expired, revoked, or unauthorized states follow E6.10's approved generic behavior. The link never resolves another session or historical poll/report.
- Resolve lifecycle state and authorization server-side. Prevent cached stale results from being shown as current after reopen or phase change.
- Participant flow is mobile responsive at 320 CSS px without horizontal scrolling, preserves accessible headings/status announcements, and does not associate ballot choices with named attendees.

## Scope and Dependencies
Implementation of the approved stable session link and current-phase resolver. Blocked by E6.10. Depends on US-008, US-011, US-012, E6.9, and the approved session lifecycle/API contract. Does not include presentation controls or QR generation.

## Security and Privacy Constraints
Enforce tenant scope and session lifecycle on every request. Follow approved forwarding, expiry, revocation, and browser-profile uniqueness policies. Never use the session link to access admin data, other sessions, historical reports, or projector controls.
