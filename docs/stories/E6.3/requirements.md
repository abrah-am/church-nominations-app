# E6.3: Build Navigable Position History

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Blocked by report/history policy decisions
- **User story:** As an authorized church administrator, I want to inspect the full history of a position's nominations and rounds.

## Acceptance Criteria
- History includes intake outcome, consolidated roster, each round's roster and revealed aggregate totals, candidate decisions, and elected outcomes.
- Round chronology and candidate progression are understandable without exposing ballot-level choices.
- Historical views are tenant-scoped and use only approved report audiences/fields.

## Scope and Dependencies
Navigable historical position record. Depends on E6.1 completion semantics and E6.4/E8.2 access, privacy, and retention decisions. Related to US-013.

## Relevant Approved Decisions
No voter-to-choice mapping is exposed. Tenant boundaries apply. Report audience and precise fields are unresolved.

## Implementation Notes and Limitations
Backlog says full election history remains follow-up work; local POC has per-round reveal and candidate decisions, not complete history presentation.
