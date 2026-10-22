# US-009: Consolidate Nominations into the First Roster

- **Epic:** P0 Nomination Workflow
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As an administrator, I can consolidate nomination submissions into a unique candidate list and use it as the first voting-round roster.

## Acceptance Criteria
- The admin can inspect submitted names and correct spellings or merge duplicates with explicit confirmation.
- The system may flag likely duplicates but never silently merges distinct people.
- The admin explicitly confirms the final consolidated names; no source-device data is exposed or used to merge.
- The consolidated nomination outcome is retained and is the complete round-one roster.
- Before a draft round is created, the admin can return to the consolidation editor without losing the saved names; the interface explains that creating a draft locks the snapshot.
- Later-round rosters contain candidates marked Advanced in the preceding revealed round; excluded candidates are not silently included.

## Scope and Dependencies
Human-confirmed consolidation and saved roster snapshot. Depends on US-008; draft-lock and later-round behavior links to E2.3, E2.4, and E3.2.

## Relevant Decisions
No source identity is exposed or used for merge decisions; variants are human-confirmed. Draft creation currently locks consolidation.

## Implementation Notes and Limitations
Backlog reports admin corrections/merges and full snapshot as round-one roster, with pre-draft editing and lock after draft/active round. The editor's exact-duplicate cleanup and failure recovery have separate follow-up stories E2.2/E2.3.
