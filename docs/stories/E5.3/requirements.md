# E5.3: Start the Next Draft from Saved Candidate Decisions

- **Epic:** E5 Results Review and Candidate Decisions
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want saving candidate decisions to prepare the next draft from the candidates I advanced, so the next round can start without reselecting the roster.

## Acceptance Criteria
- Every candidate has a saved Elect, Advance, or Remove action.
- A decision set is valid only when at least one candidate is marked Elect or at least two candidates are marked Advance. Until all candidate actions are complete and the set is valid and saved successfully, keep the admin in the current closed-round candidate-decision step, preserve their selections, and do not create a draft or mark the position complete.
- Saving decisions automatically creates a draft containing exactly the Advance candidates, with zero votes and fresh round configuration.
- Candidates marked Elect or Remove are excluded from the new roster; elected candidates count toward the position's configured openings.
- If no candidates advance but one or more are elected, save those outcomes without creating an empty draft; complete the position only if all openings are filled.
- Additional decision-set validation UX/API requirements may be specified in a future story; they do not block this backlog item and no separate story is created now.
- Selection-count bounds use the previewed next-round roster.

## Scope and Dependencies
Next-draft creation and roster confirmation after decisions. Depends on E5.2 decision persistence and E3.2 roster preview. The saved Advance set is the complete new roster.
