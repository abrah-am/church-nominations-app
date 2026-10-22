# E2.4: Decide Correction Behavior After Draft Creation

- **Epic:** E2 Nomination Workflow Clarity and Recovery
- **Priority:** P1 (decision blocker)
- **Workflow status:** Blocked / Product Owner decision needed
- **User story:** As an election administrator, I need an approved recovery policy for an incorrect roster after a draft exists.

## Acceptance Criteria
- Decide whether an unstarted draft may be cancelled and rebuilt, whether edits are supported in place, or whether correction requires another controlled action.
- Define audit requirements and behavior once any poll has started.
- Do not implement a path that changes an active poll's roster.

## Scope and Dependencies
Discovery and policy decision. Blocks E3.3. Does not authorize changing an active poll roster.

## Relevant Decisions
Active poll rosters are immutable. Any draft correction must preserve audit history and server-side validation.

## Implementation Notes and Limitations
Current POC locks consolidation after draft/active round. No post-draft correction path is approved.
