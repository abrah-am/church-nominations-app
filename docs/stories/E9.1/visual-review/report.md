# E9.1 Administrator Visual Review

**Review date:** 2026-10-27<br>
**Branch:** `feature/e9.1-admin-foundation`<br>
**Reference:** `../prototype.html`<br>
**Capture method:** Prototype rendered directly; React rendered from Vite with temporary browser-request interception returning API-shaped auth/church/election payloads. Interception exists only in `capture-react.mjs`; no mock data or simulation logic was added to the app.<br>
**Viewports:** 1280×800 desktop and 390×844 mobile. Full-page screenshot files retain page height as required to capture the complete screen.

## Screenshots

| State | Prototype | React |
| --- | --- | --- |
| Sign-in, 1280px | ![Prototype sign-in desktop](prototype-sign-in-1280.png) | ![React sign-in desktop](react-sign-in-1280.png) |
| Sign-in, 390px | ![Prototype sign-in mobile](prototype-sign-in-390.png) | ![React sign-in mobile](react-sign-in-390.png) |
| Church dashboard, 1280px | ![Prototype dashboard desktop](prototype-dashboard-1280.png) | ![React dashboard desktop](react-dashboard-1280.png) |
| Church dashboard, 390px | ![Prototype dashboard mobile](prototype-dashboard-390.png) | ![React dashboard mobile](react-dashboard-390.png) |
| Election overview, 1280px | ![Prototype election overview desktop](prototype-election-overview-1280.png) | ![React overview desktop](react-dashboard-1280.png) |
| Election overview, 390px | ![Prototype election overview mobile](prototype-election-overview-390.png) | ![React overview mobile](react-dashboard-390.png) |
| Position navigation, 1280px | ![Prototype position navigation desktop](prototype-position-navigation-1280.png) | ![React position navigation desktop](react-position-navigation-1280.png) |
| Position navigation, 390px | ![Prototype position navigation mobile](prototype-position-navigation-390.png) | ![React position navigation mobile](react-position-navigation-390.png) |

## Comparison

- **Sign-in:** Updated to use the prototype's context masthead, centered bordered white form panel, ruled pale background, Avenir Next system stack, green action, and comparable field sizing. Product-specific registration and credentials-in-memory text remain because they are real application behavior. The React masthead retains truthful sign-in context rather than sample church/year data.
- **Church dashboard:** The prototype shows position counts and election-period cards. The production API has no election-period/year entity, so React cannot truthfully reproduce 2025/2026 period cards or historical period actions. The authenticated app keeps its real church shell and Department elections/Annual Boards navigation.
- **Election overview:** React now uses the prototype's restrained ruled background, bordered department groupings, readable position rows, status chips, and clear next-action controls. It renders all positions from authenticated API data. The prototype's 2026 breadcrumb and period heading are intentionally omitted because the domain/API has no period field. Sample mock status totals are replaced by actual API-derived totals; production uses `Complete` rather than prototype-only `Filled` wording.
- **Position navigation:** React keeps its existing ordered, keyboard-operable selector, unsaved-draft protections, and detail workflow. Type size and status/action hierarchy have been brought closer to the prototype. The prototype's focused task panel, session-link copy, and presentation controls are not all represented here: stable participant session routing remains E6.11 work and presentation/result controls remain owned by E6.8/E6.9. Adding those during this visual correction would exceed the approved slice.
- **Mobile:** At 390px, department/position content stacks and next actions are full width. Browser capture reported no horizontal overflow. The page remains vertically longer than the prototype due to the actual authenticated navigation and complete election list.

## Remaining Differences For Product Owner Review

1. The API has no election-period abstraction; adding the prototype's year/period dashboard requires a separately approved product/domain/API change or a decision to treat departments as the first production overview level.
2. The prototype's position task frame includes session-link and presentation controls. Those are dependent on E6.11 participant-link implementation and E6.8 presentation controls; they were intentionally not added in this first-slice correction.
3. The React position detail includes existing position administration controls (delete, previous/next, nomination panel) not present in the overview prototype screen. They remain to preserve existing functionality and belong to later workflow-specific visual slices.
4. Exact platform font rendering varies; React uses the local `Avenir Next, Avenir, Segoe UI` stack requested by the prototype. The capture makes no external Google Fonts request.

