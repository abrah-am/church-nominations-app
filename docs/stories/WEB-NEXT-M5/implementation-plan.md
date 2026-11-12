# WEB-NEXT-M5 Implementation Plan

## Status

Product Owner approved M5 scope and policy on 2026-11-11. M5a implementation is
complete and pending Product Owner acceptance; M5b remains unstarted. Follow
[requirements.md](requirements.md); no backend integration, merge, or
deployment.

## Summary and technical context

Extend the accepted `apps/web-next` React/TypeScript application and its typed
in-memory mock election service. Reuse `PositionSnapshot`,
`CandidateDecisionEvent`, `CandidateResponseEvent`, and
`PositionLifecycleEvent`, plus pure selectors in
`src/domain/position-summary.ts`. Keep decision/replacement rules in small
domain functions, mock operations in `src/data/mock-election-store.ts`, and
Admin UI in focused workspace components. Preserve the existing M4 provider,
route projections, poll history, and privacy boundaries.

## Plan and executable tasks

### Phase 1 — M5a decision and response domain

- **Plan 1.1 — Decision guidance and recording (REQ-M5-001, REQ-M5-004):**
  Add pure majority-qualification guidance and decision-set validation in
  `src/domain/election-decisions.ts` and tests in
  `src/domain/election-decisions.test.ts`, using the approved opening-cap/
  runoff rules. Add explicit mock-store operations to append Admin-confirmed
  decision events and audit entries. Never persist an Elected outcome from
  calculation alone.
- **Plan 1.2 — Candidate responses (REQ-M5-002, REQ-M5-004):**
  Add append-only Accepted/Declined response operations and projections.
  Associate each response with its candidate, opening, and Elected decision
  event so re-election/re-invitation history cannot reuse a stale response.
  Keep contact details out of scope.
- **Plan 1.3 — Admin decision and response UI (REQ-M5-001, REQ-M5-002):**
  Add modular closed-round decision and response views in
  `src/features/workspace/`. Expose majority guidance, explicit review/confirm,
  validation feedback, response history, and opening conditions. Keep all
  decisions/responses Admin-only.
- **Plan 1.4 — Explicit next-poll action (REQ-M5-003, REQ-M5-004):**
  Add a distinct Create Next Poll action after valid saved decisions. Preselect
  Advanced candidates for Admin review and confirmation; create a draft with
  fresh totals only on explicit confirmation.
- **Tasks**
  - [ ] T001 [US1] [Plan:1.1] Add majority-guidance and decision-set functions in `apps/web-next/src/domain/election-decisions.ts` with tests in `apps/web-next/src/domain/election-decisions.test.ts`.
  - [ ] T002 [US1] [Plan:1.1,1.2] Extend event-safe mock operations and tests in `apps/web-next/src/data/mock-election-store.ts` and `apps/web-next/src/data/mock-election-store.test.ts`.
  - [ ] T003 [US1] [Plan:1.2] Extend typed decision/response event contracts in `apps/web-next/src/domain/types.ts` and test response-to-decision association.
  - [ ] T004 [US1] [Plan:1.3] Add Admin decision and candidate-response components under `apps/web-next/src/features/workspace/`, preserving the existing `election-admin-panel.tsx` composition.
  - [ ] T005 [US1] [Plan:1.4] Add explicit Create Next Poll roster review and route-shared tests in `apps/web-next/src/features/workspace/` and `apps/web-next/src/App.test.tsx`.

### Phase 2 — M5b position lifecycle and replacement

- **Plan 2.1 — Opening and lifecycle derivations (REQ-M5-002, REQ-M5-005, REQ-M5-006):**
  Extend the existing opening/lifecycle selectors and domain tests. Add
  validated finalize/reopen mock operations with append-only lifecycle audit
  events. Finalize only when every opening is Accepted and no poll is open.
- **Plan 2.2 — Replacement rules (REQ-M5-007, REQ-M5-008):**
  Add pure direct-recommendation derivation in
  `src/domain/replacement-rules.ts` and tests in
  `src/domain/replacement-rules.test.ts`, using the associated completed,
  non-voided round and approved same-position exclusions/ranking. Ties produce
  a confirmation-required tie-break roster. Keep manual replacement roster
  construction Admin-directed and unranked, sourced from this position's
  historical nomination/round names; record the rationale.
