# E1.1: Show Meaningful Election Lifecycle Status

- **Epic:** E1 Election and Position Progress
- **Priority:** P1 (follow-up; proposed priority)
- **Workflow status:** Implemented and merged to `main` (`70e41be`); Product Owner acceptance not recorded
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

## Implementation Notes and Limitations
The implementation is merged to `main` in commit `70e41be`. The handoff records focused API validation, frontend suite/build evidence, and one unrelated full-API-suite reset failure. Formal Product Owner acceptance is still required before marking this story Done. Authenticated browser/mobile/screen-reader checks were not performed; phase-specific progress remains deferred to E1.2.