These are the remaining intentional differences. No simulated period, mock election outcomes, voter/presentation workflow, or candidate-response functionality was introduced.

## Prototype-Only Term and Accordion Follow-up (2026-10-28)

- Product Owner approved the first slice with a minor styling correction: the React term rows now use the full available content width rather than stopping at 760px. Desktop and mobile captures confirm the rows fill their container without horizontal overflow.
- The post-login Administrator Workspace now offers sample `Elections 2026` and `Elections 2027` terms. These are explicitly labeled prototype-only; the current election API still has no election-period/year association. Live API election rows are shown under the selected sample term for visual presentation and are not filtered or persisted by term.
- Department election rows now use a Bootstrap accordion for position density, with a separate department row continuing to the existing detail workflow. The position action label is `Configure Position`.
- The election overview shows `sample://` voting and presentation link examples labeled `DEMO LINK · NOT ACTIVE`; they are not routable, copyable, or bound to the real voter/presentation APIs.
- The static prototype was updated to show the same term chooser, term heading, department accordions, label, and inert demo links. Its browser flow passed at 1280px and 390px: four department accordions rendered, the first collapsed/reopened, and no horizontal overflow was detected.
- The React browser fixture run showed Elections 2027, four department rows, two inactive link indicators, and a working collapse/reopen interaction with no console/network errors or horizontal overflow. Full frontend tests: 82 passed; lint: 0 errors with existing warnings; production build passed.
- The selected sample term is a visual-only grouping, not a persisted filter: the same live API election rows are shown under either sample term. The browser test and sample-state copy state this limitation explicitly. A real historical/term-based selection needs an election-period model and API contract.
- By request, the standalone prototype now includes the same sample term chooser and department accordion presentation. Its `sample://` voting/presentation values are display-only and do not open its role windows.

## Annual Boards Responsive Migration (2026-10-28)

- The existing Annual Boards detail uses Bootstrap responsive columns for the roster and sessions: two equal columns at desktop and a single stacked column at 390px. Board-year, roster, and recorded-session summaries use responsive Bootstrap columns and stack on mobile.
- Session selection and attendance use Bootstrap list groups with the existing React state and API calls. The attendance privacy note, named roster, per-session selection, and explicit save action are unchanged.
- Browser-only API-shaped data was used to exercise the real authenticated navigation. At 1280px, roster and sessions each measured 540px and shared the same vertical start; at 390px, both measured 358px and stacked vertically. Three attendance checkboxes rendered at both sizes; document overflow was false; console errors and failed requests were zero.
- Screenshots: `react-annual-board-1280.png` and `react-annual-board-390.png`. Reproduction: `capture-boards.mjs`.
- The prototype does not contain an Annual Boards reference, so this validates responsive implementation and retained behavior rather than direct prototype fidelity. Product Owner visual review remains pending.
- Validation: Annual Boards/attendance focused tests passed (3); full frontend suite passed (82); lint reported zero errors with the existing TypeScript/parser support warning and existing `src/main.tsx` non-null assertion warning; production build passed.

## Position Workflow Current Task: Open Nomination Intake (2026-10-28)

- The existing React position workflow now shows election/position breadcrumb context, current position access shortcuts, the stage status beside the current-task title, and the task-specific `Open nomination intake` action. A neighboring roster panel uses `Names not yet submitted` for setup/open intake and `People on the ballot` after closure. The four-stage accessible progress sequence and existing API-owned state remain in place.
- Shortcuts are truthful to application capabilities: the nomination-copy control is disabled until the position intake supplies its access token; presentation is disabled until nominations are revealed, then calls the existing presentation flow. No session-wide participant link exists in this API model, so no mock URL or simulated sign-in was added.
- Captures: `prototype-position-workflow-1280.png`, `prototype-position-workflow-390.png`, `react-position-workflow-1280.png`, and `react-position-workflow-390.png`. Both apps were rendered at 1280px and 390px. Prototype capture used same-origin HTTP and prototype-only state; React capture used API-shaped request interception outside the app.
- Comparison: The task heading/status, progress, primary action, and initial empty-roster label now match the target intent. React stacks the access and roster panels at 390px with no horizontal scrolling. Remaining differences are the real authenticated shell, ordered position navigation/delete/previous-next controls, the extra existing `Manage nominations` shortcut, and production copy. The prototype exposes mock session/presentation controls; the app instead shows real capability-dependent controls and a brief availability explanation. The authenticated page is consequently longer than the prototype.
- Browser verification: no console errors, failed requests, or document-width overflow at either viewport. Focused guided-workflow test passed; full frontend suite passed (83); `npm run lint` had zero errors and the existing parser compatibility/non-null assertion warnings; `npm run build` and `git diff --check` passed.

