# E9.1 UX Design: Bootstrap 5 UI Modernization

## Status and Evidence
UX discovery assessment complete. The Product Owner approved the Bootstrap CSS and incremental modernization direction on 2026-10-26, and approved the navigation and workflow direction in this proposal. No application code or dependencies have been changed. Implementation requires explicit approval of the refined implementation plan and resolution or explicit bounding of its readiness gates.

The audit is based on source and story-document review, not moderated usability sessions or browser visual/accessibility testing. Observations below cite the current implementation; proposed behavior is a design recommendation, not a change to election rules.
## UX Audit

The frontend is feature-folder organized, but authenticated flow orchestration and much screen composition sit in `apps/web/src/App.tsx`; bespoke global styling is concentrated in `apps/web/src/styles.css`. Public nomination, voting, and presentation are already separate route surfaces.
| Problem | Observed root cause | Evidence and preserved strength |
| --- | --- | --- |
| Navigation feels difficult to follow | The current admin shell offers two workspace choices, then election and position selection, while lifecycle work is embedded within the position detail. The user must maintain the election/position context while moving among lifecycle stages. | `App.tsx` already labels position status and next action and exposes position selection; retain these cues and make their task destinations explicit. |
| Controls/actions are scattered | A position-level next-action summary may point to work farther down the same view or inside a disclosure; destructive position deletion is near the position summary. | `App.tsx` renders lifecycle labels and a position deletion action; `NominationAdminPanel.tsx` owns detailed nomination/round controls. Separate primary progression from secondary and destructive actions. |
| Multiple workflows appear together | Position detail composes nomination, round configuration, active voting management, results, candidate decisions, and history, despite these being different tasks and states. | Domain components already separate some behavior; make one lifecycle task the focus at a time without discarding history or status. |
| Users scroll between action and context | Progress/next action is summarized above detailed controls, while the actual action can be lower or disclosed. | Position progress exists. Keep a task-level action adjacent to the task and consider a compact persistent action area only if it preserves content visibility and focus order. |
| Text is difficult to read | Many labels, controls, helper/status messages, and metadata are styled at 11-13px. | `styles.css` has visible focus styles and responsive breakpoints, but body, labels, and instructions do not consistently meet the requested 16px target. |
| Dialog behavior is inconsistent | Dialog styling is shared, but keyboard/focus behavior is implemented in some individual flows and is not evident in others. | `NominationAdminPanel.tsx` and `PublicNominationPage.tsx` contain explicit Escape, focus-trap, and restoration logic for some dialogs; round lifecycle dialogs are not consistently backed by that pattern. |
| Lifecycle guidance is incomplete in practice | The product lifecycle is represented through status/next-action data, but the UI presents multiple stage panels together and can make the next permitted action hard to locate. | Preserve lifecycle/progress data; make the current stage, prerequisites, unavailable reason, and next permitted action visible within a focused workspace. |
Existing strengths to preserve: explicit loading/error/empty states; visible keyboard focus; reduced-motion support; unsaved-change confirmation; a standalone ballot with exact-selection feedback and no live totals; and explicit separation of board attendance from ballots.

## Current User Journeys
**Administrator election journey:** Register/sign in → register or select church → Department Elections → create/open election → review ordered positions → open a position → create and share nomination intake → close intake → review and consolidate names → configure candidate roster and selection count → confirm expected voter count → start voting → monitor active poll → close → reveal results → record candidate decisions → start another round or complete the position → move to the next position → review election history.

**Administrator board journey:** Annual Boards → create/open board year → review roster and sessions → create/select session date → mark attendance → save. Attendance remains an attendance record, not evidence that a person voted.
**Nomination participant journey:** Open position-scoped link → submit names → revise or withdraw while intake is open → receive the closed/unavailable state when intake closes.

**Voter journey:** Open voting link → read position/instructions → select exactly the configured number of candidates → submit or replace ballot while active → receive confirmation. Results are not part of this flow.

**Presentation journey:** Open separate read-only presentation → see neutral state until explicit reveal → view only approved revealed names/content. No admin controls or ballot results are implied before reveal.
## Proposed Information Architecture and Navigation

Recommend a three-level hierarchy for the authenticated administrator, with only the first two levels persistently navigable:

