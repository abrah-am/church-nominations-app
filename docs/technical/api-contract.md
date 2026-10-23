# API Contract: Session Participant and Presentation Access

**Status:** Policy contract approved 2026-10-23; endpoint shapes and implementation require story-level design/review.

This contract records the E6.10 boundary conditions for E6.8 and E6.11. It does not prescribe endpoint paths, payload schemas, token formats, or transport mechanisms.

## Separate Capabilities

- **Participant session link:** An unexpired, forwardable bearer capability scoped to exactly one election session. An authorized admin may revoke it; it becomes unavailable when its session ends. It resolves only that session's server-authorized current nomination or voting phase, or the current poll's explicitly revealed aggregate snapshot.
- **Presentation view:** A separate, read-only view opened through an authenticated admin action, optionally in a new tab. Presentation show/hide/end is admin-controlled and independent of participant-link phase resolution. It does not use or expose the participant capability.
- Neither capability authorizes admin mutations, another session, historical reports, or the other's controls. All tenant and lifecycle checks are server-side.

## Participant Phase Resolution

| Server state | Participant response |
| --- | --- |
| Current nomination intake is active | Current position's nomination intake |
| Current poll is active | Current poll ballot; no totals, participation status, or voter identity |
| Current poll is closed and unrevealed | Generic unavailable/inactive response |
| Current poll is closed and explicitly revealed | Candidate names and aggregate vote totals for that round only |
| Current poll is reopened | Generic unavailable/inactive response; prior results are not current |
| No active phase, session ended, link revoked, or unauthorized | Same generic unavailable response; do not disclose whether session, ballot, or results exist |

The resolver must never fall back to a prior phase, another session, a historical poll, or cached results. A subsequent close after reopen does not republish results without another explicit reveal.

## Ballot Profile Credential

- Enforce at most one ballot per browser-profile credential per poll; allow replacing that ballot while the poll is active.
- A later round is a new poll and permits the same profile to submit a new ballot.
- Keep the opaque per-poll credential-to-ballot association available while its poll may be reopened/current. Invalidate it when a later round supersedes that poll or the session ends.
- Do not associate the credential with a named participant or board member, expose it to church users, or include it in logs/telemetry. It is a profile-level safeguard, not proof of one vote per person.
- Credential storage mechanism, recovery, cleared-storage behavior, and operational retention remain unresolved under PD-004/E8.2.

## Presentation View

- Require an authenticated, tenant-authorized admin action to open or control presentation visibility. The audience view remains read-only; its show/hide/end actions are not available from that surface.
- Display only server-confirmed, approved content. For a revealed round, use the same aggregate snapshot as the participant link: candidate names and aggregate vote totals only.
- Do not expose participation counts/status, voter identities, individual ballots, recommendations, candidate decisions, audit details, or historical results.
- Hiding, ending, changing context, or losing authoritative connectivity clears presented content. Reopening a poll invalidates its results as current content in both presentation and participant views.
- Audit presentation start/hide/end and admin-confirmed nomination-list edits, removals, reordering, and restoration with before/after state, actor, and time. Do not log individual viewers or link credentials. Retention periods remain under PD-005/PD-006/E8.2.

## Security and Validation Requirements

- Scope every participant capability to one session and enforce tenant ownership on every request.
- Return indistinguishable generic unavailable behavior for absent, ended, revoked, and unauthorized session capabilities.
- Prevent caches from serving results as current after reopen, phase change, revocation, or session end.
- Verify no open poll response contains aggregate totals; verify no participant response contains admin or historical data.
- Verify presentation routes cannot be loaded or controlled through the participant capability and cannot mutate election state.