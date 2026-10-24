# API Contract: Session Participant and Presentation Access

**Status:** Policy and security boundary contract approved 2026-10-23 in E6.10; endpoint shapes and implementation require story-level design/review.

This contract records the E6.10 boundary conditions for E6.8 and E6.11. It does not prescribe endpoint paths, payload schemas, token formats, or transport mechanisms.

## Separate Capabilities

- **Participant session link:** An unexpired, forwardable bearer capability scoped to exactly one election session. An authorized admin may revoke it; it becomes unavailable when its session ends. It resolves only that session's server-authorized current nomination/voting phase or viewer state. During an active poll it presents the voter ballot; after close it transitions to neutral viewer mode until explicit reveal.
- **Presentation view:** A separate, read-only view opened through an authenticated admin action, optionally in a new tab. Presentation show/hide/end is admin-controlled and independent of participant-link phase resolution. It does not use or expose the participant capability.
- **Viewer capability:** Read-only access to the revealed content of one participant or presentation session. Before reveal, the viewer sees a neutral state; after reveal, it receives only the approved current snapshot. A viewer cannot invoke admin mutations, reveal/hide/end controls, or access other sessions. “Viewer” is not a third authenticated application role; the presentation session authorization mechanism must be defined by its implementation story.
- Neither capability authorizes admin mutations, another session, historical reports, or the other's controls. All tenant and lifecycle checks are server-side.

## Participant Phase Resolution

| Server state | Participant response |
| --- | --- |
| Current nomination intake is active | Current position's nomination intake |
| Current poll is active | Current poll ballot; no totals, participation status, or voter identity |
| Current poll is closed and unrevealed | Neutral read-only viewer mode; no totals, ballot activity, or result data |
| Current poll is closed and explicitly revealed | Candidate names and aggregate vote totals for that round only |
| Current poll is reopened | Generic unavailable/inactive response; prior results are not current |
| No active phase, session ended, link revoked, or unauthorized | Same generic unavailable response; do not disclose whether session, ballot, or results exist |

When the poll closes, the participant leaves voter/ballot mode and enters viewer mode. This viewer mode is neutral until explicit admin reveal; the authenticated admin's private result preview is not returned through participant or presentation viewer paths. The resolver must never fall back to a prior phase, another session, a historical poll, or cached results. A subsequent close after reopen does not republish results without another explicit reveal.

The authenticated admin result-review path remains separate from the participant and presentation viewer paths. Closing may make closed-poll results available to the admin for private preview; it must not change viewer content or reveal state.

## Ballot Profile Credential

- Enforce at most one ballot per browser-profile credential per poll; allow replacing that ballot while the poll is active.
- A later round is a new poll and permits the same profile to submit a new ballot.
- Keep the opaque per-poll credential-to-ballot association available while its poll may be reopened/current. Invalidate it when a later round supersedes that poll or the session ends.
- Do not associate the credential with a named participant or board member, expose it to church users, or include it in logs/telemetry. It is a profile-level safeguard, not proof of one vote per person.
- Credential storage mechanism, recovery, cleared-storage behavior, and operational retention remain unresolved under PD-004/E8.2.

## Presentation View

- Require an authenticated, tenant-authorized admin action to open or control presentation visibility. The audience view remains read-only; its show/hide/end actions are not available from that surface.
- The viewer read path must not authorize or route to nomination write operations. Keep admin credentials and mutation capabilities out of the viewer context.
- Display only server-confirmed, approved content. For a revealed round, use the same aggregate snapshot as the participant link: candidate names and aggregate vote totals only.
- Do not expose participation counts/status, voter identities, individual ballots, recommendations, candidate decisions, audit details, or historical results.
- Hiding, ending, changing context, or losing authoritative connectivity clears presented content. Reopening a poll invalidates its results as current content in both presentation and participant views.
- Follow E6.9's policy: removed nominations leave the active list and are represented in the admin Removed section. Persist append-only nomination change events for confirmed corrections (before/after), removals (including selected reason such as duplicate or declined), and restorations. After explicit reveal, the separate read-only presentation tab receives the confirmed active list and these events live. Do not expose submitter/device identity, admin account email, credentials, or unrelated audit details. Audit presentation start/hide/end without logging individual viewers or link credentials. Retention periods remain under PD-005/PD-006/E8.2.

## Security and Validation Requirements

- Scope every participant capability to one session and enforce tenant ownership on every request.
- Return indistinguishable generic unavailable behavior for absent, ended, revoked, and unauthorized session capabilities.
- Prevent caches from serving results as current after reopen, phase change, revocation, or session end.
- Verify no open poll response contains aggregate totals; verify no participant response contains admin or historical data.
- Verify presentation routes cannot be loaded or controlled through the participant capability and cannot mutate election state.

These are acceptance/security invariants for dependent stories, not a completed implementation review of routes or code. Each implementation story must define concrete endpoint authorization, revocation enforcement, cache controls, and persistence mechanisms, then verify them with focused tests and review.

## Nomination Reveal and Shared List (E6.9)

- Admin nomination GET/SSE returns intake status, name limit, contributor-profile count, reveal flag, and list revision. Before reveal, submissions, proposed-entry count, shared rows, and consolidated names are empty/absent; stream announcements must never include candidate names.
- Closing intake stops public submissions and creates the shared list for authenticated admin review. Admin responses show the names after close, while the presentation projection remains redacted.
- Close atomically freezes the contributor count, materializes shared rows alphabetically by full name (case-insensitive with deterministic ties), preserves duplicate entries with separate IDs, and clears profile/device tokens from raw submissions.
- Admin POST to the position nomination `/reveal` action is allowed only after list creation and publishes the current list to the separately controlled presentation. Repeated reveal is rejected without duplicating rows.
- After close, admin responses include stable shared rows, current revision, a compatible active-name `consolidatedNames` projection, and a separate removed-entry list. Original anonymous submission names remain server-side; profile tokens are null.
- Admin shared-list updates support correction, remove, and restore only. Add and reorder are not supported. A removed entry is omitted from the active list and moved to a separate admin Removed section. Each confirmed correction/removal/restoration appends a change event with entry identity, action, actor display label, timestamp, correction before/after values when applicable, and a selected removal reason when applicable.
- Every write includes `expectedRevision`; stale revisions return conflict. The server returns confirmed admin state. Presentation receives names only after explicit publication and mirrors confirmed active-list state and nomination change events afterward. The presentation is read-only; all mutations remain in the authenticated admin workspace.
- Candidate roster reads for new rounds include active shared rows only. The presentation consumes confirmed read-only shared-list state; no participant link can access it.