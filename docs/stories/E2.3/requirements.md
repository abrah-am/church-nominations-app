# E2.3: Explain Roster Lock and Provide Pre-Draft Edit Path

- **Epic:** E2 Nomination Workflow Clarity and Recovery
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want to know when the consolidated roster becomes locked so I can finish cleanup before creating the first draft.

## Acceptance Criteria
- Before draft creation, clearly state that draft creation locks consolidation.
- The pre-draft edit action restores the last saved names into the editor and allows correction/removal.
- If an edit attempt is blocked by server state, explain why and preserve user-entered content.
- The admin can cancel editing without losing the saved snapshot.

## Scope and Dependencies
Pre-draft editing and roster-lock explanation. Depends on US-009 and E2.2. Post-draft correction policy is E2.4 and implementation E3.3.

## Implementation Notes and Limitations
Backlog reports saved snapshot can be reopened before a draft; API disallows editing consolidation once a draft or active round exists. Post-draft recovery remains unresolved.
