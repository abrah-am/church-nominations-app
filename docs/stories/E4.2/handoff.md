# Handoff: E4.2 Active Voting Workspace

## Status

- Product Owner approved the refined implementation plan on 2026-11-04. Live admin aggregates are implemented through a separate authenticated endpoint; the admin can review totals during voting and immediately after close without a results reveal action.

- Implemented the focused active-voting admin workspace and active cancellation behavior for the local POC.
- Product Owner approved scope and implementation plan on 2026-11-03.
- Product Owner accepted E4.2 on 2026-11-04. PR [#29](https://github.com/abrah-am/church-nominations-app/pull/29) is open against `main`; mark the backlog item Completed after merge.
- Product Owner updated voting-result policy on 2026-11-04 (PD-019): admin live totals; Audience Presentation controls totals on both participant and presentation surfaces; close ends voting with no separate reveal action. This implementation completes the admin aggregate and close/decision path. Participant and presentation publication remain E6.8/E6.11 work and are not served from the admin endpoint.

## Delivered

- Active state uses the title **Voting is active** and a single card for profile/link submission count and lifecycle actions.
- Keeps the four-stage election process progress list visible during active voting, while hiding only the duplicate task-summary panel.
- Hides the confirmed nomination summary/list/change history and active `Round N` row/jump action while voting is active. Earlier closed rounds remain available as history.
- Keeps a hidden disclosure summary in the active-round wrapper so the browser does not render a stray default **Details** label.
- Adds a confirmed **Cancel active voting** action. It uses the reset API, clears ballots/current decisions and access token, preserves roster/reset audit, and returns to a fresh draft. Existing later-round reset guard remains in effect.
- Adds a separate authenticated aggregate endpoint for ACTIVE and CLOSED rounds. Aggregates use the currently stored ballot choices, so ballot replacement updates totals correctly.
- Active rows show vote count, rounded percentage of ballots cast, and an accessible bar capped visually at 100%; candidate percentages may exceed 100% in multi-selection rounds. Sort by votes descending and candidate name A–Z for ties.
- Closing makes final admin totals and candidate decisions available without reveal. The admin reveal action/dialog is removed. CLOSED state now gates final admin results, candidate decisions, and next-round roster validation; the legacy reveal endpoint remains available for compatibility.
- Aggregate polling keeps the latest snapshot on refresh failure and displays a visible “Live totals may be out of date” status until the next successful refresh.
- Viewer totals remain governed by the Audience Presentation control under PD-019, but viewer endpoint/cache implementation is not part of this work. Do not expose the admin aggregate endpoint to viewers.
- Keeps the active card visible when no saved nomination names remain.
- Displays reset API errors inside the cancellation confirmation dialog so a rejected cancellation is not a silent no-op.
- Updated ballot submission so expected count is informational only: reaching N-1 or N does not close the poll or block another profile. Only an explicit administrator close ends ballot access.
- Updated the post-close admin task to open the latest candidate-decision screen by default, show prototype-style **Elect / Advance / Remove** segmented actions, and save the complete decision set through one **Save decisions** action. Older rounds remain in history.
- Removed the duplicate latest-round history/configuration row so the latest closed decision screen appears once. Final aggregate totals are inline with the decision screen rather than inside a separate **Final results** disclosure. Task status prioritizes voting-round setup or candidate decisions over the confirmed-nomination message once a round exists.
- Extracted open intake, closed nomination review, active voting, aggregate results, and closed-round decisions into `apps/web/src/features/nominations/NominationWorkflowStages.tsx`; `NominationAdminPanel.tsx` retains API/state orchestration and passes stage data and actions into these views.
- The current stage is exclusive: active voting takes priority, then the newest draft, then pending latest-round decisions. After a complete decision save, the decision screen is hidden and the next-round setup uses only candidates marked **Advance**. Starting Round 2 hides Round 1 decisions, nomination review, and the confirmed consolidated list.
- Saved draft rounds expose **Start voting** regardless of round number; the first-round-only rebuild action remains limited to Round 1.

## Files Changed

- `apps/web/src/features/nominations/NominationAdminPanel.tsx`
- `apps/web/src/features/nominations/NominationWorkflowStages.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/App.test.tsx`
- `apps/web/src/api/rounds.ts`
- `apps/web/src/api/rounds.test.ts`
- `apps/api/src/main/java/org/churchnominations/api/election/voting/VotingRoundService.java`
- `apps/api/src/main/java/org/churchnominations/api/election/voting/VotingRoundAggregateResultsResponse.java`
- `apps/api/src/test/java/org/churchnominations/api/election/PostgresElectionIntegrationTest.java`
- `docs/stories/E4.2/requirements.md`
- `docs/stories/E4.2/implementation-plan.md`
- `docs/stories/E4.2/handoff.md`
- `docs/stories/E4.2/qa-report.md`
- `docs/product/backlog.md`
- `docs/product/product-decisions.md`

## Validation

- Focused live aggregate, integrated post-close decision, segmented-control, and rounds API client tests passed; the focused closed-round history test passed.
- `PostgresElectionIntegrationTest`: 13 tests passed with JDK 25, including live/closed aggregates, tenant authorization, ballot replacement, no auto-close at N-1 or expected count, extra profile ballot acceptance, admin close, decisions and next-round creation, and stale-result denial after reopen.
- `VotingRoundTest` passed with JDK 25.
- `npm run build` passed. `npm run lint` had no errors; one pre-existing non-null assertion warning remains in `apps/web/src/main.tsx`, with an existing TypeScript-eslint compatibility notice for TS 5.4.5.
- `git diff --check` passed.
- Focused integrated workflow test passed through nomination closure, Round 1 decision save, Round 2 draft setup, and Round 2 activation; it asserts that the Round 1 decision stage is inside the main card, then hidden with closed nomination review and the confirmed consolidated list after decisions are saved and while Round 2 is active.
- `npm run build` passed after the stage extraction. The extracted workflow stage and admin panel files report no editor diagnostics.
- Full frontend suite: 89 passed, 4 failed; remaining failures are known Annual Boards/session navigation tests outside E4.2. See [qa-report.md](qa-report.md).
- Independent code review completed; request changes. Findings: viewer result publication and enabled active-state control are incomplete under E6.8/E6.11; already-open presentation needs neutral invalidation when voting starts under E4.7/E6.8; polling-failure stale state is fixed, but its automated interval test remains unproven.

## Remaining Work / Risks

- Coordinate viewer publication and cache invalidation under E6.8/E6.11 and presentation clearing on poll start under E4.7; never route viewers through the admin aggregate endpoint.
- Resolve the independent review blockers or explicitly approve a scoped deferral before Product Owner acceptance.
- Active cancellation permanently deletes ballots/current decisions in the local POC, matching existing reset semantics. Production retention/deletion remains open under PD-007/E8.2.
- The active reset API guard rejects reset if any later-numbered round exists. The local API was restarted 2026-11-03 to load the updated active-reset implementation.
- The E4.2 P1 priority remains proposed; no priority change was made.
- Prototype-only follow-up on 2026-11-04: mock ballots are held in browser-local prototype state solely to validate the close/reveal experience. This does not change E4.2 acceptance, product rules, or the real application/API.