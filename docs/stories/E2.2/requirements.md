# E2.2: Preserve Consolidation Drafts on Failure and Navigation

- **Epic:** E2 Nomination Workflow Clarity and Recovery
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want my edited candidate list preserved if saving fails so I can recover without redoing cleanup.

## Acceptance Criteria
- A failed save preserves the current textarea content and returns focus or directs the admin to the error.
- Duplicate cleanup and validation results are explained before or after saving; distinct variants are never silently merged.
- Confirmation is invalidated when the candidate text changes and must be reselected before saving.
- Tests cover server failure, empty list, duplicate exact names, and corrected text.

## Scope and Dependencies
Client-side consolidation draft preservation, validation, and explicit confirmation. Depends on US-009 consolidation editor and save API.

## Implementation Notes and Limitations
Backlog baseline says editor removes exact duplicate entries on save and the saved snapshot is locked after a draft/active round. Ensure exact duplicates are explained and do not silently merge distinct variants.
