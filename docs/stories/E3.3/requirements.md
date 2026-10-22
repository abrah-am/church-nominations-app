# E3.3: Implement Approved Draft Correction Policy

- **Epic:** E3 Round Setup and Candidate Roster
- **Priority:** P1 (blocked)
- **Workflow status:** Blocked by E2.4
- **User story:** As an administrator, I want to correct an unstarted draft roster according to the approved policy.

## Acceptance Criteria
- Implement only the correction path approved in E2.4.
- Preserve audit history and validate candidate/selection-count constraints on the server.
- Active-round rosters remain immutable.

## Scope and Dependencies
Implementation only after E2.4 decision. Depends on E2.4 and round/candidate APIs.

## Relevant Decisions
Active-round roster is immutable; correction must not silently alter audit history.

## Implementation Notes and Limitations
No correction policy is approved; current POC blocks edits after draft/active round. Do not infer a path from current behavior.
