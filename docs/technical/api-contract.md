# API Contract: Session Participant and Presentation Access

**Status:** Policy and security boundary contract approved 2026-10-23 in E6.10; endpoint shapes and implementation require story-level design/review.

This contract records the E6.10 boundary conditions for E6.8 and E6.11. It does not prescribe endpoint paths, payload schemas, token formats, or transport mechanisms.

## Separate Capabilities

- **Participant session link:** An unexpired, forwardable bearer capability scoped to exactly one election session. An authorized admin may revoke it; it becomes unavailable when its session ends. It resolves only that session's server-authorized current nomination/voting phase or viewer state. During an active poll it presents the voter ballot without totals by default. When the authenticated admin enables **Show audience presentation**, it may also receive the current aggregate snapshot. After close it transitions out of ballot mode; viewer totals remain governed by the presentation control.
- **Presentation view:** A separate, read-only view opened through an authenticated admin action, optionally in a new tab. Presentation show/hide/end is admin-controlled and independent of participant-link phase resolution. It does not use or expose the participant capability.
- **Viewer capability:** Read-only access to approved content of one participant or presentation session. When presentation is off, the viewer sees a neutral voting-results state; when on, it receives only the approved current aggregate snapshot. The admin-only presentation control governs both viewer surfaces. A viewer cannot invoke admin mutations or presentation controls, or access other sessions. “Viewer” is not a third authenticated application role; the presentation session authorization mechanism must be defined by its implementation story.
- Neither capability authorizes admin mutations, another session, historical reports, or the other's controls. All tenant and lifecycle checks are server-side.

## Participant Phase Resolution

| Server state | Participant response |
| --- | --- |
| Current nomination intake is active | Current position's nomination intake |
| Current poll is active; presentation off | Current poll ballot; no totals, participation status, or voter identity |
| Current poll is active; presentation on | Current poll ballot plus candidate names and current aggregate totals only |
| Current poll is closed; presentation off | Neutral read-only viewer mode; no totals, ballot activity, or result data |
| Current poll is closed; presentation on | Candidate names and final aggregate vote totals for that round only |
| Current poll is reopened | Current poll ballot; previously closed totals are cleared until presentation is enabled again |
| No active phase, session ended, link revoked, or unauthorized | Same generic unavailable response; do not disclose whether session, ballot, or results exist |

When the poll closes, the participant leaves voter/ballot mode and enters viewer mode. The admin receives final aggregate results without a separate reveal operation. Viewer mode shows totals only while presentation visibility is enabled; hiding clears the projection. The resolver must never fall back to another session, a historical poll, or stale cached results. Reopening clears closed results as current viewer content; the same control may publish live totals again.

The authenticated admin result path is separate from participant and presentation viewer paths. The admin may view live aggregate totals during an active poll and final totals after closure. Viewer result access depends on admin-controlled presentation visibility. No viewer route may expose the admin-only candidate decisions.

## Ballot Profile Credential

- Enforce at most one ballot per browser-profile credential per poll; allow replacing that ballot while the poll is active.
- A later round is a new poll and permits the same profile to submit a new ballot.
- Keep the opaque per-poll credential-to-ballot association available while its poll may be reopened/current. Invalidate it when a later round supersedes that poll or the session ends.
- Do not associate the credential with a named participant or board member, expose it to church users, or include it in logs/telemetry. It is a profile-level safeguard, not proof of one vote per person.
- Credential storage mechanism, recovery, cleared-storage behavior, and operational retention remain unresolved under PD-004/E8.2.

## Presentation View