## Election Accordion And Workflow Entry Follow-up (2026-10-28)

- Department election rows now provide an **Edit** action that opens the existing `ElectionForm` with the selected election's API-backed values. Position rows show normalized **Not started**, **In progress**, or **Complete** status and the matching **Start**, **Continue**, or **Review** action. Unknown lifecycle states display `Progress unavailable` and do not offer a misleading action.
- Position workflow detail was simplified: removed the election summary, position navigation list, current-position summary, delete-position control, and previous/next buttons shown in the user-marked screenshot. The breadcrumb retains a guarded `All elections` return, so unsaved intake and candidate-decision drafts still require explicit discard. Existing task progress, nomination/round controls, access shortcuts, and roster remain.
- Removed the repeated purpose subtitle and extra invitation sentence ahead of the primary `Open nomination intake` action. Kept the existing secondary **Manage nominations** action to preserve its lifecycle access behavior.
- Captures: `react-dashboard-1280.png`, `react-dashboard-390.png`, `react-position-workflow-1280.png`, and `react-position-workflow-390.png`. At 1280px and 390px, the accordion shows consistent status/action labels, the workflow has no marked detail block, and the breadcrumb wraps without clipping or a stranded separator. Browser verification reports no console errors, failed requests, or horizontal overflow. The capture script's legacy `positionRows` counter counts the removed `.position-stepper-item` selector and reports zero; screenshots and explicit role assertions confirm the workflow rendered.
- UX reviewed the final captures and confirmed the requested action states, Edit affordance, simplified workflow, and mobile reflow. Remaining differences are the authenticated application shell, real capability-gated links, the retained secondary **Manage nominations** action, and API-derived counts. The sample-link panels are visible in both current prototype and implementation; they remain explicitly inactive demo content.
- Validation: focused workflow, edit/status, and unsaved-navigation tests passed; all frontend tests passed (83); production build passed; lint had zero errors and the existing `main.tsx` non-null assertion warning plus parser TypeScript support notice; `git diff --check` passed.

## Open Nomination Intake Transition (2026-10-28)

- The setup task now follows the production workflow in two API-backed stages: **Open nomination intake** reveals the existing per-profile name-limit form; **Create intake** submits through the existing API and replaces setup content with a full-width active collection view. The open view shows profile count, per-profile limit, anonymous proposed names, empty/loading/error/live-update states, and the existing close confirmation.
- The top access area remains the single location for Copy nomination link and Presentation actions. The duplicated lower public URL/copy button and lower presentation controls were removed; hide/end presentation controls remain with the top access controls when the existing presentation session permits them. The open state removes the otherwise-empty adjacent candidate roster panel and uses the full workflow width.
- Browser-only API-shaped fixtures now exercise the real setup -> create -> open transition for screenshots. Final captures: `react-position-workflow-1280.png` and `react-position-workflow-390.png`; no console errors, failed requests, or document-width overflow were observed. The browser runner's legacy stepper counter returns zero because the old position stepper is intentionally removed; the capture script waits on the active intake heading and renders screenshots after that state.
- UX comparison: the existing React authenticated shell, breadcrumb, access panel, task/progress card, and collection roster remain product-specific; the reference prototype uses mock session links. The active collection section now takes the available workflow width and does not duplicate its empty roster in a side panel. Links remain real and capability-gated at the top.
- Validation: focused nomination lifecycle test passed; full frontend suite passed (83); TypeScript/Vite production build passed; lint had no errors and the existing `main.tsx` non-null assertion warning plus TypeScript parser support notice; `git diff --check` passed.

## Admin Nomination And Voting Workflow (2026-10-28)

