# E4.2: Make Ballot Progress and Lifecycle Actions Scannable

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want active, closed, and reopened round states to be obvious so I can act without confusing progress with vote totals.

## Acceptance Criteria
- Active round displays ballots received versus expected, clearly qualified as profile/link submissions rather than verified people.
- Active rounds do not display totals, candidate ranking, or choice information.
- Close, reopen, and reset actions and their outcomes are clearly distinguished and accessible. Reopen resumes the same round and retains its ballots; reset starts a fresh voting attempt and invalidates the prior attempt.
- After reopen, stale revealed results are not shown as current results.

## Scope and Dependencies
Admin progress/action presentation. Depends on round lifecycle APIs and E4.5 reset policy/behavior. No ballot totals or choice exposure while active.

## Relevant Approved Decisions
Progress denotes profile/link submissions, not verified persons. Reopen retains ballots; reset voids prior attempt. Results are not current after reopening.

## Implementation Notes and Limitations
Local POC baseline reports progress, expected count, manual close, and reopen controls implemented. Reset behavior has a separate open decision and retention dependency (E4.5, PD-007).
