# E6.1: Define Completion States and Transition Rules

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (decision blocker)
- **Workflow status:** Blocked / Product Owner decision needed
- **User story:** Discovery story to define completion for positions and elections.

## Acceptance Criteria
- Define when a position is complete for one or multiple openings, including unresolved ties, withdrawals, and no-advancement cases.
- Define election-level completion from its positions.
- Specify which states are user-visible and which actions remain available after completion.

## Scope and Dependencies
Product discovery for completion contract; blocks E6.2 and informs E1.1 status. Depends on approved majority/runoff rules and candidate-decision lifecycle.

## Relevant Approved Decisions
E1.1 contract says election complete when every current position has at least its configured opening count of candidates marked ELECTED. Its status may regress. The broader position cases (ties, withdrawals, no advancement) remain unresolved and must not be silently inferred.
