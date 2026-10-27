# E9.1 Handoff

## Current State

- Product Owner approved the Bootstrap 5 CSS approach and incremental UI modernization direction on 2026-10-26.
- The UX Designer completed delegated, read-only discovery for coordinated administrator, voter, and presentation experiences. `three-experience-proposal.md` documents three journeys, state-by-state lifecycle/visibility matrix, operational vs presentation display-state recommendation, wireframes, navigation, Bootstrap 5 standards, story ownership/dependencies, regression/accessibility/privacy strategy, and PO approval questions.
- Product Owner clarification: the three experiences run in separate browser instances/windows, not as tabs inside one interface. The prototype launcher opens role-specific Admin, Voter, and Presentation windows; localStorage/storage events share mock state only for demonstration and do not represent production authorization or the required API contract. Serve the prototype over HTTP on one origin; `file://` windows have opaque origins and cannot share this mock state.
- Product Owner requested a phone-friendly Voter page. Its role window now uses the full viewport without the desktop handset frame, hides repeated desktop disclaimer/context blocks, stacks full-width name inputs, and keeps the submit action in a safe-area-aware bottom tray. Admin and Presentation layouts are unchanged.
- Product Owner requested the admin path: mock sign-in → church dashboard → election period → departments and positions with current state. The prototype now shows Grace Community Church, 2026 Elections, configurable-style department groups, position opening counts, and `Not started`/`In progress`/`Filled` summaries. These are sample UI data mapped to existing US-005/US-007 and E1.1/E1.2 concepts; there is no real login, persistence, or CRUD.
- Updated entry order per Product Owner: root/admin entry presents mock login first; successful sign-in reveals the three-role chooser; Admin opens the church/election dashboard in the same window, while Voter and Presenter remain separate role windows.
- Implemented the UX Designer's access-navigation recommendation: the selected election-period overview contains the canonical participant session-link copy action and separate read-only presentation open/show-hide controls; the current position workflow includes contextual Copy link and Presentation shortcuts. The participant link is described as a bearer session capability; presentation controls remain admin-only. No QR control was added (E6.12 remains future scope).
- The mobile voter action is labeled `Submit my nomination list` before submission and `Update my nomination list` after submission. It is intentionally unavailable while intake is not open; the latter label reflects an existing submission, not a missing control.
- `prototype.html` is a static, dependency-free mock whose first step is nomination intake. The voter sees prefilled representative names as an unsent draft, can submit or revise their own list, and receives a confirmation. Actual voter form submission populates the admin working list; no simulator button is used. The compact admin-broadcast list is a separate read-only section. The admin can edit/remove working-list entries, explicitly broadcast a snapshot, and rebroadcast later edits. The mock then demonstrates intake close/consolidation, final list reveal, guest ballot submission, close with neutral viewer state, explicit aggregate release, admin-only candidate decisions, a second round, and position completion.
- Product Owner direction added 2026-10-27: preserve the voter nomination form while open, alongside a compact read-only view of the admin-broadcast list. On intake close, the prototype switches voters to a read-only aggregated list plus confirmed refinement changes; admin edits/removals update the voter and presentation views live, with no audience mutation controls. This post-close audience/change-log behavior conflicts with current E6.9/E6.10 reveal-gated rules and needs explicit PO policy approval before production/API work.
- The completed-position elected-name presentation requested by the Product Owner conflicts with current E6.8/E6.10 policy, which excludes candidate decisions/history from viewer surfaces and limits released snapshots to candidate names plus aggregate totals. The prototype flags that screen as proposed and approval-required; no policy has been changed.
- Admin decision controls now show prior-round vote totals; the redundant “Advance” wording is removed. Higher rounds confirm the top-ranked elected candidate, then present admin-recorded accept/decline actions. Decline offers direct invitation of the next-highest prior-round candidate or a fresh poll roster from eligible candidates in that prior round.
- The candidate response/replacement flow is prototype-only. E6.6/E6.7 are still Product Owner clarification-needed for ranking/ties, eligibility/committee authority, response correction/audit, and completion semantics; no production rules or APIs changed.
- The proposal treats operational election state and presentation display state as separate concepts derived from existing policy/controls. It adds no backend state or API contract and requires a stop-and-approve gate if implementation discovers the current contract cannot support the behavior.
- No application functionality, dependencies, APIs, or database were changed. Existing modifications to `docs/product/backlog.md` and E9.1 files were preserved. Discovery began on branch `main`; do not assume or switch to another branch without checking the current Git state.

## Files Added or Updated

- Added `docs/stories/E9.1/three-experience-proposal.md`.
- Added `docs/stories/E9.1/prototype.html`.
- Updated `docs/stories/E9.1/handoff.md`.
- Pre-existing E9.1 `requirements.md`, `ux-design.md`, and `implementation-plan.md` remain the shared Bootstrap/foundation documents; no changes were required for this refinement.
- Pre-existing modified `docs/product/backlog.md` was not edited in this task.

