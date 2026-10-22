# E4.1: Explain Expected Voter Count and Cutoff Before Start

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want the start confirmation to explain the fixed expected count and any automatic cutoff so I know what happens after starting.

## Acceptance Criteria
- Explain that the value is an operational expected count, not a verified attendance list, and that it is fixed for the active round.
- For the applicable two-candidate, one-selection, even-count case, show the exact `N - 1` cutoff.
- Changing the count updates the warning; invalid counts cannot start a round.
- Cancel leaves the round as a draft and preserves the configured count.

## Scope and Dependencies
Pre-start confirmation and warning behavior. Depends on round setup and start API. The expected count is not an identity-verified attendance roster.

## Relevant Approved Decisions
Expected voter count is confirmed at start and remains fixed. Even-sized two-candidate, one-selection round closes at `N - 1`; an admin can reopen after cutoff.
