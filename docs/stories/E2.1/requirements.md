# E2.1: Make Intake States and Closure Consequences Clear

- **Epic:** E2 Nomination Workflow Clarity and Recovery
- **Priority:** P1 (proposed)
- **Workflow status:** Ready to start
- **User story:** As an administrator, I want to see whether intake is open or closed and what closing it does so I can operate the nomination window confidently.

## Acceptance Criteria
- Show intake state, submission count, configured name limit, and whether the public link is usable.
- Closing nominations has a clear label and confirmation only if required by the approved UX policy; after success, show that submissions are read-only and consolidation is next.
- Empty submissions have an explicit state and a clear next action.
- Updates and closure are announced accessibly; no submitter/device identity is displayed.

## Scope and Dependencies
Admin-facing intake state and closure UX, including empty and accessibility states. Depends on US-008 nomination intake. Product policy already permits admin closure; UX confirmation policy remains to be defined.

## Readiness
US-008 intake creation, sharing, live updates, and closure are implemented locally. E2.1 can start with UX review and implementation; decide whether closure needs confirmation as part of the story's UX work. No upstream story or product decision currently blocks kickoff.

## Implementation Notes and Limitations
Backlog says intake create/share/live updates/close are implemented locally. E2.1 is clarity/recovery work, not the underlying intake implementation.
