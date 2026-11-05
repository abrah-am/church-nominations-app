# E4.2 Implementation Plan: Active Voting Workspace

**Status:** Product Owner approved 2026-11-04; implementation authorized, not yet started.

**Product Owner update (2026-11-04):** PD-019 supersedes this plan's original explicit-reveal behavior. Admin live totals and Audience Presentation-controlled viewer totals replace the separate reveal action. This accepted story/PR must be reconciled before merge; candidate decisions are scoped in US-012/E5.2/E5.3.

## Objective

After **Start voting** succeeds, show one focused active-voting card with profile/link submission progress, live aggregate candidate totals, and clear **Cancel active voting** and **Close voting** actions. Remove nomination review and round disclosure clutter from this active state while preserving ballot confidentiality. The authenticated admin result path is distinct from participant and presentation viewer paths. Viewer totals remain governed by the Audience Presentation control and the approved E6.8/E6.10/E6.11 contract; this implementation must not expose the admin endpoint to viewers.

## Implementation Anchors

- `apps/web/src/features/nominations/NominationAdminPanel.tsx` owns the confirmed nomination list, voting-round configuration, active round disclosure, progress polling, close/reveal/reopen/reset actions, and presentation visibility state.
- `apps/web/src/App.test.tsx` contains the cross-feature start-voting test that currently opens the active-round disclosure before it can assert progress.
- `docs/prototype/prototype.html` shows the intended active card: **Voting is active**, received of expected profile/link submissions, explanatory privacy text, and **Close voting**.
- `apps/web/src/api/rounds.ts` defines authenticated progress/results operations and their response types.
- `apps/api/src/main/java/org/churchnominations/api/election/voting/VotingRoundController.java` and `VotingRoundService.java` own tenant-authorized lifecycle and aggregate results. Results currently require a closed, explicitly revealed round; candidate decisions also require reveal. Both guards conflict with PD-019 and must be reconciled so admins can read totals while active and record decisions after close without a separate reveal transition.
- `apps/api/src/test/java/org/churchnominations/api/election/PostgresElectionIntegrationTest.java` covers result authorization, reveal state, and aggregate fields. `apps/web/src/App.test.tsx` covers active progress and the current reveal flow; `apps/web/src/api/rounds.test.ts` covers typed API paths.
- The round aggregate query counts stored ballots and current ballot-choice rows. Preserve this source-of-truth calculation so replacing a profile's ballot updates results without double-counting.

## Planned Work

1. Make active round status a first-class branch in the position workspace. Hide the consolidated list and confirmed-change history while a round is active; restore appropriate review/history when the active state ends.
2. Replace the active-state **Voting round configuration** summary/title, active-round jump button, and `Round N` disclosure row with a single active card titled **Voting is active**.
3. Keep `{received} of {expected} profile/link submissions` separate from ballots cast and retain the qualification that profiles/links are not verified people.
4. Add an authenticated admin aggregate-results read usable during active voting and after close. Calculate from current stored ballots/choices; return only candidate aggregates, counts, expected count, and approved thresholds. Do not return ballot/device identifiers, participation status, or voter-linked data.
5. Render candidate vote count, rounded percentage of ballots cast, and proportional indicator in the active card. Use ballots cast as denominator (not expected submissions or total selections); percentages may sum beyond 100% in multi-selection rounds. Sort by votes descending, then candidate name A–Z. Show a zero state before ballots are cast.
6. Refresh aggregates with active progress using the existing polling lifecycle; prevent overlapping requests and stale state after navigation. A failed refresh retains the last known data and surfaces an actionable status/error without claiming freshness.
7. Keep **Close voting** distinct from **Cancel active voting**. Closing stops ballot access and makes final admin totals available without a reveal action. Remove the dependency on `revealedAt` for admin result reads and post-close candidate decisions, while retaining the legacy reveal endpoint only if required for compatibility; do not add a viewer/public route to the admin result endpoint.
8. Add **Cancel active voting** with an accessible confirmation naming the round and warning that ballots and current decisions will be permanently deleted in this local POC. On confirmation, use a server-authoritative lifecycle transition to stop ballot access, reset the active attempt, and return the UI to fresh setup with zero progress/results. Preserve the reset audit event.
9. Expected submission count is informational only: do not automatically close after an even-group cutoff or when ballots reach/exceed the expected count. Remove any server-side ballot cap based on expected count. Only the authenticated administrator's **Close voting** action ends ballot access.
10. After close, make the latest round's candidate decisions the primary visible task. Display all candidates with their vote totals and **Elect**, **Advance**, and **Remove** segmented actions; require a complete valid set and persist it using one **Save decisions** action. Keep older rounds in collapsed history and preserve reopen/reset controls.
11. Preserve existing reopen and closed-round reset behavior as separate actions. On reopen, clear stale results as current viewer content; failed transitions retain accurate state and provide an actionable error.
12. Add focused frontend/API tests for active layout, count privacy, aggregate privacy and tenant authorization, multi-selection percentages, ballot replacement, continued ballot access at and above expected count, manual close, prototype-style decision groups/save, decision validity, cancel-confirm/cancel-dismiss, polling recovery, transition failures, and reopen/reset behavior.

## Acceptance Verification

- Run focused `PostgresElectionIntegrationTest` coverage for active/closed admin aggregates, tenant authorization, replacement ballots, no automatic close at expected/cutoff counts, and manual close/decision lifecycle.
- Run focused `rounds.test.ts` and `App.test.tsx` cases for active results, percentage display, polling, manual close, close-without-reveal, segmented decisions and one save action, cancellation, and lifecycle recovery.
- Run `npm test`, `npm run lint`, and `npm run build` in `apps/web`.
- Run the relevant Gradle tests using the repository's configured JDK 25.
- Verify desktop and mobile active-round layout in the running app; capture evidence without overwriting existing approved screenshots.
- Run `git diff --check`.

## Risks and Boundaries

- Voting-result viewer publication remains a separate E6.8/E6.11 dependency. Do not route ballot results through the nomination presentation endpoint or expose the authenticated admin aggregate endpoint to viewers. Coordinate against the E6.10 API contract; do not expand this E4.2 implementation into a new viewer capability/API without Product Owner approval.
- Result displays must not expose participation status, voter identity, individual ballots, or voter-to-choice mappings. Active progress is profile/link submissions, not verified people.
- Active cancellation is not the same as ordinary close or reopen. It uses POC reset semantics, permanently deleting ballots and current decisions while preserving the reset audit event; production retention remains open.
- Expected count is informational only and never limits submissions or closes an active poll. Preserve ballot validation/replacement and tenant authorization; do not broaden changes beyond these lifecycle requirements.
- Original active-workspace scope was approved by the Product Owner on 2026-11-03. Live-result acceptance details and this reconciled implementation plan were approved on 2026-11-04.