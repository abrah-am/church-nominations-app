# US-010: Configure a Voting Round

- **Epic:** P0 Round Setup
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As the president or authorized administrator, I can choose the ballot selection count and candidate roster for each round.

## Acceptance Criteria
- The authorized operator sets the exact number of distinct candidate selections for each round; the application imposes no fixed progression or default rule beyond valid input bounds.
- After viewing revealed results, the operator records candidate decisions; candidates marked Advanced are used for the next round. The application does not ask the operator to select the same roster again.
- Ballots require exactly the configured number of distinct selections; incomplete and duplicate selections cannot be submitted.
- Poll candidate configuration is editable before voting starts and locked while active; withdrawal is allowed only before start or after closure.

## Scope and Dependencies
Round roster and selection-count configuration. Depends on US-007 and US-009 for the first round; later rounds depend on saved candidate decisions. Draft correction is covered by E2.4/E3.3.

## Relevant Decisions
Selection count is set independently per round. Poll setup locks during active voting; withdrawal is permitted before start or after closure.

## Implementation Notes and Limitations
Local POC uses the complete consolidation snapshot for round one and Advanced candidates thereafter. Selection count is validated; follow-up UX and draft correction work appears in E2/E3.
