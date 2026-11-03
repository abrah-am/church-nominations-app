# E3.1 Handoff: Prepare Round 1

**Status:** Accepted by Product Owner 2026-11-03; PR pending commit/push authorization.
**Branch:** `story/e3.1-prepare-round-1`

## Delivered

- Extracted reusable poll setup presentation to `apps/web/src/features/nominations/RoundPollSetup.tsx`; the caller supplies the round number and cancel label. NominationAdminPanel retains lifecycle state, API calls, draft persistence, stale-roster guard, and start/cancel handlers.
- Round 1 setup hides the confirmed-list review and presents the exact ordered confirmed roster, count, selection control, save action, start action, and draft cancellation.
- Setup and roster now render as stacked full-width cards immediately after election progress. The selection-count control is a compact Bootstrap number input. A single primary **Start Voting** action saves changed settings before opening the existing expected-voter confirmation; the secondary action is **Cancel and rebuild draft**.
- The first-round configuration summary/description is hidden, and the setup is visibly contained in a full-width bordered card inside the workflow region.
- The closed-intake workflow card restores its bottom border and lower corners when setup replaces the consolidation panel, avoiding the previously open-looking lower edge.
- During primary Round 1 setup, the progress and setup sections share side borders and one continuous bottom edge so they read as one card.
- Start is gated on a valid saved current draft. Expected-voter confirmation and the even-group cutoff warning remain unchanged.
- Setup errors preserve values and offer retry. Start confirmation has keyboard focus containment and restores focus on cancel; success moves focus to the active status.
- Rebuild cancellation cannot delete a reset draft, preserving its reset history.
- Updated story approval status, implementation plan, UX approval note, and backlog status. P1 remains proposed.

## Verification

- Focused E3.1 and reset tests: 3 passed after the final card-containment update.
- Focused Round 1 border-state test: passed after the final lower-edge fix.
- Focused Round 1 workflow test: passed after joining the progress/setup card borders.
- Full frontend suite: 86 passed, 3 failed in unrelated Annual Boards/session navigation tests; see `qa-report.md`.
- Lint and production build passed. Lint retains one known warning in `apps/web/src/main.tsx` and a tooling compatibility notice.
- `git diff --check` passed.
- Code review findings resolved; final review has no outstanding code findings.
- 320px browser runtime and screen-reader testing were not performed; the shared app page was at sign-in and no authenticated setup state was available for visual validation.
- The fresh browser check confirmed the app sign-in route, so the authenticated prototype comparison was implemented from the provided screenshot and repository prototype source, then verified with focused UI tests and a production build.

## Changed Files

- `apps/web/src/features/nominations/RoundPollSetup.tsx` (new)
- `apps/web/src/features/nominations/NominationAdminPanel.tsx`
- `apps/web/src/App.test.tsx`
- `apps/web/src/styles.css`
- `docs/product/backlog.md`
- `docs/stories/E3.1/requirements.md`
- `docs/stories/E3.1/implementation-plan.md`
- `docs/stories/E3.1/ux-design.md`
- `docs/stories/E3.1/qa-report.md`

## Remaining

- After commit/push authorization, publish the branch and create the PR.
- Optional follow-up: perform authenticated browser validation at 320 CSS px and screen-reader smoke testing.
- Do not merge or deploy before explicit authorization.