1. **Application/workspace:** church context and top-level switch between Department Elections and Annual Boards; account/session controls remain secondary.
2. **Election workflow:** within a selected election, an overview of ordered positions and their lifecycle statuses. The overview is the primary way to choose the position to work on.
3. **Contextual task:** within a selected position, a compact lifecycle stepper/task navigation for Overview, Nominations, Voting rounds, and Results/decisions/history. Show only applicable steps; position and round context stay visible. This can be local tabs/step links, not a new router requirement.
Do not expose a fourth global navigation tier. The round selector belongs inside the Voting rounds workspace. Keep guest nomination/ballot and presentation surfaces standalone with no admin navigation.

This hierarchy uses existing domain boundaries and makes each user's context answerable: church/workspace, election/position, current lifecycle task/status, available actions, and next permitted action.

## Redesigned Election Workflow
At every stage, distinguish **unavailable** from **not yet available** and **completed**. When an action is blocked, explain the prerequisite. Reversible actions, overrides, and destructive actions remain explicitly labeled and confirmed; do not hide them or imply that a completed step is immutable if policy allows reopening.

## Wireframes

**1. Application shell / election list**
**2. Election overview**

```text
Department Elections / [Election name]                 [Edit setup]
Department · election status · overall progress

Positions
1  Director · 1 opening     Nominations closed · Ready for round 1
	Next: Configure first round                             [Open position]
2  Subdirector · 2 openings  Voting active · Round 1
	Next: Monitor active round                              [Open position]

Completed positions and outcomes are visible without mixing their controls
into the current position task.
```

**3. Position workspace (desktop)**

```text
[Back to election]  Election name / Position name · N openings
Status: Voting active · Round 1                    [More actions ...]
[Overview] [Nominations] [Voting rounds] [Results & history]

Current task: Monitor voting
Status and allowed actions; no active-round totals
Contextual controls and explanatory status here

Bottom action row: [Secondary action]           [Primary permitted action]
Destructive actions live under More actions and require confirmation
```

At narrow widths, the task links may wrap or become a labeled select/list; task content and primary action remain visible without horizontal scrolling. Do not force sticky controls if they obscure content or focus.

**4. Focused nomination/consolidation task**

```text
Position / Nominations                           Status: Intake open/closed
Step: Configure/share -> Collect -> Close -> Consolidate -> Confirm roster
Current step and required prerequisite
Submitted names / edit normalized name / explicitly merge duplicates
Inline validation and save feedback
Actions adjacent to the work: [Save draft] [Confirm consolidated roster]
```

**5. Voting-round workspace**

```text
Position / Voting rounds                         [Configure next round]
Round list: Draft | Active | Closed | Revealed

Round N · [state]
Draft: roster + selection count + expected voter count -> confirm/start
Active: ballot participation status only if authorized; no totals
Closed: private result review and explicit [Reveal results]
Revealed: aggregate result + candidate decisions + next-round handoff
```

**6. Annual board workspace**

```text
Annual Boards / [Year]                            [Edit board]
Members and board-year status
Sessions                                      [Add session]
Session date | attendance summary | [Record attendance]
Selected session: named attendance controls and adjacent privacy note
Save action stays with selected attendance work
```

**7. Standalone participant and presentation surfaces**

```text
Ballot: Election / Position / Round context
Exact selection instruction -> candidate list -> selected count
Persistent in-flow [Submit/Replace ballot] -> announced result

Presentation: Election / Position context
Neutral waiting state until explicit reveal -> approved content only
```

## Typography, Spacing, and Component Standards

- **Typography:** set 16px as default body text and form-label target; instructions, statuses, and helper text should remain readable and not use tiny type as a hierarchy device. Use compact headings for operational workspaces, with clear distinction among page, section, and item titles. Final font family and palette require approval; do not infer them from Bootstrap defaults.
- **Spacing:** use Bootstrap spacing utilities and a small set of theme tokens; maintain predictable section rhythm and adequate separation between task content and actions. Avoid building a parallel spacing/grid system.
- **Status:** pair words/icons with color; distinguish lifecycle state from action. Use consistent text for active, draft, closed, revealed, completed, blocked, and unavailable states.
- **Actions:** one visually primary, state-permitted action per focused task; secondary actions nearby; destructive/rare overrides separated and confirmed. Keep the task action next to its content. A persistent bottom action row is optional and must not cover content or alter logical focus order.
- **Alerts and feedback:** inline field errors next to fields; page/workflow alerts near the relevant heading or task; async success/error announced through appropriate live regions and retained long enough to act. Toasts must not be the only feedback for important state transitions.
- **Dialogs:** standard responsive centered dialog with accessible name/description, initial focus, focus containment, Escape behavior when safe, background interaction prevention, and focus restoration to the trigger. Destructive confirmation states the consequence and a clear cancel action. Avoid nested dialogs.
- **Forms/lists:** explicit labels, grouped related controls, readable candidate/nominee names, wrapping long text, clear selected counts, and non-hover-only actions.
- **Bootstrap:** Bootstrap 5 CSS only with existing React-controlled components. Bootstrap utilities/components supply responsive layout and consistent baseline form, button, alert, and spacing styles. Keep React responsible for state, lifecycle, semantics, and events. Do not add React-Bootstrap or another UI library. Scope legacy selector cleanup to each migrated surface and verify reset collisions.

