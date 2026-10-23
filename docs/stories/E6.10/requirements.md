# E6.10: Approve Session-Link and Presentation Access Policy

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Product decisions recorded 2026-10-23; implementation remains blocked pending API/security contract review and dependent policy decisions
- **User story:** As the product owner, I want the access and lifecycle rules for a session-level participant link and presentation display explicitly decided so implementation cannot accidentally broaden access or weaken ballot privacy.

## Acceptance Criteria
- Decide whether one stable link replaces current position-scoped nomination links and poll-scoped voting links, and define exactly which active session and current phase it can resolve.
- Define behavior when there is no active intake or poll and when the session ends, using generic states that do not reveal another session or historical poll.
- Decide who may use the session link, whether it is a bearer capability, forwarding expectations, expiry, revocation, and server-side tenant authorization.
- Decide whether browser-profile ballot uniqueness remains once per poll or changes across rounds/session; specify whether a profile may submit a ballot in each successive round.
- Preserve the directed lifecycle: active poll shows ballot without totals; closed-unrevealed and reopened polls show the approved generic unavailable/inactive response; closed-revealed current poll shows only the approved aggregate snapshot in both participant and presentation views; a subsequent close requires a new reveal.
- Confirm which aggregate fields appear in the shared guest/presentation result view and how historical results remain separate from the session link.
- Define presentation-session authorization, how it is started/hidden/ended, and its audience. Presentation is read-only and independent from the guest link's poll lifecycle where directed.
- Record audit, retention, and privacy requirements for nomination change history/tombstones and presentation access/events.
- Record policy decisions in product requirements, product decisions, technical/API contract, and UX design before implementation stories proceed to contract review.

## Product Owner Decisions (2026-10-23)

- Keep two separate surfaces and capabilities. The participant link is for nomination/voting participation. The presentation view is a separate admin-managed committee display; neither capability grants access to the other's controls or data beyond the explicitly approved shared results snapshot.
- Replace position-scoped nomination and poll-scoped voting links with one stable, unexpired bearer participant link for an election session. It resolves only that session's server-authorized current phase. The administrator can revoke it; it becomes unavailable when the session ends. The link never resolves another session, historical poll/report, admin data, or presentation controls.
- Use one generic unavailable response for no active phase, ended, expired, revoked, or unauthorized session links. Do not disclose whether a session, poll, ballot, or historical result exists.
- Preserve one ballot per browser profile per poll, editable while that poll is active. A new round is a new poll and permits a ballot from the same profile. The opaque per-poll credential-to-ballot association remains usable while that poll may be reopened/current; invalidate it when a later round supersedes that poll or the session ends. This is a profile-level safeguard, not proof of one vote per person. Credential storage/recovery, cleared-storage behavior, and operational retention remain under PD-004.
- An active poll shows the ballot and no totals. Closing without reveal shows the generic inactive response. Explicit admin reveal publishes the current round's approved aggregate snapshot through the participant link; only candidate names and aggregate vote totals are approved. Do not show participation counts/status, recommendations, candidate decisions, identities, individual ballots, or history. Reopening immediately removes the results as current content; another close requires another reveal.
- The presentation view is opened from an authenticated admin action, preferably in a new tab, and remains read-only. Show/hide/end are controlled independently from participant-link phase resolution. Hiding or changing context clears presentation content; reopening a poll clears its current results there as well. The presentation displays the same approved aggregate snapshot, not the admin decision workspace.
- Record admin-confirmed nomination edits, removals, reordering, and restoration with before/after values, actor, and time as election history. Audit presentation start/hide/end and policy-relevant changes, but do not log individual viewers or link credentials. Retention of these records follows the separate historical/report retention decision in PD-006/PD-005 and E8.2.

## Remaining Decisions and Implementation Gate

- Historical report audiences, fields, exports, access duration, and retention remain unresolved under E6.4, E8.2, PD-006, and PD-012. The participant link does not authorize historical reports.
- Ballot-profile credential storage mechanism, recovery, cleared-storage behavior, and operational retention remain unresolved under PD-004.
- E6.10's policy decisions are recorded. Before E6.8/E6.11 implementation, review tenant-scoped server authorization, link revocation and session-end handling, cache invalidation, audit boundaries, and API contract details against these decisions. No API endpoint or implementation design is approved by this discovery decision alone.

## Scope and Dependencies
Decision/discovery story only. Depends on the product owner/security review of E6.8 UX design, E6.4/E6.5, PD-006/PD-012, and ballot-profile policy PD-004. Does not implement links, access control, results UI, or QR codes.

## Security Constraints
A session link must never resolve another session, historical poll/report, admin data, or presentation controls. Link possession does not establish a person's identity. Enforce church tenant boundaries and lifecycle state server-side.
