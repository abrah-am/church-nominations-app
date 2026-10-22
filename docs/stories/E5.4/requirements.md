# E5.4: Show Saved Candidate Decisions with a Single Undo Action

- **Epic:** E5 Results Review and Candidate Decisions
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; undo eligibility decision needed
- **User story:** As an administrator, I want saved candidate decisions to replace their edit controls with a clear saved record and undo action so I can see that an Advanced candidate is committed to the next-round roster.

## Acceptance Criteria
- After the API confirms a decision, display its current decision, acting administrator, and saved timestamp for that candidate.
- For a saved `ADVANCED` decision, hide the decision dropdown and reason input and show one `UNDO` action, consistent with the existing eliminated-decision interaction.
- After undo succeeds, restore the undecided editing controls; on failure, retain the persisted decision display and explain that undo did not complete.
- Apply the same persisted-state clarity to other saved decisions; keep only actions supported by the existing decision rules.
- Define server-side undo eligibility for `ADVANCED`, including what happens if a later draft round already contains that candidate. Never silently desynchronize a later round from its source decisions; blocked undo must explain the required recovery path.
- Do not collect or require a free-text reason in the decision editor. Preserve actor/time and decision-change audit history; this UI change must not erase prior events or existing historical reason data.
- Tests cover save success/failure, persisted display, undo success/failure, and accessible focus/status feedback.

## Scope and Dependencies
Persisted decision display and undo. Depends on candidate decisions, next-round roster behavior, and E2.4/E3.3 correction policy when later drafts depend on a decision.

## Implementation Notes and Limitations
Backlog baseline says decisions and possible historical reasons exist. Whether undo is allowed after a later draft includes the candidate needs server-side policy; do not assume.