- Require an authenticated, tenant-authorized admin action to open or control presentation visibility. The audience view remains read-only; its show/hide/end actions are not available from that surface.
- The viewer read path must not authorize or route to nomination write operations. Keep admin credentials and mutation capabilities out of the viewer context.
- Display only server-confirmed, approved content. When voting-result presentation is enabled, use the same aggregate snapshot as the participant link: candidate names and aggregate vote totals only. Turning it off clears both viewer projections.
- Do not expose participation counts/status, voter identities, individual ballots, recommendations, candidate decisions, audit details, or historical results.
- Hiding, ending, changing context, or losing authoritative connectivity clears presented content. Reopening a poll invalidates its results as current content in both presentation and participant views.
- Follow E6.9's policy: removed nominations leave the active list and are represented in the admin Removed section. Persist append-only nomination change events for confirmed corrections (before/after), removals (including selected reason such as duplicate or declined), and restorations. After explicit reveal, the separate read-only presentation tab receives the confirmed active list and these events live. Do not expose submitter/device identity, admin account email, credentials, or unrelated audit details. Audit presentation start/hide/end without logging individual viewers or link credentials. Retention periods remain under PD-005/PD-006/E8.2.

## Security and Validation Requirements

- Scope every participant capability to one session and enforce tenant ownership on every request.
- Return indistinguishable generic unavailable behavior for absent, ended, revoked, and unauthorized session capabilities.
- Prevent caches from serving results as current after reopen, phase change, revocation, or session end.
- Verify admin aggregate responses contain no voter identity or ballot-level choice data. Verify participant/presentation totals are absent while presentation is off and present only as candidate aggregates while it is on; neither viewer response contains admin decisions or historical data.
- Verify presentation routes cannot be loaded or controlled through the participant capability and cannot mutate election state.

These are acceptance/security invariants for dependent stories, not a completed implementation review of routes or code. Each implementation story must define concrete endpoint authorization, revocation enforcement, cache controls, and persistence mechanisms, then verify them with focused tests and review.

## Future contract changes (Product Owner approved 2026-11-10; not implemented)

The existing combined Audience Presentation switch and prohibition on participation aggregates are superseded for the future frontend/API contract:

- Model aggregate result visibility and aggregate participation-count visibility as independent Admin-controlled Presentation settings. Result visibility may change while a poll is open and is independent of poll lifecycle.
- Return only candidate-level aggregate results and the explicitly approved aggregate participation metric when their respective controls are enabled. Never return individual ballots, voter identities, identity-linked participation, or participation-to-choice mappings to either viewer.
- The approved participation metric is ballots cast in the current poll only; do not include an eligible-voter denominator. Define its public API projection, update timing, and empty/hidden states before implementation. Do not infer named participation from aggregate counts.
- Keep voter nomination reads scoped to the current eligible voter's own final submission. Presentation publication, if enabled under nomination policy, remains a separate read projection and must not broaden the participant's own-submission access.
- Keep viewed poll context separate from active participant-session identity. A view selection must not activate or switch a participant session.

These are product policy deltas, not endpoint or schema definitions. M6 must document and reconcile them with verified backend capabilities before any HTTP integration; no backend change is authorized by this decision.

## Nomination Reveal and Shared List (E6.9)

**Revised Product Owner direction, 2026-11-02 and 2026-11-04; implementation contract review pending (PD-017/PD-018/PD-019):** During open intake, the admin may enable the room presentation to show incoming names live; the participant session link must not show open-intake names. If presentation is on at intake closure, it transitions to the closed list and the participant session is published; otherwise post-close Show publishes to both. Hide after closure clears/retracts the list from both viewer surfaces; Show republishes the current server-confirmed list. There is no separate nomination reveal button. Elected outcomes appear on both current-session viewer surfaces, without historical access. For voting, the authenticated admin sees live aggregate totals; the same Audience Presentation switch governs totals on participant and room viewer surfaces. Closing ends ballot access and requires no separate results reveal. A successful poll start supersedes nomination content and must initially hide/clear presentation under E4.7; the admin may enable it again during voting. The detailed operation/API semantics below still describe aspects of current implementation and must be reconciled before revised requirements are implemented.

