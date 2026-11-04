# E6.8: Present Revealed Session Content on a Read-Only Display

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Backlog; UX approved 2026-10-22; access policy clarified in E6.10 on 2026-10-23
- **User story:** As an administrator presenting an election, I want a separate presentation tab to show the revealed nomination list and its confirmed live changes, or revealed voting results, so the room can follow and verify the process without access to admin controls or private ballot data.

## Acceptance Criteria
- The presentation surface is a separate read-only view opened by an authenticated admin action, optionally in a new tab. Its show/hide/end controls are independent from participant-link phase resolution; the view itself contains no controls or write-capable interactions.
- **Product Owner updates (2026-11-02 PD-017/PD-018; 2026-11-04 PD-019):** During open intake, enabled presentation may show incoming nominations to the room only. If it is on at closure, the closed list also publishes to participants; otherwise post-close Show publishes to both. Hide after closure retracts the list from both viewers. Poll start hides/clears presentation under E4.7; during voting, enabling the Audience Presentation switch shows current aggregates on both viewer surfaces, and closing requires no separate result reveal. Elected outcomes appear on both current-session viewer surfaces; candidate decisions remain admin-only.
- Before nomination reveal, the presentation shows a neutral holding state without submitted names or intake counts. After reveal, it shows the active shared nomination list and an append-only, chronological change log. Confirmed corrections, duplicate/decline removals, and restorations are reflected live; removed names are not active rows but removal events remain visible in the log.
- A presentation of a voting poll shows aggregate totals only while the admin has enabled **Show audience presentation**. This applies during active voting and after close. Turning the control off clears results from both the presentation and participant session viewer. Closing ends ballot access and makes final totals available to the admin without a separate reveal action. Viewer results are limited to candidate names and aggregate vote totals; they never show participation status, voter identities, ballot-level choices, recommendations, candidate decisions, or history.
- The current presentation is cleared when hidden, its context changes, or a poll is reopened. Stale/offline content is not represented as current; reconnection fetches the server-authoritative snapshot before resuming.
- Confirmed nomination edits from the admin workspace appear on the presentation in real time. The presentation cannot edit, reveal, hide, reorder, restore, or otherwise change content. The authenticated admin workspace is the sole write surface.
- The results and nomination layouts are responsive: no horizontal scrolling at 320 CSS px, names and totals remain paired, and projector-sized text remains readable without clipping.
- State, loading, error, and unavailable messages are accessible by keyboard and assistive technology; color alone does not convey state.
- Presentation access is tenant-scoped and authorized server-side through the authenticated admin action. Participant links do not grant presentation access or controls, and neither surface grants historical-report access.

## Scope and Dependencies
Read-only audience display for a current revealed nomination list or revealed poll. Depends on E6.9 nomination reveal/list behavior, E6.10 presentation and results access decisions, and US-012 revealed aggregate data. Does not include session-link routing or QR generation.

## Privacy and UX Constraints
Follow the current prototype and approved voting visibility direction. The display has no editing affordances. Candidate decisions (elect, remove, advance) remain in the authenticated admin workspace. Never expose submitter/device identity or voter-to-choice mappings.

## Roles and Capabilities

- The **admin** is authenticated and alone can change nominations or control reveal/presentation lifecycle.
- A **viewer** is the read-only audience using the presentation view. Viewers see only the currently revealed, server-confirmed content and live change history; they cannot access nomination mutations or admin controls.
- “Viewer” describes a presentation capability, not a third authenticated application role. Presentation access is scoped to its session and follows E6.10 authorization/security requirements.
