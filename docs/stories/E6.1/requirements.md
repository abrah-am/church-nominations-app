# E6.1: Define Completion States and Transition Rules

- **Epic:** E6 Election Completion and History
- **Priority:** P1
- **Workflow status:** Core position lifecycle and finalization contract clarified/approved 2026-11-07; remaining tie/no-advancement policy and election-level mapping need refinement
- **User story:** Discovery story to define completion for positions and elections.

## Acceptance Criteria
- Define when a position is complete for one or multiple openings, including unresolved ties and withdrawals.
- Define election-level completion from its positions.
- Specify which states are user-visible and which actions remain available after completion.

## Scope and Dependencies
Product discovery for completion contract; blocks E6.2 and informs E1.1 status. Depends on approved majority/runoff rules and candidate-decision lifecycle.

## Relevant Approved Decisions
**Historical E1.1 contract (2026-10-21; superseded only as position-finalization definition on 2026-11-07):** E1.1 contract says election complete when every current position has at least its configured opening count of candidates marked ELECTED. Its status may regress. The broader position cases (ties and withdrawals) remain unresolved and must not be silently inferred. Decision-set validation requires at least one ELECTED or at least two ADVANCED candidates; invalid sets stay in the current decision step.

## Position lifecycle and finalization addendum (Product Owner approved, 2026-11-07; PD-011/PD-020)

This clarifies position completion without redefining the historical E1.1 election-level progress contract. Persisted position states are `In Progress`, `Finalized`, and `Reopened`; `Awaiting Acceptance`, `Ready to Finalize`, and `Vacancy` are derived conditions that determine actions. `Elected` is an immutable election decision, distinct from candidate response. Each opening is filled only after a separate Accepted response event. Finalization requires every opening Accepted, no open poll for that position, explicit admin confirmation, and an audit event. Finalized is read-only by default; explicit confirmed, audited reopen permits follow-up events and poll drafts but neither creates nor activates a poll or changes prior history. See [PD-011/PD-020](../../product/product-decisions.md) and [E1.1](../STORY-E1.1/requirements.md).

The 2026-10-21 E1.1 Elected-count wording remains historical election-progress semantics where compatible, but is superseded as the definition of position finalization. The separate decision-set validation rule (at least one ELECTED or at least two ADVANCED; invalid sets stay on the current step) remains as recorded. Tie handling beyond the PD-018 top-eligible replacement tie-break, withdrawals, no-advancement outcomes, committee process, and mapping position lifecycle to an election-level aggregate status remain open; do not infer them from this addendum.
