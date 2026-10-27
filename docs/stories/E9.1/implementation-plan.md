# E9.1 Implementation Plan: Bootstrap 5 UI Modernization

## Status and Gate

Proposed plan for Product Owner review. The Product Owner approved the overall Bootstrap CSS direction on 2026-10-26. This plan is not yet approved for implementation. Do not install dependencies or change application code until this plan is approved and E7.1-dependent accessibility/device criteria are resolved or explicitly bounded for the first slice.

## Principles

- No backend changes, API contract changes, or changes to workflows, authorization, privacy, or election rules.
- Use Bootstrap 5 CSS with current React-controlled components; add no component framework.
- Migrate incrementally and preserve existing uncommitted E6.9 work on the current feature branch.
- Keep existing story requirements as behavior authority; add UI tasks/criteria to those stories rather than cloning them.
- Validate each migrated surface before proceeding to another.

## Phases

### Phase 0: Policy and Baseline Readiness

1. Refine E7.1/PD-009 decisions: accessibility conformance target, supported browser/device/viewports, touch-target expectations, and automated/manual test approach.
2. Record whether the current green palette and type family remain the initial theme direction; establish the theme tokens after this review.
3. Inventory the frontend baseline and identify representative admin, participant, and presentation states using the existing tests and current workflow documents.
4. Confirm the branch/merge plan with the Product Owner. The current worktree has uncommitted E6.9 changes; do not switch branches or stage/commit them as part of this initiative.

Exit: product policies needed for acceptance are recorded; no code changes yet.

### Phase 1: Shared Bootstrap Foundation (E9.1)

1. Add Bootstrap 5 CSS integration and a small theme layer; do not add React-Bootstrap.
2. Establish shared accessible primitives for shell, headings, statuses/alerts, loading/empty/error states, fields, action groups, responsive rows, disclosures, and dialogs.
3. Migrate the top-level admin shell and one representative admin workflow plus one participant workflow as a trial slice.
4. Verify legacy styles and Bootstrap reset interactions; remove only superseded rules in the touched surfaces.

Exit: focused tests, lint, and build pass; approved browser checks show no clipping/overflow; route, privacy, and workflow behavior remain unchanged.

### Phase 2: Onboarding, Annual Boards, and Election Setup (US-004-US-007)

1. Apply shared navigation, form, alert, empty-state, and action patterns to sign-in/registration and church onboarding.
2. Apply responsive list/form patterns to annual board, session, and attendance screens.
3. Apply the shared design to election creation, position setup, election summaries, and position navigation.
4. Preserve separate attendance and ballot records/meaning, tenant-scoped data access, and current API behavior.

Refinement action: verify current US-004 through US-007 acceptance criteria and add only necessary UI-specific tasks/criteria there. Do not create replacement onboarding or board feature stories.

### Phase 3: Nomination and Round Administration (E2.1-E2.4, E3.1-E3.4)

1. Apply shared forms, alerts, status, disclosure, and responsive list patterns to nomination intake and consolidation.
2. Apply shared roster, selection-count, and validation patterns to round setup and candidate roster review.
3. Preserve E2.4's unresolved correction policy; do not design or implement an unapproved post-draft correction path.

Each workflow remains tested and accepted under its existing story. E2.1's current requirements report acceptance; reconcile any backlog status discrepancy without reopening unrelated scope.

### Phase 4: Voting Operations and Results (E4.1-E4.6, E5.1-E5.4)

1. Apply the participant-focused responsive layout and clear selection/progress feedback to ballot states.
2. Apply consistent lifecycle/status/action hierarchy to admin round monitoring and transitions.
3. Apply responsive result rows and candidate-decision feedback to closed/revealed results.
4. Preserve result concealment, exact selection counts, profile-level limitation wording, close/reopen policy, and undecided reset/undo behavior.

### Phase 5: Presentation, History, and Access Surfaces (E6.8-E6.12)

1. Apply shared presentation typography, spacing, responsive list/result layouts, and neutral/revealed states.
2. Verify participant session-link views remain distinct from admin and presentation controls.
3. Preserve reveal gating, no live totals, session scope, read-only audience behavior, and historical-report access constraints.
4. Treat QR work as existing future scope; do not pull it into the initial Bootstrap migration.

E6.9 is currently reported implementation/QA complete and awaiting Product Owner acceptance in the worktree. Avoid mixing this UI initiative into its uncommitted implementation unless the Product Owner explicitly chooses that branch/scope.

### Phase 6: Cross-Workflow Accessibility and Responsive Verification (E7.1-E7.3)

1. Run automated accessibility checks on approved core flows.
2. Complete keyboard and screen-reader review and measured contrast checks against the approved target.
3. Validate the approved browser/device/viewport matrix for overflow, clipping, touch targets, dialog behavior, and long names.
4. Fix issues in the owning feature stories; document residual issues and avoid blanket conformance claims without evidence.

## Regression Strategy

- For each slice, run focused frontend tests first, then `npm run lint`, `npm test`, and `npm run build` in `apps/web` as appropriate.
- Add React Testing Library tests for modified loading, empty, error, success, dialog, keyboard, and accessibility states.
- Browser verification should cover admin navigation and unsaved drafts, nomination open/closed/reveal states, active and replaced ballots, close/reveal, and presentation neutral/revealed states.
- Assert privacy invariants: active rounds do not expose totals; named attendance is not ballot status; participant and presentation views expose no unauthorized admin controls or data.
- Record viewport/device matrix and evidence in the owning story QA artifacts. Backend tests are not required for pure styling changes; API tests are required only if a later approved task changes contracts or behavior.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Bootstrap resets conflict with legacy global selectors | Integrate in one slice, inspect styles in touched surfaces, and remove old selectors only after regression checks. |
| Shared primitives accidentally change focus or status announcement behavior | Keep semantic contracts explicit and add focused keyboard/status tests before broad adoption. |
| Visual redesign implies broader access or exposes private data | Keep route/capability boundaries; verify no totals during active voting and no ballot identity linkage in UI. |
| Acceptance target or device matrix remains undecided | Keep E7.1/PD-009 as a gate for conformance claims; request Product Owner decision before final verification. |
| Existing stories lack explicit UI acceptance criteria for setup/boards | Refine within US-004-US-007 where valid; create only a narrowly scoped follow-up story if distinct UX work remains uncovered. |
| Uncommitted E6.9 work is disturbed or mixed into redesign | Preserve current worktree; coordinate branch/merge sequencing before implementation. |

## Approval Requests

1. Approve this phased implementation plan and the initial foundation slice.
2. Resolve or explicitly defer the visual palette/type decision.
3. Approve the E7.1 accessibility target, browser/device matrix, and test approach before accessibility sign-off.
4. Confirm whether implementation should wait until the current E6.9 feature branch is accepted/merged or proceed on a separate approved branch.
