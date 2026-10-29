# E9.1 Handoff

## Completed

- Canonical `prototype.html` now combines the complete three-experience workflow from `prototype-full-workflow.html` with the accessible department accordions from commit `9ab071490a2020ae81b97ab2ccfb25f87406dbd1`. The administrator overview, nomination/voting workflow, standalone participant page, and separate read-only presentation remain available in one prototype.
- Prototype verification: admin navigation reached the election overview and nomination intake; voter and presentation routes rendered independently. Embedded JavaScript syntax is valid; all 130 IDs are unique and the required workflow/view controls are present. Cross-window localStorage sync is not available from `file://`; use a same-origin HTTP server for synchronized mock workflows.
- Voter link now keeps the nomination form and submit button visible before intake opens, with fields/button disabled and a clear prerequisite message; opening intake enables submission. Verified both states over same-origin HTTP.
- Full prototype voter path verified over same-origin HTTP: submit a nomination list, close intake, confirm/reveal the consolidated list, prepare and open round 1, select exactly two candidates, and submit the ballot. The ballot action is intentionally hidden until voting opens and disabled until the configured two candidates are selected; successful submission changes it to “Replace ballot” and announces confirmation.
- Product Owner accepted the first admin slice on 2026-10-28, including the term chooser width correction. The authenticated overview, term chooser, department accordions, and demo-only inactive link examples are implemented.
- The Annual Boards/attendance presentation now uses Bootstrap responsive columns and list groups. Existing API calls, session selection, attendance drafts, save behavior, and privacy messaging are unchanged.
- Browser evidence is in `docs/stories/E9.1/visual-review/`: admin and board captures at desktop/mobile, with reproducible capture scripts.
- The approved admin nomination/voting workflow slice adds a four-stage progress sequence and an API-state-derived current-task summary in `NominationAdminPanel`. Task appears above progress on desktop and mobile; intake, reveal, rounds, candidate decisions, and existing navigation behavior remain in place.
- The guided-stage sequence exposes current/completed/upcoming state to assistive technology. Mobile workflow labels and share URL readability were refined after UX review.
- UX reviewed the final matched 1280px and 390px captures and found no blocker. Remaining differences are the real authenticated shell/position controls and longer page, real task wording/state versus prototype mock copy, and prototype-only session/presentation controls; these are documented in `visual-review/report.md`.
- The `Open nomination intake` current-task screen now has breadcrumb context, a lifecycle badge beside the task heading, a capability-aware access-shortcut row, and an adjacent lifecycle-aware nomination roster. The existing API-derived workflow state and the `Manage nominations` shortcut remain intact. Added four prototype/React captures at 1280px and 390px in `visual-review/`.
- Final comparison found no horizontal overflow at either viewport. Remaining differences: the actual authenticated shell and position management controls make the React page longer; the existing `Manage nominations` shortcut remains in addition to the task-specific primary action; session/presentation controls are real and capability-gated instead of prototype mock links. No API/domain behavior was introduced.
- Follow-up from Product Owner visual review: election accordion rows now expose election-level **Edit** and normalized position **Not started / In progress / Complete** statuses with **Start / Continue / Review** actions. The position workflow entry no longer includes the marked election summary, position selector, current-position summary, delete control, or previous/next controls; its breadcrumb remains the guarded return path. Redundant task-purpose copy was removed, while the existing **Manage nominations** shortcut is retained.
- Final UX review of 1280px and 390px captures confirmed all three actions, Edit affordances, task hierarchy, removal of the marked block, and mobile breadcrumb wrapping. No horizontal overflow was visible. Remaining differences are production shell/capability-gated links and the retained secondary nominations shortcut; sample inactive links exist in both the prototype and app overview.
- The API-backed **Open nomination intake** action now reveals the existing name-limit form; **Create intake** transitions to a full-width open-collection view using server intake state. The duplicated lower public URL/copy and presentation controls are removed; the top access shortcuts remain. The collection view shows profile count, name limit, anonymous names, empty state, live announcements, and the existing close confirmation; closed-intake consolidation/reveal remains intact.
- Latest active-intake captures at 1280px and 390px are `react-position-workflow-1280.png` and `react-position-workflow-390.png`. Browser verification reported no console/network errors or horizontal overflow. The capture harness's old position-stepper counter is obsolete and returns zero; it now waits for the active collection heading before capture.

