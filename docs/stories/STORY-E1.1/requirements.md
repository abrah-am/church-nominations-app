# E1.1: Show Meaningful Election Lifecycle Status

- **Epic:** E1 Election and Position Progress
- **Priority:** P1 (follow-up; proposed priority)
- **Workflow status:** Accepted by Product Owner 2026-10-22; implemented and merged to `main` (`70e41be`)
- **User story:** As a church administrator, I want each election to show its current lifecycle state so I can tell whether it needs setup, nominations, voting, or final review.

## Acceptance Criteria
- Define and document election-level statuses and transition rules before implementation.
- Election list and detail show the same derived status using text, not color alone.
- Status reflects its positions and does not say `Setup` once any position has progressed beyond setup.
- API authorization and tenant scoping remain enforced; tests cover each status transition and cross-tenant reads.

## Scope and Dependencies
Election-level derived status only. Phase-specific progress detail is explicitly deferred. Depends on election and position lifecycle data.

## Relevant Approved Decisions
Approved contract dated 2026-10-21: `SETUP`, `IN_PROGRESS`, `COMPLETE`; empty/no progressed position is setup; nomination intake, active/closed round, or current candidate decision is progress; draft alone is not progress. Complete when all current positions have at least configured openings marked elected. Status may regress after decisions/configuration changes.

## Acceptance
Product Owner acceptance recorded on 2026-10-22. Acceptance is based on the implemented lifecycle contract and evidence below. Known limitations remain documented: one unrelated full-API-suite reset failure and no authenticated live browser, mobile viewport, or screen-reader validation.

## Implementation Notes and Limitations
The implementation is merged to `main` in commit `70e41be`. The handoff records focused API validation, frontend suite/build evidence, and one unrelated full-API-suite reset failure. Authenticated browser/mobile/screen-reader checks were not performed; phase-specific progress remains deferred to E1.2.

## Position-finalization addendum (Product Owner approved, 2026-11-07; PD-011/PD-020)

This addendum supersedes only the 2026-10-21 relationship that used current Elected count versus configured openings as the definition of **position finalization**. Preserve `SETUP`, `IN_PROGRESS`, and `COMPLETE` as the historical election-level derived status contract and its progress/regression semantics where compatible; an election decision result is not operational position finalization.

The persisted position lifecycle states are `In Progress`, `Finalized`, and `Reopened`. `Awaiting Acceptance`, `Ready to Finalize`, and `Vacancy` are derived conditions, not persisted states. An opening is filled only after an immutable `Elected` decision has a separate `Accepted` candidate response event. Finalizing a position requires all openings Accepted, no open poll for that position, and explicit administrator confirmation; it is audited. Election-level status may continue to describe election progress, but must not substitute for the position lifecycle or imply finalization from Elected count alone. See [PD-011/PD-020](../../product/product-decisions.md) and [E6.1](../E6.1/requirements.md).