## Accessibility and Responsive Validation

Mobile voter access is required; existing session-link stories include 320 CSS px behavior. E7.1/PD-009 have not approved the conformance target, browser/device matrix, touch-target size, or test approach. WCAG 2.2 AA remains a proposal, not an accepted requirement. Resolve the target and test matrix before claiming conformance.

Preserve semantic heading order, labeled fields, keyboard reachability, visible focus, logical focus/restoration, announced async/error state, non-color status, reduced-motion support, zoom/reflow, and non-hover operation. Validate dialogs for centering, narrow viewport sizing, scroll containment, keyboard behavior, and focus return. Check long candidate and nominee names and avoid horizontal overflow. Include screen-reader review and measured contrast against the approved target.

## Regression Invariants and Strategy

For each approved UI slice: run the most focused frontend tests first, then lint, full frontend tests, and production build as appropriate. Add focused React Testing Library coverage for affected loading, empty, error, success, disclosure, dialog, and keyboard states. Validate in-browser using the approved viewport/browser matrix and record evidence in the owning story QA report.

Required protected-flow checks:

- Active voting never displays aggregate totals; exact ballot selection requirements remain intact.
- Attendance is not represented as ballot participation; profile/device counts are not described as people.
- Participant and presentation surfaces remain separate from authenticated admin controls and show only policy-approved content.
- Close/reveal/reopen and candidate decisions retain current lifecycle availability, warnings, confirmation, and feedback.
- Navigation preserves unsaved drafts and does not change routes, API contracts, authorization, tenant scope, or session-link resolution.
- Dialogs and action layouts remain keyboard-operable at narrow and desktop viewports.

## Incremental Implementation Stories and Dependencies

E9.1 remains the foundation and migration-conventions story. Do not duplicate existing feature work; refine UI-specific acceptance/tasks into the owning stories.

1. **Readiness gate (E7.1/PD-009):** approve conformance target, browser/device/viewport matrix, touch target expectation, and automated/manual test approach. Confirm typography/palette direction and baseline flows. This gates accessibility sign-off and responsive acceptance, not necessarily every initial CSS experiment.
2. **E9.1 foundation:** after implementation-plan approval, integrate Bootstrap CSS and theme tokens; create common shell/navigation, headings/statuses, alerts/form errors, action groups, responsive lists, disclosures, and accessible dialog patterns. Validate shell plus one admin and one participant slice.
3. **Setup workspaces (US-004-US-007):** onboarding, church/election setup, annual boards and attendance. Preserve attendance/privacy semantics and tenant scope.
4. **Nomination/roster tasks (E2.1-E2.4, E3.1-E3.4, with US-008-US-010 behavior ownership):** focused intake/consolidation/roster/round configuration. E2.4 correction behavior remains blocked until its product decision; do not invent a correction path.
5. **Voting and results (E4.1-E4.6, E5.1-E5.4, with US-011-US-012 behavior ownership):** active round monitoring, ballot mobile/recovery states, close/reveal, result scan, decisions, and next-round handoff. Preserve unresolved reset/undo policy gates.
6. **Presentation and session access (E6.8-E6.12):** apply visual primitives only within existing approved routes and audience rules; coordinate with E6.9 work and do not bundle QR future scope into the foundation.
7. **Cross-workflow validation (E7.2-E7.3):** keyboard/semantic and responsive repair using the approved E7.1 criteria and device matrix.

Dependencies and open gates: E7.1/PD-009 acceptance criteria; final typography/palette decision; implementation plan approval; coordination with accepted-but-push-pending E6.9 work and the current worktree/branch state. Do not change election rules, privacy/access policy, APIs, database, identity, report audience, retention, or unresolved correction/undo policies through UX work.
# E9.1 UX Design: Bootstrap 5 UI Modernization

## Status

Discovery assessment complete; Bootstrap CSS approach approved by the Product Owner on 2026-10-26. Detailed visual tokens and implementation plan require approval before code changes. No application code or dependencies have been changed for this initiative.

## Current UI Assessment

