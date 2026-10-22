# E6.2: Show Completion Status in Election and Position Lists

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Blocked by E6.1
- **User story:** As an administrator, I want to see which positions are complete and which need action.

## Acceptance Criteria
- Election and position status derive from persisted workflow state and follow E6.1.
- Status uses text and does not rely on color alone.
- Lists expose a useful next action for incomplete positions and a clear completed state for finished ones.

## Scope and Dependencies
List presentation based on completion contract. Depends on E6.1 and existing election/position status work in E1.1/E1.2.