- **Plan 2.3 — Admin lifecycle/replacement UI (REQ-M5-005–REQ-M5-008):**
  Add focused opening/lifecycle and replacement workflow components. Require
  explicit confirmation for finalization, reopen, tie-break creation, and
  manual replacement-poll creation. Show an actionable Vacancy state when no
  historical names exist.
- **Tasks**
  - [ ] T006 [US2] [Plan:2.1] Extend opening/lifecycle derivations and tests in `apps/web-next/src/domain/position-summary.ts` and `apps/web-next/src/domain/position-summary.test.ts`.
  - [ ] T007 [US2] [Plan:2.1] Add guarded finalize/reopen mock operations and audit-history tests in `apps/web-next/src/data/mock-election-store.ts` and `apps/web-next/src/data/mock-election-store.test.ts`.
  - [ ] T008 [US2] [Plan:2.2] Add direct recommendation, tie, manual roster, and empty-source rules in `apps/web-next/src/domain/replacement-rules.ts` with tests in `apps/web-next/src/domain/replacement-rules.test.ts` and `apps/web-next/src/data/mock-election-store.test.ts`.
  - [ ] T009 [US2] [Plan:2.2,2.3] Implement Admin replacement actions and audited rationale in focused components under `apps/web-next/src/features/workspace/`.
  - [ ] T010 [US2] [Plan:2.3] Add Admin lifecycle and replacement route-flow tests in `apps/web-next/src/App.test.tsx`.

### Phase 3 — Regression and acceptance evidence

- **Plan 3.1 — Cross-experience integrity and QA (REQ-M5-003, REQ-M5-004, REQ-M5-008):**
  Verify M0-M4 routes and flows remain stable; decisions, responses,
  replacement details, and history remain absent from Voter/Presentation.
  Check keyboard operation and responsive layouts at 1440, 390, and 320 px.
  Run `npm --prefix apps/web-next run check`.
- **Tasks**
  - [ ] T011 [Plan:3.1] Extend cross-route history/privacy regression tests in `apps/web-next/src/App.test.tsx` and relevant feature tests.
  - [ ] T012 [Plan:3.1] Run lint, focused/full tests, TypeScript build, and desktop/mobile keyboard/responsive checks; update M5 handoff with executed evidence and remaining limitations.

## Requirement mapping

| REQ ID | Description | Plan items | Implementation evidence |
| --- | --- | --- | --- |
| REQ-M5-001 | Explicit, validated Admin decisions; majority calculation never records Elected | 1.1, 1.3 | Domain rules/tests; mock store; Admin decision UI |
| REQ-M5-002 | Separate append-only responses and opening status | 1.2, 1.3, 2.1 | Typed response events; opening selectors; response UI/tests |
| REQ-M5-003 | Explicit next-poll creation with reviewed Advanced roster | 1.4, 3.1 | Mock operation; Admin roster confirmation; route tests |
| REQ-M5-004 | Historical integrity and legacy rendering | 1.1–1.4, 3.1 | Immutable poll/decision snapshots; regression tests |
| REQ-M5-005 | Explicit finalization after all Accepted and no open poll | 2.1, 2.3 | Lifecycle guards, audit event, Admin control/tests |
| REQ-M5-006 | Explicit audited reopen without auto-poll | 2.1, 2.3 | Reopen operation and lifecycle UI/tests |
| REQ-M5-007 | Position-scoped direct recommendation and tie-break | 2.2, 2.3 | Replacement derivation, confirmation UI/tests |
| REQ-M5-008 | Admin-directed historical replacement poll and empty-source behavior | 2.2, 2.3, 3.1 | Manual roster/reason, fresh poll, no-candidate Vacancy tests |

## Validation and constraints

- Use focused Vitest/Testing Library tests for every rule, error, and state
  transition; retain M0-M4 checks.
- Run `npm --prefix apps/web-next run check` with the supported Node runtime.
- Verify decision history, responses, and replacement data are unavailable to
  Voter and Presentation; never model individual ballots or identity mappings.
- Validate keyboard interactions and layouts at 1440/390/320 px.
- Do not add dependencies, persistence, API calls, authentication simulation,
  or changes outside `apps/web-next` except directly related documentation.