The React/TypeScript frontend is divided into feature folders with typed API clients. Admin workflow composition and state are concentrated in `apps/web/src/App.tsx`; shared styling is concentrated in `apps/web/src/styles.css` with many bespoke selectors. `apps/web/package.json` does not currently include Bootstrap. Public nomination, ballot, and presentation routes are distinct from the authenticated application.

Existing strengths include workflow progress, explicit loading/error/empty states, visible focus styles, keyboard-aware confirmation behavior, and separation of ballot choices from named attendance. Current layouts are restrained and text-led. Risks are uneven styling patterns, central orchestration complexity, and incomplete browser-level verification of responsive and accessible behavior.

## Design Direction

- Use Bootstrap 5 CSS for responsive grid, spacing, forms, buttons, alerts, and common visual primitives; keep React components responsible for state and behavior.
- Use a small application theme layer for brand colors, typography, spacing, focus treatment, and status colors. Avoid a second custom grid system.
- Preserve a calm, professional and scannable operational interface. Keep headings compact, statuses explicit, actions predictable, and decoration limited.
- Initially retain the restrained green direction and current type family while validating Bootstrap integration. Review palette and typography during visual refinement before implementation rather than assume this is a permanent product decision.
- Use color with text/icon cues, maintain visible focus, wrap long names, stack actions/forms at narrow widths, and avoid horizontal scrolling.

## Bootstrap Integration Decision

Use Bootstrap 5 CSS with current React-controlled components. This matches the current React architecture, adds layout and style primitives without adopting a second component abstraction, and limits integration complexity. Do not add React-Bootstrap or another component library in this initiative unless a concrete accessibility or maintenance need is demonstrated in the implementation plan.

Bootstrap reset/global styles can collide with legacy element selectors. Migrate by surface and remove old rules only when their replacement is verified. Preserve native semantic controls where practical and retain custom workflow-specific behavior.

## Application Layout and Navigation

- **Admin shell:** Signed-in application with clear church/election context and navigation between Department Elections and Annual Boards. Preserve the current election/position progression and unsaved-change warning behavior.
- **Participant surfaces:** Standalone nomination and ballot routes opened through scoped links. Do not show admin navigation or controls. Keep the ballot direct, readable, and usable on small screens.
- **Presentation surface:** Standalone, read-only view. Keep it neutral until authorized reveal and show only policy-approved content.
- Keep routes, API access, authorization, and session-link resolution unchanged. UI hiding is not a security boundary.

## Reusable Component Strategy

Introduce small shared React primitives for:

- Application and page shells, navigation, and section headings.
- Status badges/text, alerts, inline validation, and loading/empty/error states.
- Labeled fields, form groups, button/action groups, and responsive list/table rows.
- Disclosures and confirmation dialogs with accessible names, focus handling, and keyboard behavior.

Keep domain components such as nomination intake, ballot choices, candidate roster/results, and attendance editor within their feature folders. Shared primitives should reduce duplicated presentation logic, not conceal domain rules or duplicate workflow state.

## Responsive and Accessibility Requirements

Mobile access is required, and existing session-link stories specify 320 CSS px behavior. E7.1/PD-009 have not yet approved the conformance target, browser/device matrix, touch-target size, or manual test expectations. Therefore, WCAG 2.2 AA is a proposal only; E9.1 must not claim conformance until Product Owner decisions and validation evidence exist.

At minimum, preserve semantic headings and labels, keyboard reachability, visible focus, logical focus restoration, announced async status/errors, dialog keyboard behavior, and status cues that do not rely on color. Test long candidate/nominee names, narrow layouts, zoom/resizing as included in the eventual approved matrix, and non-hover operation.

## Privacy and Workflow Invariants

- Do not show aggregate totals during active voting.
- Do not associate named attendance with ballot participation or choices.
- Do not represent browser-profile submissions as a count of verified people.
- Participant and presentation surfaces remain separate from admin capability and disclose only their approved current-session content.
- Preserve unsaved-draft warnings, role boundaries, privacy text, API contracts, and all existing election rules.

## Existing Story Overlap

E9.1 owns the shared design foundation and migration conventions only. Feature behavior and acceptance remain with E2.1-E2.4, E3.4, E4.1-E4.6, E5.1-E5.4, and E6.8-E6.12. Accessibility target/semantics and responsive validation belong to E7.1-E7.3. Onboarding, boards, and election configuration should be incorporated into their existing US-004 through US-007 scope where possible; create no duplicate feature story unless refinement proves there is a distinct uncovered UX deliverable.
