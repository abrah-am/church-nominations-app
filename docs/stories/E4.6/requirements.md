# E4.6: Make the Draft Round's Next Action Visible

- **Epic:** E4 Ballot Operations
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want the next action for a draft round to be apparent without expanding its details so I can start voting without searching through collapsed content.

## Acceptance Criteria
- A collapsed draft round clearly identifies its draft state and exposes or prominently signals the Start voting action without requiring expansion.
- The action is associated with the correct election, position, and round; it cannot start a different round accidentally.
- Existing start validation and expected-voter confirmation remain required.
- Cancelling start leaves the round draft and preserves its configuration.
- Expanded and collapsed views do not show contradictory or confusing duplicate primary actions.
- Keyboard operation, focus, and status announcements are included in UX validation.

## Scope and Dependencies
Admin draft-round action discoverability. Depends on round lifecycle and E4.1 confirmation behavior; accessibility validation relates to E7.
