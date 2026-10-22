# E3.1: Clarify Roster Source and Valid Selection Count

- **Epic:** E3 Round Setup and Candidate Roster
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an authorized administrator, I want to see where the current roster came from and the valid selection-count range so I can configure a round correctly.

## Acceptance Criteria
- Round one is labeled as using the saved consolidated roster; later rounds identify the preceding round as their source.
- Display candidate count and require an integer selection count from one through that count.
- Validation errors state the valid range and preserve the entered value.
- The roster and selection count are visible before saving or starting a draft.

## Scope and Dependencies
Round setup explanation and validation UX. Depends on US-009, US-010, and saved preceding-round decisions.

## Relevant Decisions
Round one uses the full consolidated snapshot; subsequent rounds use candidates marked Advanced. Selection count is chosen independently per round.

## Implementation Notes and Limitations
Backlog baseline says selection count is configurable and duplicate name picker removed. This story clarifies the existing model rather than changing roster selection rules.