- The approved E9.1 admin workflow slice adds an API-state-derived current task and four-stage progress sequence to the existing position workflow. The task precedes progress at desktop and mobile widths; existing nomination/round controls, routes, API contracts, explicit reveal actions, privacy boundaries, and unsaved-draft protections remain unchanged.
- Browser comparison captures: `prototype-position-navigation-1280.png`, `prototype-position-navigation-390.png`, `react-position-navigation-1280.png`, and `react-position-navigation-390.png`. Both pairs were rendered at 1280px and 390px. Prototype active-intake panels use capture-harness state injection because its persisted mock transition did not expose that panel reliably in headless mode. React capture uses browser-request interception with API-shaped fixtures in `capture-react.mjs`; no fixture logic was added to the application.
- UX review accepted the task-first hierarchy and mobile URL readability with no blocker. Significant intentional differences remain: React includes the real authenticated shell and position controls, so the page is longer; React task wording follows production lifecycle/API state; prototype-only session-link, broadcast, and presentation controls are not substituted for production behavior.
- Final browser capture reported no horizontal overflow or console errors. The authenticated React capture's long-lived nominations stream was aborted at browser teardown; this is capture cleanup, not an app error.
- Validation: full frontend suite 83 passed; focused guided-workflow test passed; lint had zero errors and the existing TypeScript/parser support warning plus `src/main.tsx` non-null assertion warning; TypeScript check and Vite production build passed.

## Task And Presentation Hierarchy Follow-up (2026-10-29)

- The setup-stage **Open nomination intake** action now sits inside the current-task card. It reveals the existing name-limit form; **Create intake** remains the explicit API-backed submission action. The open collection state still replaces setup content after the API response.
- Session-link shortcuts remain in the top access area. Presentation display status and its real capability-gated controls now sit in a separate audience-presentation section below the progress card, rather than sharing the session-link shortcuts.
- Added setup-stage captures `react-position-setup-1280.png` and `react-position-setup-390.png`; refreshed open-intake captures `react-position-workflow-1280.png` and `react-position-workflow-390.png`. At 390px, the workflow title and its Edit election/Manage nominations actions wrap without overlap; document-width overflow is false.
- Browser fixture note: the app's initial GET for a not-yet-created intake intentionally returns HTTP 404 before the setup form is shown. The live nomination event stream also reports `ERR_ABORTED` when the browser closes after capture. These are fixture/lifecycle behavior, not an unexpected API failure. The capture's current final state has no horizontal overflow.
- Validation after this follow-up: focused task/intake checks passed (2); full frontend suite passed (83); production build passed; lint reported zero errors with the existing TypeScript parser support notice and `src/main.tsx` non-null assertion warning; `git diff --check` passed.

## Open Intake Prototype Alignment Follow-up (2026-10-29)

- The active intake screen now groups the current task/progress, API-backed profile count and per-profile name limit, close action, and audience-presentation control inside one bordered workflow stage. The names roster is a separate section below, matching the prototype's stage-plus-roster composition.
- Active task wording is **Manage nomination list** and the redundant **Nomination intake is open** subheading is removed. The production-only profile-count caveat and no-names-before-reveal privacy copy remain; prototype-only broadcast controls were not added.
- Refreshed `react-position-workflow-1280.png` and `react-position-workflow-390.png`; both show the new composition and no horizontal overflow. Setup captures remain `react-position-setup-1280.png` and `react-position-setup-390.png`.
- Browser fixture behavior remains: initial GET before intake creation returns 404, and the long-lived event stream aborts on capture teardown. These are expected from the harness. Full frontend tests: 83 passed; production build passed; lint had zero errors with existing TypeScript parser compatibility and `main.tsx` non-null assertion warnings; `git diff --check` passed.

## Position Workflow Review Observations (2026-10-29)

- Removed the position-page **Edit election** and **Manage nominations** buttons. The overview's existing setup-status action remains outside this position workflow page.
- Moved the **Position workflow** label and position name into the white current-task/progress card; no separate workflow heading is rendered above the card.
- While intake is open, the current action title reads **Nomination intake is open**.
- Current anonymous submissions now appear in an alphabetized, numbered **Submitted names** list in the open-intake section. Duplicate names remain visible until consolidation, matching E2.1; submitter/device identity is not displayed. The profile count remains distinct from the number of submitted names.
- Final captures refreshed: `react-position-setup-1280.png`, `react-position-setup-390.png`, `react-position-workflow-1280.png`, `react-position-workflow-390.png`. Browser reports no document-width overflow. The fixture's initial pre-create GET 404 and event-stream teardown abort are expected.
- Validation: focused position workflow tests passed (4); full frontend suite passed (83); production build passed; lint had zero errors with the existing TypeScript/parser support notice and `src/main.tsx` non-null assertion warning; `git diff --check` passed.

