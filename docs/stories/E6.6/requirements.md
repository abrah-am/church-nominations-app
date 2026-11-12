# E6.6: Confirm Elected People and Mark Position Openings Filled

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Partially clarified; response correction/reversal and contact data remain open
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

## Approved decision/response addendum (2026-11-07; PD-020)

Clarification status: the question about operational completion versus elected-result status is resolved below. Whether a recorded response can be corrected/reversed remains open; contact date/details remain open.

The second clarification is resolved: election decision and operational position finalization are distinct. `Elected` is an immutable election decision; the authorized administrator separately records the candidate's `Accepted` or `Declined` response as an auditable event associated with that candidate and opening, never with ballot identity or selections. An opening counts filled only after Accepted; awaiting acceptance and declined do not fill it. Preserve response history. Reopen permits audited follow-up candidate response/decision events without mutating prior history. The rules for correcting or reversing an earlier response remain open, as does any contact data beyond these events.

Position finalization is eligible only when every opening is Accepted and the position has no currently open poll. It requires explicit administrator confirmation and an audit event; see [PD-020](../../product/product-decisions.md) and [E6.1](../E6.1/requirements.md). A declined outcome follows [PD-018/E6.7](../E6.7/requirements.md). Contact date/details and other not-covered data-retention questions remain unresolved. This approval clarifies requirements only; it does not claim implementation.

## WEB-NEXT-M5 Admin workflow update (Product Owner approved, 2026-11-11)

- Record Elected/Advanced/Eliminated decisions as immutable Admin-confirmed decision events. Calculated majority qualification is guidance only; no Elected decision is persisted without explicit Admin confirmation.
- Record Accepted/Declined separately from election decisions, associated with the elected candidate and position opening. Preserve every response event; an opening is filled only after Accepted.
- Finalize only when all openings are Accepted and no poll is open. Reopen is explicit, confirmed, audited, and does not create or start a poll. A decline creates a Vacancy and starts the Admin-selected PD-018 workflow without rewriting history.
- Contact dates/details are not collected in M5. Whether a recorded response can be corrected or reversed remains open; M5 should append events only and must not silently overwrite prior responses.