- Admin nomination GET/SSE returns intake status, name limit, contributor-profile count, reveal flag, and list revision. Before reveal, submissions, proposed-entry count, shared rows, and consolidated names are empty/absent; stream announcements must never include candidate names.
- Closing intake stops public submissions and creates the shared list for authenticated admin review. Admin responses show the names after close, while the presentation projection remains redacted.
- Close atomically freezes the contributor count, materializes shared rows alphabetically by full name (case-insensitive with deterministic ties), preserves duplicate entries with separate IDs, and clears profile/device tokens from raw submissions.
- Admin POST to the position nomination `/reveal` action is allowed only after list creation and publishes the current list to the separately controlled presentation. Repeated reveal is rejected without duplicating rows.
- After close, admin responses include stable shared rows, current revision, a compatible active-name `consolidatedNames` projection, and a separate removed-entry list. Original anonymous submission names remain server-side; profile tokens are null.
- Admin shared-list updates support correction, remove, and restore only. Add and reorder are not supported. A removed entry is omitted from the active list and moved to a separate admin Removed section. Each confirmed correction/removal/restoration appends an immutable event with stable entry identity, action, non-sensitive actor display label, timestamp, correction before/after values when applicable, and a selected removal reason (`DUPLICATE`, `DECLINED`, or `OTHER`) when applicable; `OTHER` requires a reason.
- Every write includes `expectedRevision`; stale revisions return conflict. The server returns confirmed admin state. Presentation receives names only after explicit publication and mirrors confirmed active-list state and nomination change events afterward. The presentation is read-only; all mutations remain in the authenticated admin workspace.
- Admin presentation control is tenant-scoped and authenticated. Starting a presentation returns a URL/capability scoped to that session. The viewer capability is opaque, read-only, revocable by hide/end, and must not contain or receive admin credentials. It authorizes only the presentation snapshot and its read-only event stream; it cannot access admin nomination endpoints, participant links, other sessions, or historical reports.
- Concrete endpoints: admin `POST /api/elections/{electionId}/positions/{positionId}/nominations/presentation` starts/shows the session and returns `{accessToken, viewerPath, visible}`; admin `POST .../nominations/presentation/hide` hides/clears the active viewer projection; admin `POST .../nominations/presentation/end` ends the session and revokes its capability. Audience `GET /api/nomination-presentations/{accessToken}` returns `{revealed, activeNames, events}` and audience `GET .../{accessToken}/stream` sends the same authoritative snapshot shape as SSE. Viewer snapshot and stream are no-store and require no admin authentication.
- The presentation snapshot and event stream are neutral until explicit reveal. After reveal they expose only active shared-list names and the append-only correction/removal/restoration event projection. They exclude Removed-section contents, profile/submission counts, submitter/device identifiers, account email, and unrelated audit data. A reconnect obtains an authoritative snapshot before streaming; hidden, ended, context-changed, or stale sessions clear content and do not present cached data as current.
- Presentation control operations are authenticated admin actions: start/open, hide, and end. Hide clears the current viewer projection without undoing admin edits; end revokes the viewer capability. The audience surface has no mutation or control operations.
- Shared-list update payload is `{expectedRevision, entries, removals}`. `entries` contain stable `id`, corrected `name`, fixed `sequence`, and active state; `removals` contain entry `id`, `reason` (`DUPLICATE`, `DECLINED`, `OTHER`), and optional `detail` (required for `OTHER`). Restore is a separate admin operation referencing the removal event ID and expected list revision. Change events contain `id`, `entryId`, `action`, `beforeName`, `afterName`, `removalReason`, `reasonDetail`, `actorLabel`, and `occurredAt`. The actor label is a stable pseudonym derived from the random account UUID; account email is never persisted in or exposed through nomination change events.
- Presentation SSE CORS permits `Last-Event-ID`; the stream sends an authoritative snapshot on connect/reconnect. Concurrent stream registration, publication, and hide/end clearing are serialized per intake within the API process. This implementation is single-instance POC scope: deployments with multiple API instances require shared revocation/broadcast coordination before scaling beyond one instance.
- Nomination writes remain allowed while no round is active, including during a first-round draft. They are rejected while a round is active. If a draft exists, its candidate roster must be reconciled with the latest active shared-list state before start; stale rosters cannot be started.
- Candidate roster reads for new rounds include active shared rows only. The presentation consumes confirmed read-only shared-list state; no participant link can access it. E6.11 session-link routing remains out of scope.