## Live Submitted Names Data Fix (2026-10-29)

- The empty admin list was caused by the API, not the React list renderer: authenticated admin responses intentionally returned an empty `submissions` array until `listCreated`/intake closure. The admin response now returns current submissions while intake is open; names still contain no submitter/device identity.
- The presentation projection remains neutral and returns no nominations before explicit reveal. The browser fixture now visibly exercises the returned submissions; it includes five names from three profiles to demonstrate that contributor count and name count differ.
- Refreshed desktop/mobile active-intake captures at `react-position-workflow-1280.png` and `react-position-workflow-390.png`; both show the five names. Browser reported no horizontal overflow. Its initial empty-intake GET 404 and event-stream abort at teardown are expected fixture behavior.
- Validation: API focused and full test suites passed (37 total full-suite tests); frontend tests passed (83); frontend build passed; lint had zero errors with existing TypeScript parser compatibility and `main.tsx` warnings; `git diff --check` passed.

## Closed Intake Review Layout Follow-up (2026-10-29)

- Closed intake now has a single continuous white review surface: the task/progress panel joins directly to the shared nomination list. Removed the repeated closed-intake disclosure/metrics, separate candidate-roster card, duplicate closure announcement, empty Removed section, and redundant saved-status sentence.
- The review list is always visible with correction, save, removal, restore, and confirmation-history actions retained. Round setup is deferred until explicit reveal; existing prior-round history and actions remain available when rounds already exist.
- Refreshed closed-state captures: `react-position-closed-review-1280.png` and `react-position-closed-review-390.png`. Browser reports no horizontal overflow. The capture fixture supplies an empty rounds response in the closed initial-review state and notes the expected initial intake 404/stream teardown abort.
- Validation: focused close/reveal tests passed (2); all frontend tests passed (83); production build passed; lint had zero errors with the existing TypeScript parser compatibility notice and `main.tsx` non-null assertion warning; `git diff --check` passed.

## Prototype Color Match (2026-10-29)

- Confirmed root palette tokens already match `prototype.html`; the muted appearance came from workflow-specific gray status fills, very pale progress markers, and reduced-opacity disabled presentation control.
- Updated workflow status chips to use the prototype's green-soft open/closed state and neutral setup state, increased current/completed marker saturation, retained the prototype's solid green progress/action color, and matched its disabled-control opacity. Root application palette remains unchanged.
- Refreshed setup, open-intake, and closed-review desktop/mobile captures. No horizontal overflow observed. Validation: 83 frontend tests passed; build passed; lint had zero errors with existing TypeScript/parser notice and `main.tsx` warning; `git diff --check` passed.

## Sign-In Color Comparison Follow-up (2026-10-29)

- The side-by-side sign-in comparison showed muted gray eyebrows and a blue browser-autofill fill. Auth-only eyebrow labels now use the prototype green; login autofilled fields force the prototype's white surface and dark text.
- The screenshot harness blurs the password field before capture so a keyboard focus ring is not mistaken for a palette difference. The app's keyboard focus indicator remains unchanged.
- Refreshed `react-sign-in-1280.png` and `react-sign-in-390.png`. Full frontend tests: 83 passed; build passed; lint had zero errors with existing parser compatibility and `main.tsx` warnings; `git diff --check` passed.

## Page Background Comparison Follow-up (2026-10-29)

- Restored the exact prototype background layers: paper `#f5f6f1`, green wash `rgba(226, 238, 225, .55)`, and repeating rule `rgba(38, 82, 57, .035)`. Added `color-scheme: light` plus the prototype root font-size, line-height, and font-weight baseline.
- Refreshed sign-in captures `react-sign-in-1280.png` and `react-sign-in-390.png`. Browser reports no horizontal overflow. The screenshot flow's expected pre-create intake 404 and event-stream teardown abort remain unrelated.
- Validation: frontend tests 83 passed; build passed; lint had zero errors with existing parser compatibility and `main.tsx` warnings; `git diff --check` passed.
