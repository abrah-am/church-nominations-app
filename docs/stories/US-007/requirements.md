# US-007: Configure a Department Election

- **Epic:** P0 Election Setup
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As an administrator, I can create an election for a department, list each position and number of openings, and configure the process for each position.

## Acceptance Criteria
- An election belongs to the authenticated admin's church and one department, and contains one or more ordered positions with opening counts. The API derives this scope from the admin's persisted church assignment.
- Each position has a stable identity, independent opening count, and configured sequence so later nomination, candidate, and round records can be associated with the correct position. Those later workflows are separate stories.
- The administrator can open and manage positions one at a time in configured sequence, beginning with the first position. The UI provides sequential position navigation.

## Scope and Dependencies
Department election and ordered position/opening configuration. Depends on church membership and tenant isolation. Nomination, candidates, and rounds are separate dependent stories.

## Implementation Notes and Limitations
Backlog reports durable create/list/detail/setup edits, stable position IDs through rename/reorder, sequential UI navigation, and PostgreSQL Testcontainers persistence tests. Scope is the configured one-church-per-admin POC; no formal acceptance evidence is recorded here.
