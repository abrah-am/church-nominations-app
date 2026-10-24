# E6.11: Reuse One Participant Link Across an Active Session

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** E6.10 policy approved 2026-10-23; implementation contract review pending
- **User story:** As a participant, I want one session link to take me to the current nomination intake or voting round on my device so I do not need a new link for each phase or round.

## Acceptance Criteria
- Provide one stable participant link at the active election-session level and an admin share/copy action there. Round-specific screens do not create, copy, or share a new link.
- The participant link resolves only the server-authorized current phase of its own election session: current nomination intake, current active poll, or the explicitly revealed current-round aggregate results state. It does not grant access to the separate admin-controlled presentation view.
- During an active poll, the link shows the voter ballot and no totals. When the poll closes, ballot access ends and the participant transitions to the read-only viewer mode used by the presentation. Before explicit admin reveal, this mode is neutral and discloses no results or ballot activity; the admin may privately preview the results. After explicit reveal, the participant viewer and presentation viewer show the same approved candidate names and aggregate vote totals. Reopening clears results as current content and returns both viewer surfaces to neutral; a later close requires a new reveal.
- As the session moves to a subsequent authorized round, the same URL resolves to that round without requiring redistribution. A browser profile may submit once per poll and edit/replace while active. The opaque per-poll credential remains usable while that poll may be reopened/current, then is invalidated when a later round supersedes it or the session ends.
- No-active-phase, ended, revoked, or unauthorized states use the same non-disclosing generic response. The unexpired link never resolves another session, historical poll/report, admin data, or presentation controls.
- Resolve lifecycle state and authorization server-side. Prevent cached stale results from being shown as current after reopen or phase change.
- Participant flow is mobile responsive at 320 CSS px without horizontal scrolling, preserves accessible headings/status announcements, and does not associate ballot choices with named attendees.

## Scope and Dependencies
Implementation of the approved stable participant session link and current-phase resolver. Depends on US-008, US-011, US-012, E6.9, E6.10, and the approved session lifecycle/API contract. The separate presentation view is opened by an authenticated admin action, has independent show/hide/end behavior, and is not part of this story. QR generation is excluded.

## Security and Privacy Constraints
The participant link is a forwardable, unexpired bearer capability that an authorized admin may revoke and that becomes unavailable when its session ends. Enforce tenant scope and session lifecycle on every request. It must never resolve admin data, other sessions, historical reports, or presentation controls. Profile uniqueness is per poll, not proof of one vote per person.
