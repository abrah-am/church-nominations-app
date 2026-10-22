# E1.1: Show Meaningful Election Lifecycle Status

- **Epic:** E1 Election and Position Progress
- **Priority:** P1 (follow-up; proposed priority)
- **Workflow status:** Implemented; acceptance/merge not recorded
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
Handoff reports implementation and focused validation. Full frontend suite/build passed; full API suite had one unrelated reset integration failure (expected 200, received 409). Handoff says do not merge without Product Owner approval; no acceptance/merge evidence recorded. Generic notice was removed as part of E1.1, overlapping the stated E1.3 scope. Authenticated browser/mobile/screen-reader checks were not done.