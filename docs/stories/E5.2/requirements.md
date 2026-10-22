# E5.2: Show Unsaved and Failed Candidate Decisions

- **Epic:** E5 Results Review and Candidate Decisions
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want to know which decisions are saved so I can complete result review without uncertainty.

## Acceptance Criteria
- Draft decision changes are distinguishable from persisted decisions.
- Save success/failure is associated with the candidate; failures preserve the selected decision.
- A decision is not treated as saved until the API confirms it.
- Decision actor/time follow the approved audit policy without linking a ballot to a voter.

## Scope and Dependencies
Decision editor persistence state and error recovery. Depends on candidate decision API and approved audit policy (E8.2).

## Implementation Notes and Limitations
Current POC supports Advanced, Eliminated, and Elected decisions. Handoff notes historical reasons may exist; E5.4 says preserve existing reason history while not collecting new free-text reasons in that editor.
