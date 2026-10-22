# E4.5: Reset a Closed Voting Round and Start a Fresh Attempt

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Decision needed before implementation
- **User story:** As an authorized administrator, I want to reset a closed round when its voting attempt must be discarded, so voting can restart from zero with a newly configured selection count and expected voter count.

## Acceptance Criteria
- Reset is distinct from Reopen voting and available only for a closed round when no later round has started. Active rounds cannot be reset; the admin must close them first.
- Before reset, show confirmation naming the round and warning that ballot count and revealed results (if any) will be voided and excluded from election decisions. Require explicit confirmation; cancel leaves the round unchanged.
- On confirmation, mark the prior attempt reset/voided so ballots/results cannot be used for current or future election decisions. Retain audit event with actor, timestamp, round, optional reason; never include ballot choices. Physical deletion versus restricted retention follows approved retention policy.
- Preserve the closed round's candidate roster as starting roster for a fresh draft. Require allowed selections and expected voter count again; new attempt begins with zero ballots and no prior tally or participation count.
- Preserve reset/voided status in history, distinguish it from normal closed/revealed, and prevent reopening the old attempt.
- If a later round has started, prevent reset and explain the reference; do not cascade-delete later rounds.
- Tests cover authorization, active-round rejection, cancel, successful reset, zeroed progress/results, fresh configuration, audit/history, and rejection when a later round has started.
- Reset is a distinct action from **Reopen voting** and is available only for a closed round when no later round has started. Active rounds cannot be reset; the admin must close them first.
- Before reset, show a confirmation naming the round and warning that the current ballot count and revealed results (if any) will be voided and excluded from election decisions. Require explicit confirmation; cancel leaves the round unchanged.
- On confirmation, mark the prior voting attempt as reset/voided so its ballots and results cannot be used for current or future election decisions. Retain an audit event with actor, timestamp, round, and reset reason if provided; do not include ballot choices in that audit event. Physical ballot-data deletion versus restricted retention follows the approved retention policy.
- Preserve the closed round's candidate roster as the starting roster for a fresh draft. Require the admin to configure the allowed selections and expected voter count again before starting; the new attempt begins with zero ballots and no prior tally or participation count.
- Preserve the prior attempt's reset/voided status in history and clearly distinguish it from a normal closed/revealed round. A reset attempt cannot be reopened as though its old ballots remain valid.
- If a later round has already started, prevent reset and explain that the round is referenced by later election activity; do not silently reset or cascade-delete later rounds.

## Scope and Dependencies
Reset lifecycle, audit/history, and ballot retention. Depends on E6 history and E8.2 retention policy.

## Product Decisions Before Implementation
Confirm reset after reveal but before a subsequent round: current story assumes yes, with results voided. Confirm physical deletion versus restricted retention of superseded ballots.

## Implementation Notes and Limitations
Backlog notes prior POC includes round reset/reopen behavior, but its handoff records a failed full-suite reset integration test in an earlier baseline. Do not treat this as accepted behavior; verify current branch and tests.