## Decisions and Constraints

- Preserve the existing Bootstrap 5 CSS foundation proposal with current React-controlled components; no React-Bootstrap.
- Keep admin, voter session link, and read-only presentation as distinct capabilities, not three authenticated roles. The presentation is opened/controlled by authenticated admin action; participant link remains a phase-resolving bearer capability.
- Keep one focused current admin task with persistent election/position context and compact progress; older stages and rounds remain accessible as secondary navigation/history.
- Preserve all routes, APIs, election behavior, authorization, privacy, and story ownership. No new backend state/API is proposed.
- During open intake, voter-submitted names, admin working list, and last-broadcast snapshot are separate mock state. After intake closes, the voter view switches to the aggregate refinement list and confirmed-change log; each admin correction/removal updates both audience surfaces live. No submitter/device identity or profile counts are shown. Presentation hide/show does not affect the participant link's permitted content.
- During post-close refinement, typing an admin correction is a private draft. Explicit Save commits the correction, appends one before/after mock change event, and updates both audience lists. Removal remains an explicit action with one event.
- E7.1/PD-009 remain open: conformance target, browser/device/viewport matrix, and test approach. WCAG 2.2 AA is not approved by implication.
- Final elected-name publication to presentation needs explicit Product Owner policy approval and reconciliation with E6.8/E6.10 before implementation.
- Do not install dependencies, implement, merge, or deploy without explicit authorization. Coordinate any future work with current E6.9 changes and verify branch/worktree before editing.

## Checks

- `git diff --check` passed after proposal and prototype edits.
- Browser automation with Node 20 loaded the prototype (`HTTP 200`), found the expected accessible tab/panel structure, and reported zero console errors and failed requests.
- A browser-driven mock flow passed ballot submission confirmation, neutral presentation after close, explicit results release to the voter and presentation, candidate decisions, second round, and completion with the policy warning.
- The updated browser-driven end-to-end mock flow passed initial nomination intake, submission, pre-reveal privacy, admin review/consolidation, explicit nomination reveal, ballot, neutral close, explicit results release, second round, and completion.
- Browser assertions for the 2026-10-27 direction passed: blank voter nomination fields, submit/revise confirmation, separation from broadcast names, admin edit/remove and explicit rebroadcast, read-only compact list, post-close reveal, voting, results release, and two-round completion.
- Verified voter nomination submission now populates the admin working list directly; simulator button/listener removed.
- Post-close refinement browser checks should confirm the form is gone, voter list/log are read-only, and admin correction/removal updates both audience surfaces live.
- Verified save-once behavior: multiple keystrokes created zero events; Save created one correction event and updated voter/presentation lists; Remove created one removal event. Browser reported zero console errors or failed requests.
- Browser verification passed for vote totals/no “Advance” label, elected-candidate response, direct runner-up invitation and acceptance, plus decline → eligible replacement roster → fresh round/tally. No console errors or failed requests.
- Separate-window browser verification passed on local HTTP: Admin opened intake and the independent Voter window updated to “Nomination intake open,” with only its own panel visible. Admin, Voter, Presentation URLs each render role-isolated surfaces; no in-page tablist remains.
- Mobile browser verification passed at 390×844 and 320×740: no horizontal overflow; form inputs are full-width and 42px high; submit button stays visible; last input clears the fixed action tray; submission confirmation appears.
- Clean-state browser check passed: after admin opens intake, voter sees the form and visible `Submit my nomination list`; after submit, it changes to `Update my nomination list` and shows confirmation.
- Admin browser path passed at 390px: mock sign-in → Grace Community Church → 2026 Elections → 4 department groups / 8 position rows with all three requested statuses → Director workflow → back to period. No horizontal overflow; redundant prototype notice/context hidden in the Admin view.
- Verified revised entry path with native form submission: login → role chooser (Admin, Voter link, Presenter) → Admin dashboard → 2026 Elections.
- Browser verification passed for election-level link/status controls and position-level shortcuts; presentation hide updates election status, role windows remain separate, and no QR action is present.
- A focused browser check passed independent presentation hide/show behavior while keeping the voter ballot active.
- No frontend test/build was run because application code was not changed. The prototype is not production or authorization validation.

## Next Action

Present `three-experience-proposal.md` and `prototype.html` for Product Owner review. Resolve the elected-candidate presentation conflict and approve the post-close read-only refinement/change-log audience against E6.9/E6.10. Define edit/removal confirmation and audit policy. Record E7.1/PD-009 target/matrix/test decisions or explicitly bound the first slice. Then refine/approve the E9.1 implementation plan separately; no implementation or dependency installation before that approval.
