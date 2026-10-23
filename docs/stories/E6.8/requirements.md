# E6.8: Present Revealed Session Content on a Read-Only Display

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Backlog; UX approved 2026-10-22; access policy clarified in E6.10 on 2026-10-23
- **User story:** As an administrator presenting an election, I want a read-only display of the approved nomination list or revealed voting results so the room can follow the outcome without seeing controls or private ballot data.

## Acceptance Criteria
- The presentation surface is a separate read-only view opened by an authenticated admin action, optionally in a new tab. Its show/hide/end controls are independent from participant-link phase resolution; the view itself contains no controls or write-capable interactions.
- Before nomination reveal, the presentation shows a neutral holding state without submitted names or intake counts. After reveal, it shows the one shared nomination list and visible change history, with removals clearly identified as removed rather than active.
- A presentation of a voting poll shows results only after the poll is closed and explicitly revealed. It uses the same server-approved aggregate snapshot as the participant session link, limited to candidate names and aggregate vote totals; it never shows live totals, participation status, voter identities, ballot-level choices, recommendations, candidate decisions, or history.
- The current presentation is cleared when hidden, its context changes, or a poll is reopened. Stale/offline content is not represented as current; reconnection fetches the server-authoritative snapshot before resuming.
- Confirmed nomination edits from the admin workspace appear on the presentation. The presentation cannot edit, reveal, hide, reorder, restore, or otherwise change content.
- The results and nomination layouts are responsive: no horizontal scrolling at 320 CSS px, names and totals remain paired, and projector-sized text remains readable without clipping.
- State, loading, error, and unavailable messages are accessible by keyboard and assistive technology; color alone does not convey state.
- Presentation access is tenant-scoped and authorized server-side through the authenticated admin action. Participant links do not grant presentation access or controls, and neither surface grants historical-report access.

## Scope and Dependencies
Read-only audience display for a current revealed nomination list or revealed poll. Depends on E6.9 nomination reveal/list behavior, E6.10 presentation and results access decisions, and US-012 revealed aggregate data. Does not include session-link routing or QR generation.

## Privacy and UX Constraints
Follow [approved UX design](ux-design.md). The display has no editing affordances. Candidate decisions (elect, eliminate, advance) remain in the authenticated admin workspace unless a separate product decision authorizes otherwise. Never expose submitter/device identity or voter-to-choice mappings.
