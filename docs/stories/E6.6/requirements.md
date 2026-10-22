# E6.6: Confirm Elected People and Mark Position Openings Filled

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Product clarification needed
- **User story:** As an election administrator, I want to record whether each elected person accepts the position so the election distinguishes an election result from a confirmed appointment.

## Acceptance Criteria
- After a candidate is elected, an authorized administrator can record that the person was contacted and mark their response as accepted or declined.
- The record is associated with the elected candidate and the relevant position opening, not with ballot identity or voter selections.
- An opening is shown as filled only after the elected person accepts; elected-but-unconfirmed and declined outcomes remain visibly distinct.
- The system preserves the election result and response history for authorized review.
- A declined response provides the administrator with the approved replacement workflow; detailed selection rules are defined by E6.7.

## Scope and Dependencies
Post-election contact and response tracking, plus position-opening status. Depends on E6.1 completion semantics and the elected-candidate records. E6.7 owns replacement selection following a decline. This story does not implement external calling, messaging, or automated contact; an administrator records the outcome of the contact.

## Clarifications Needed
- Can the administrator correct or reverse a recorded acceptance/decline, and what audit history is required?
- Does the election become operationally complete only when every opening is accepted, or should the elected-result status remain complete while confirmation is pending?
- What contact date/details, if any, may be stored? Avoid collecting unnecessary personal information.