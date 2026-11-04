# E4.2: Make Ballot Progress and Lifecycle Actions Scannable

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Accepted by Product Owner 2026-11-04; PR pending. Story completion is pending merge.
- **User story:** As an administrator, I want the active voting state and its safe lifecycle actions to be clear in one focused workspace, so I can monitor submissions and end or cancel a round without confusion.

## Acceptance Criteria
- After a round starts successfully, hide the consolidated nomination list and nomination change history from the active-voting workspace; retain them for review outside the active state.
- Show active voting as one primary card in the same position workflow, titled **Voting is active**. Do not retain the **Voting round configuration** title while a round is active.
- Display the active round's count in the form `{received} of {expected} profile/link submissions`, clearly explaining that submissions are not verified people. Do not describe the count as votes or expose candidate totals, rankings, or choices.
- Do not show the separate active-round jump control or the expandable `Round N` row while the round is active.
- Active rounds do not display totals, candidate ranking, or choice information.
- Show **Cancel active voting** and **Close voting** as distinct actions.
- **Cancel active voting** requires explicit confirmation. On confirmation, stop ballot access, mark the active attempt void/reset so its ballots and results cannot inform current or future election decisions, and return to setup with zero ballot/progress/results. Preserve an audit/history record without ballot choices. Do not assume physical deletion; retention follows the approved retention policy. Cancelling the confirmation leaves the active round unchanged.
- **Close voting** ends ballot access and keeps results private until the administrator explicitly chooses **Reveal results**. Automatic viewer reveal when the Audience presentation is enabled is deferred until voting-result viewer support is implemented under E6.8/E6.11. Never reveal ballot choices, voter identity, or participation status.
- Reopen resumes the same round and retains its ballots, but clears any prior revealed result as current content. Reset of a closed round remains distinct and subject to E4.5 policy; reopening and reset actions must not be conflated with active cancellation.
- After reopen, stale revealed results are not shown as current results.
- Failed close/cancel/reveal transitions do not claim success or display stale viewer content as current.
- Controls and confirmation states are keyboard operable and announced accessibly.

## Scope and Dependencies
Active-round administration layout, count display, close, conditional result reveal, and cancellation of an active attempt. Depends on round lifecycle and result-reveal APIs, presentation visibility/reveal contracts in E6.8/E6.10, and reset/retention policy in E4.5/E8.2. The API remains authoritative for lifecycle state, result publication, and authorization.

## Relevant Approved Decisions
Progress denotes profile/link submissions, not verified people. Reopen retains ballots but invalidates stale revealed results as current content. Product Owner direction recorded 2026-11-03: for the local POC, cancelling active voting may use existing reset semantics, permanently deleting ballots and current decisions, returning the round to setup with zero progress/results, and recording the reset event. Production retention remains open. Automatic viewer reveal is deferred until E6.8/E6.11 provide the voting-result viewer contract; until then, close and explicit admin reveal remain separate.

## Implementation Notes and Limitations
Local POC baseline has progress, expected count, manual close, explicit reveal, reopen, and closed-round reset controls. Reuse the reset API for active cancellation only after confirming its active-round guard is deliberately adjusted; its current implementation permanently deletes ballots and decisions. Retain the reset audit event. Do not implement cancellation as UI-only state. Production retention/deletion policy remains open under PD-007/E8.2. Voting-result viewer publication is outside E4.2 and remains dependent on E6.8/E6.11.
