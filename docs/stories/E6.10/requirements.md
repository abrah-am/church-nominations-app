# E6.10: Approve Session-Link and Presentation Access Policy

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (high)
- **Workflow status:** Accepted by Product Owner 2026-10-23; policy and API security boundaries recorded. Implementation is intentionally out of scope; dependent stories retain their own gates.
- **User story:** As the product owner, I want the access and lifecycle rules for a session-level participant link and presentation display explicitly decided so implementation cannot accidentally broaden access or weaken ballot privacy.

## Acceptance Criteria
- Decide whether one stable link replaces current position-scoped nomination links and poll-scoped voting links, and define exactly which active session and current phase it can resolve.
- Define behavior when there is no active intake or poll and when the session ends, using generic states that do not reveal another session or historical poll.
- Decide who may use the session link, whether it is a bearer capability, forwarding expectations, expiry, revocation, and server-side tenant authorization.
- Decide whether browser-profile ballot uniqueness remains once per poll or changes across rounds/session; specify whether a profile may submit a ballot in each successive round.
- An active poll shows the voter ballot without totals. When the poll closes, ballot access ends and the participant link transitions to the same read-only viewer mode used by the presentation.
- On poll close, the authenticated admin may privately preview results. The participant viewer and presentation remain neutral and expose no results or ballot activity until explicit admin reveal.
- After explicit reveal, the participant viewer and presentation show the same approved aggregate snapshot: candidate names and aggregate vote totals only. Do not show participation counts/status, recommendations, candidate decisions, identities, individual ballots, or history in viewer results.
- Reopening immediately clears results as current content from both viewer surfaces. Closing again requires a new explicit reveal.
- Keep separate workflow capabilities for authenticated admin, voter, and viewer. The participant link presents the ballot while a poll is active and becomes viewer-only after close. Neither viewer surface grants admin mutations or presentation controls.
- Record admin-confirmed nomination corrections, duplicate/decline removals, and restorations with before/after values, actor display label, and time. After nomination reveal, the confirmed active list and change events are visible live in the presentation. Do not log individual viewers or link credentials. Retention follows PD-005/PD-006 and E8.2.
- Define presentation-session authorization, how it is started/hidden/ended, and its audience. The presentation is read-only and independent from participant-link phase resolution.
- Record policy decisions in product requirements, product decisions, technical/API contract, and UX design before implementation stories proceed to contract review.

## Product Owner Decisions (2026-10-23)

- Keep the authenticated admin workspace, participant session link, and presentation as separate capabilities. The participant link is the voter surface while a poll is active and becomes a viewer surface after closure. The separate presentation tab is also a viewer surface. Neither viewer surface grants admin mutations or presentation controls.
- Replace position-scoped nomination and poll-scoped voting links with one stable, unexpired bearer participant link for an election session. It resolves only that session's server-authorized current phase. The administrator can revoke it; it becomes unavailable when the session ends. The link never resolves another session, historical poll/report, admin data, or presentation controls.
- Use one generic unavailable response for no active phase, ended, expired, revoked, or unauthorized session links. Do not disclose whether another session, poll, ballot, or historical result exists.
- Preserve one ballot per browser profile per poll, editable while that poll is active. A new round is a new poll and permits a ballot from the same profile. The opaque per-poll credential-to-ballot association remains usable while that poll may be reopened/current; invalidate it when a later round supersedes that poll or the session ends. This is a profile-level safeguard, not proof of one vote per person. Credential storage/recovery, cleared-storage behavior, and operational retention remain under PD-004.
- Closing ends ballot access. The admin may privately review closed-poll results; the participant link and presentation remain neutral viewer surfaces until explicit reveal. Reveal publishes the current round's approved candidate names and aggregate vote totals to both viewer surfaces. Reopening removes results as current content; another close requires another reveal.
- The presentation view is opened from an authenticated admin action, preferably in a new tab, and remains read-only. Show/hide/end are controlled independently from participant-link phase resolution. Hiding or changing context clears presentation content; reopening a poll clears current results there as well.
- Record admin-confirmed nomination corrections, duplicate/decline removals, and restorations with before/after values, actor display label, and time. After nomination reveal, the confirmed active list and change events are visible live in the presentation. Do not log individual viewers or link credentials. Retention follows PD-005/PD-006 and E8.2.

### E6.9 Nomination Edit Scope Clarification (2026-10-23)

E6.9 requires append-only correction, removal-reason, and restoration events. After explicit nomination reveal, confirmed events are visible live to viewers alongside the active list. The admin can review names privately after nomination intake closes; viewer surfaces remain neutral until reveal. This supersedes earlier E6.9 wording that excluded durable correction history or decline reasons. Presentation lifecycle auditing remains separate.