## Pending Review

- Product Owner requested restoration of the complete prototype experience after the accordion update. The canonical prototype is now consolidated as above; policy conflicts documented in `three-experience-proposal.md` remain unresolved and are not implemented in the application.
- Annual Boards has no approved prototype reference; its responsive migration is validated but still needs Product Owner visual review. US-006 formal acceptance is not recorded.
- Other admin visual differences remain documented in `visual-review/report.md`: no production election-period model, demo terms do not filter API elections, and sample links are inactive. Decide separately whether any of these require a new approved product/API scope.
- E7.1/PD-009 accessibility target and device matrix remain open; do not claim accessibility conformance.

## Branch And Validation

- Branch: `feature/e9.1-admin-foundation`; active PR #15, “Implement E9.1 admin UI foundation.” The E9.1 workflow changes and visual evidence are committed separately from the pre-existing `docs/product/backlog.md` change. No merge or deployment was made.
- Latest validation: focused active-intake lifecycle, edit/status, and unsaved-draft tests passed; full frontend suite passed (83); `npm run build` and `git diff --check` passed. `npm run lint` had zero errors and the existing TypeScript parser support notice plus `src/main.tsx` non-null assertion warning. Final browser captures at 1280px and 390px reported no horizontal overflow, console errors, or failed requests.
- Annual Boards browser check at 1280px and 390px confirmed expected desktop/mobile layout, three attendance controls, and no horizontal overflow or browser errors.

## Next Recommended Task

Product Owner visual acceptance remains pending for this position-workflow slice and the Annual Boards migration. Review `visual-review/report.md` and the dashboard/workflow captures. Do not merge or deploy without explicit authorization. Keep election-period/API work separate.

## Latest Follow-up (2026-10-29)

- The current-task card owns the **Open nomination intake** action; its existing name-limit form and API-backed **Create intake** transition remain unchanged. Session-link shortcuts stay in the top access area; audience presentation controls now occupy a separate section beneath workflow progress.
- Mobile workflow heading controls were wrapping over the position title at 390px. The responsive header now gives the title a full row and places the actions beneath it. Refreshed captures are `visual-review/react-position-setup-1280.png`, `react-position-setup-390.png`, `react-position-workflow-1280.png`, and `react-position-workflow-390.png`.
- Focused workflow/intake tests (2) and the full frontend suite (83) passed; build passed; lint had zero errors with the existing parser compatibility notice and `src/main.tsx` non-null assertion warning; `git diff --check` passed. Browser verification confirmed no horizontal overflow. The capture's initial no-intake GET returns an expected fixture 404, and the long-lived event stream is aborted when the browser closes.
- Current observed branch is `main` with uncommitted changes. Preserve all existing work; no commit, merge, or deployment was made. Product Owner visual acceptance remains pending.

## Open Intake Visual Follow-up (2026-10-29)

- Latest screenshot comparison showed that the active intake screen still diverged from the prototype. The current task/progress, API-backed submission metrics, close action, and audience-presentation control are now one bordered workflow stage; the names roster is a separate section below.
- Active task title now reads **Manage nomination list**; removed the duplicate intake-open heading. Kept the API-backed count caveat, per-profile limit, and privacy disclosure. No mock-only broadcast capability was added.
- Refreshed screenshots: `visual-review/react-position-workflow-1280.png` and `visual-review/react-position-workflow-390.png`; both show the two-section composition with no horizontal overflow. Setup captures are also current.
- Full frontend suite passed (83), build passed, lint had zero errors with the existing parser compatibility notice and `main.tsx` non-null assertion warning, and `git diff --check` passed. Browser fixture's pre-create 404 and stream abort on teardown are expected.
- Branch remains `main` with uncommitted changes; no commit, merge, or deployment.

## Position Workflow Review Observations (2026-10-29)

