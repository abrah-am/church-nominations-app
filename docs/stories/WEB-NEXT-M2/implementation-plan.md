# WEB-NEXT-M2 implementation plan

**Implemented, verified, and explicitly accepted by the Product Owner on
2026-11-10.** Scope approval and final acceptance are recorded in
[requirements](requirements.md) and [handoff](handoff.md). The implementation
remains within the approved read-only scope; merge and deployment are not
authorized.

## Architecture

Retain M1 shell and navigation. Compose future `features/workspace` from focused
summary, session-toolbar, poll-history and candidates modules, with separate
nomination/voting/results/decisions/history presentation as needed. Do not grow
a single all-purpose workspace component. Use owned shadcn primitives and add
only components justified by the approved UX.

Extend the read-only application port explicitly to carry poll type, immutable
roster/name snapshots, aggregate counts/ballots-cast, traceability, recorded
decisions/responses/audit and a separate active-session summary. This is not a
backend wire schema. Public viewer access is not represented by admin data.
Keep individual ballots, submitter identity and capability credentials out.

Admin viewed IDs belong in presentation/application state; active-session data
is a separate read snapshot. No UI adapter provides an activation/mutation
method. Domain functions calculate opening status, result ordering/percentages
and current-vs-poll status; fixtures do not recalculate election rules.
Preserve M0 limitations around replacement-aware summaries.

No new state library, backend implementation, framework conversion or shared
cross-app package is needed. No applicable framework-migration guidelines:
this is an incremental isolated UI, not a Bootstrap conversion.

## Task breakdown and gates

### Phase 1: Design (complete)

- [x] T001 [Plan:1.1] (REQ-001 through REQ-008) UX Designer creates
  `docs/stories/WEB-NEXT-M2/ux-design.md` and actual1440/390/320 references with
  realistic poll/candidate content, historical viewing and explicit read-only
  affordances. Include component/state/accessibility specs.
- [x] T002 [Plan:1.2] (REQ-008) Tech Lead reviews design against Prototype V2,
  records unresolved dependencies and hands scope/reference to Product Owner.
  Do not mark the story implementation-ready before approval.

### Phase 2: Approved implementation (complete)

- [x] T003 [Plan:2.1] (REQ-001, REQ-005, REQ-006) Extend
  `apps/web-next/src/domain` and `src/data` types/fixtures/read contract with
  focused tests for accepted openings, historical status, aggregate sorting,
  ballots-cast percentages, zero ballots and snapshot/privacy boundaries.
  Source: `docs/prototype-v2/src/model.ts` pure summaries and
  `src/features/admin/AdminView.tsx` result calculation/ordering; read before port.
- [x] T004 [Plan:2.2] (REQ-001, REQ-003, REQ-004, REQ-005) Frontend Developer
  implements modular read-only summary, poll navigator, selected-poll detail
  and Candidates navigation in `apps/web-next/src/features/workspace`. Preserve
  immutable poll-specific records distinct from current statuses.
- [x] T005 [Plan:2.3] (REQ-002, REQ-003, REQ-006) Implement persistent session/
  share module with explicit mock preview/link boundary; test copy/QR/preview,
  navigation and poll selection leave active-session state unchanged. Include
  explicit errors for clipboard failure; no silent success or real capability.
- [x] T006 [Plan:2.4] (REQ-006, REQ-007) Implement loading/error/empty states and
  responsive keyboard-accessible composition; no implicit context substitutions.

### Phase 3: Verification and acceptance (complete)

- [x] T007 [Plan:3.1] (REQ-001 through REQ-008) Run focused tests plus lint,
  typecheck and build. Verify1440x900/390x844/320x568 no horizontal overflow,
  keyboard/tab navigation, accessible labels, selected vs active distinction,
  and record screenshot comparisons, QA, independent review and UX validation.
- [x] T008 [Plan:3.2] (REQ-008) Update handoff/backlog with evidence and record
  Product Owner acceptance. No subsequent milestone, merge or deployment is
  implied.

Dependencies: T002 follows T001; T003 follows approved scope and UX;
T004/T005 depend on T003; T006 follows composition; T007 follows T004-T006;
T008 follows verified fixes and T007. Do not exceed approved scope.

## Requirement mapping

| REQ | Plan items | Evidence |
| --- | --- | --- |
| REQ-001 | 1.1,2.1,2.2,3.1 | summary/domain tests and references |
| REQ-002 | 1.1,2.3,3.1 | toolbar/mock-link tests and references |
| REQ-003 | 1.1,2.2,2.3,3.1 | viewed-vs-active state interaction tests |
| REQ-004 | 1.1,2.2,3.1 | read-only poll panels/traceability tests |
| REQ-005 | 1.1,2.1,2.2,3.1 | Candidates and aggregate unit tests |
| REQ-006 | 1.1,2.1,2.3,2.4,3.1 | read contract and state tests |
| REQ-007 | 1.1,2.4,3.1 | responsive/a11y/browser evidence |
| REQ-008 | 1.1,1.2,3.1,3.2 | approval record, scope checks, handoff |
