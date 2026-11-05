# E4.2: Make Live Results and Voting Status Scannable

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Original scope accepted by Product Owner 2026-11-04; refined live-tally display criteria proposed and awaiting confirmation. PR pending; story completion is pending reconciliation and merge.
- **User story:** As an administrator, I want to see live aggregate results as submissions arrive, so I can decide when to close voting and whether to present the totals to the audience.

## Acceptance Criteria
- After a round starts successfully, hide the consolidated nomination list and nomination change history from the active-voting workspace; retain them for review outside the active state.
- Show active voting as one primary card in the same position workflow, titled **Voting is active**. Do not retain the **Voting round configuration** title while a round is active.
- Display the active round's count in the form `{received} of {expected} profile/link submissions`, clearly explaining that submissions are not verified people. Do not describe the count as votes or expose voter identities, ballot-level choices, or a participation-to-choice mapping.
- Expected submission count is informational only. Reaching it, including an even-group two-candidate threshold, does not stop ballot access or close voting. Only the administrator's explicit **Close voting** action closes an active round; authorized administrators may reopen a closed round under the existing lifecycle rules.
- Do not show the separate active-round jump control or the expandable `Round N` row while the round is active.
- During active voting, show each candidate's live aggregate vote count, percentage of ballots cast, and a proportional visual indicator. Calculate the percentage using ballots cast as the denominator, not the expected submission count or total candidate selections; a ballot selecting multiple candidates contributes once to each selected candidate, so percentages may total more than 100%. Show `0 votes · 0%` with an empty indicator before any ballots are cast.
- Order live results by vote count descending, then candidate name A–Z for ties. Update totals when ballots are accepted or replaced, counting only each profile's latest accepted ballot.
- The Audience Presentation control is available while voting is active and governs whether the same aggregate totals are shown to participants and the room; when off, both viewer surfaces are cleared.
- Show **Cancel active voting** and **Close voting** as distinct actions.
- **Cancel active voting** requires explicit confirmation. On confirmation, stop ballot access, mark the active attempt void/reset so its ballots and results cannot inform current or future election decisions, and return to setup with zero ballot/progress/results. Preserve an audit/history record without ballot choices. Do not assume physical deletion; retention follows the approved retention policy. Cancelling the confirmation leaves the active round unchanged.
- **Close voting** ends ballot access and makes final aggregate totals available in the admin workspace immediately. There is no separate **Reveal Results** action. If Audience Presentation is on, final totals remain visible on both viewer surfaces; if off, both remain clear. Never expose ballot choices, voter identity, or participation status.
- Reopen resumes the same round and retains its ballots, but clears any prior result as current content. Reset of a closed round remains distinct and subject to E4.5 policy; reopening and reset actions must not be conflated with active cancellation.
- After reopen, stale totals are not shown as current on viewer surfaces until the admin enables Audience Presentation again.
- Failed close/cancel transitions do not claim success or display stale viewer content as current.
- Controls and confirmation states are keyboard operable and announced accessibly.

## Scope and Dependencies
Active-round administration layout, count display, live admin totals, audience result visibility, close, and cancellation of an active attempt. Depends on round lifecycle and aggregate result APIs, presentation visibility contracts in E6.8/E6.10, and reset/retention policy in E4.5/E8.2. The API remains authoritative for lifecycle state, result publication, and authorization.

## Relevant Approved Decisions
Progress denotes profile/link submissions, not verified people. Expected count is a planning/display value and never closes or caps an active poll; the administrator intentionally closes voting. Reopen retains ballots but invalidates stale viewer totals until the Audience Presentation control is enabled again. Product Owner direction recorded 2026-11-03: for the local POC, cancelling active voting may use existing reset semantics, permanently deleting ballots and current decisions, returning the round to setup with zero progress/results, and recording the reset event. Production retention remains open. The 2026-11-04 voting-results direction replaces the separate explicit reveal action with live admin totals and toggle-controlled viewer visibility.

## Implementation Notes and Limitations
Local POC baseline has progress, expected count, manual close, explicit reveal, reopen, and closed-round reset controls. Reuse the reset API for active cancellation only after confirming its active-round guard is deliberately adjusted; its current implementation permanently deletes ballots and decisions. Retain the reset audit event. Do not implement cancellation as UI-only state. Production retention/deletion policy remains open under PD-007/E8.2. Viewer publication must share the Audience Presentation control and be authorized/invalidated server-side under E6.8/E6.10/E6.11.