- Removed **Edit election** and **Manage nominations** from the position workflow page; the overview setup action remains separate.
- Put **Position workflow** and the position name inside the white current-task/progress card.
- Open intake displays the explicit current action title **Nomination intake is open**.
- Admins see current submitted names in an alphabetized, numbered list. Duplicate spellings/entries remain visible until consolidation, per E2.1; no submitter/device identity is shown. Profile count and name count remain separate.
- Approval screenshots are current at 1280px and 390px: `visual-review/react-position-setup-1280.png`, `react-position-setup-390.png`, `react-position-workflow-1280.png`, and `react-position-workflow-390.png`. No horizontal overflow observed. Browser fixture's expected initial intake 404 and stream-abort-on-teardown are noted in the report.
- Focused tests (4) and all frontend tests (83) passed; build passed; lint had zero errors with the existing parser compatibility notice and `src/main.tsx` warning; `git diff --check` passed. No commit, merge, or deployment.
- Waiting for Product Owner review/approval of the captured position-workflow UI.

## Live Names Follow-up (2026-10-29)

- Root cause of the reported missing names: the API admin projection emitted no `submissions` until intake closure. Changed it to return current anonymous submissions during open intake. The presentation projection remains empty until reveal.
- Updated integration expectations cover changing submissions, profile withdrawal, resubmission, close, and no submitter/device identity in the admin response. API suite passed (37 tests); frontend suite passed (83); focused workflow and backend integration checks passed.
- Refreshed `visual-review/react-position-workflow-1280.png` and `react-position-workflow-390.png`; both show current submitted names. No horizontal overflow observed. Browser fixture's expected initial intake 404 and stream teardown abort remain noted.
- Frontend production build passed; lint has zero errors with the existing parser compatibility notice and `main.tsx` non-null assertion warning; `git diff --check` passed. No commit, merge, or deployment.

## Closed Review Visual Follow-up (2026-10-29)

- Simplified closed intake into a single connected review surface and shared-list editor; removed repeated intake details, duplicate roster, empty Removed section, duplicate closure message, and saved-state copy. The list is open by default.
- Initial round setup is hidden until explicit reveal; existing prior-round controls remain visible if rounds already exist.
- Captures: `visual-review/react-position-closed-review-1280.png` and `react-position-closed-review-390.png`; no horizontal overflow observed. Capture fixture now returns an empty rounds array for this pre-round review state.
- Focused close/reveal tests (2) and full frontend suite (83) passed; build passed; lint had zero errors with existing compatibility/non-null assertion warnings; `git diff --check` passed. No commit, merge, or deployment.

## Workflow Palette Follow-up (2026-10-29)

- Compared app and prototype palette tokens; root values already matched. Increased saturation/contrast only for workflow state chips, current-step marker, and disabled presentation control to match the prototype's green-soft states and standard disabled opacity.
- Refreshed workflow screenshots at 1280px and 390px. No horizontal overflow observed.
- Full frontend suite (83), production build, and `git diff --check` passed. Lint has zero errors with existing parser compatibility notice and `main.tsx` non-null assertion warning. No commit, merge, or deployment.

## Election Terms Page Follow-up (2026-10-29)

- The term chooser now has a church / **Election terms** breadcrumb, separated term rows, and an explicit **Open election** action. The **Annual Boards** tab is hidden only on the term chooser; it remains available on the election list and other admin screens.
- Supporting text weight was raised from 450 to 500 and the muted text token darkened from `#5b6862` to `#4b5851`; the prototype's Avenir Next font stack is retained.
- **Add period** is enabled and uses the prototype's white, bordered secondary style. Clicking it shows the prototype-only notice; it does not persist data or call an API because election periods are not represented by the current API.
- Focused term chooser test passed, production build passed, and `git diff --check` passed. Full suite has not been rerun after the latest visual-only follow-ups. No commit, merge, or deployment.

## Sign-In Comparison Follow-up (2026-10-29)

- Matched sign-in eyebrow labels to the prototype green and neutralized Chrome autofill's blue field fill with a white login input surface. Blur password field only in the screenshot harness before capture; runtime keyboard focus styling is unchanged.
- Refreshed `visual-review/react-sign-in-1280.png` and `react-sign-in-390.png`. Frontend tests (83), build, and diff check pass; lint has zero errors with existing parser compatibility and `main.tsx` warnings.

## Page Background Follow-up (2026-10-29)

- Restored prototype background values exactly: `#f5f6f1` paper, `.55` green wash opacity, and `.035` horizontal rule opacity. Also matched root light color-scheme, 16px font size, 1.5 line-height, and 450 font weight.
- Refreshed sign-in captures at desktop/mobile; no horizontal overflow. Frontend tests (83), build, and diff check pass; lint has no errors with existing parser compatibility and `main.tsx` warnings.
