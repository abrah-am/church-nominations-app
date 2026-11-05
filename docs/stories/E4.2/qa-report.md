# QA Report: E4.2 Live Results and Voting Status

**Date:** 2026-11-04
**Status:** Partial pass; viewer publication dependencies remain before acceptance.

## Acceptance Results

| Area | Expected | Result | Status |
| --- | --- | --- | --- |
| Active admin aggregates | Authorized admin sees current candidate totals during voting; only aggregate data is returned | PostgreSQL integration test verifies active zero/live aggregates, tenant denial, and absence of ballot/device/participation data | Pass |
| Ballot replacement | Latest accepted profile ballot determines current counts | Integration test replaces a ballot and verifies old candidate count decrements and new candidate count increments without increasing ballot count | Pass |
| Tally display | Candidate count, rounded percentage of ballots cast, visual indicator, tie ordering, zero state | Focused App workflow test verifies zero display, 150% multi-selection percentage, capped indicators, alphabetical tie ordering, live refresh, and no identity data | Pass |
| Manual-only closure | Reaching N-1 or expected submissions does not close the poll or block another profile; only admin close ends ballot access | PostgreSQL integration tests verify even and odd expected-count polls remain ACTIVE at and beyond expected count, accept additional profile ballots, and close with reason ADMIN only after explicit close | Pass |
| Close without reveal | Closing ends ballot access and makes final admin results and candidate actions available without a reveal request | Backend integration tests verify closed results and decisions without reveal; focused App workflow verifies close and decision screen without a reveal request | Pass |
| Post-close decision screen | Latest closed round is the primary visible workflow with per-candidate Elect/Advance/Remove segmented actions and one Save decisions command | Integrated App test verifies both candidates can be marked Advanced and saved as a set; next-round roster contains both | Pass |
| Workflow status and results layout | During round setup, show the current voting-round task rather than the completed nomination-confirmation message; after close, keep final aggregate counts inline with candidate decisions and do not render a separate Final results disclosure | Integrated App test passes with the primary candidate-decision section; focused component diagnostics pass | Pass |
| Reopen and stale results | Reopened active poll must not return closed results as current | PostgreSQL integration coverage verifies closed-results request is unavailable after reopen | Pass |
| Round history UI | Active round does not expose duplicate active row; closed rounds retain lifecycle actions | Focused App workflow test passes | Pass |
| Integrated nomination-to-decision flow | Existing workflow proceeds through close, decisions, and next-round setup under the prototype-style round decision set | `keeps nominations hidden until reveal, then saves one shared list` passes through next-round roster creation; separate reopen/history coverage remains in focused tests | Pass |
| Full frontend regression | No unrelated regressions | 89 passed, 4 failed; remaining failures are three Annual Boards/session navigation tests and one associated annual-board workflow assertion | Fail |
| Frontend build | TypeScript check and Vite production build succeed | `npm run build` is currently blocked by four unused-symbol errors in `src/App.tsx` (`AudiencePresentationCard`, `ParticipantSessionLinkCard`, `demoPresentationVisible`, and `setDemoPresentationVisible`); nomination panel has no diagnostics | Blocked by unrelated App.tsx errors |
| Frontend lint | No new lint errors | `npm run lint` has zero errors and one pre-existing non-null assertion warning in `src/main.tsx`; TypeScript-eslint reports unsupported TS 5.4.5 compatibility | Pass with existing warning |
| Backend integration | PostgreSQL lifecycle/security suite passes | `PostgresElectionIntegrationTest`: 13 tests pass with JDK 25, including updated manual-close expectations | Pass |
| Backend unit | Voting round unit tests pass | `VotingRoundTest` passes with JDK 25 | Pass |
| Patch formatting | No whitespace errors | `git diff --check` passes | Pass |

## Independent Review Findings

- **Blocker:** Audience totals are not currently published to participant or presentation surfaces during active voting, and the active-state UI disables presentation controls. Viewer publication must be completed under E6.8/E6.11; do not expose the admin aggregate endpoint to viewers.
- **Blocker:** An already-open presentation may keep displaying nomination content when a poll starts. Poll-start transition must invalidate and publish a neutral viewer snapshot under E4.7/E6.8 before audience presentation behavior is accepted.
- **Fixed after review:** Aggregate polling failures now keep last-known values but display a notice that live totals may be out of date until a successful refresh. The focused interval fixture did not reliably exercise this failure branch, so it remains a manual/code-reviewed behavior rather than a passing automated assertion.
- **Residual:** Decision undo is no longer part of the prototype-style decision screen; any undo policy belongs to E5.4. The full frontend suite retains three Annual Boards/session failures outside E4.2.

## Remaining Issues

- Three Annual Boards/session navigation failures remain from prior frontend suite runs and are outside E4.2.
- Viewer publication remains outside this implementation and requires E6.8/E6.11. The authenticated admin aggregate endpoint must not be used by participant or presentation capabilities.
- Independent code review is pending.
