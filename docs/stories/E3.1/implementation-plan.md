# E3.1 Implementation Plan: Prepare Round 1

**Status:** Product Owner approved 2026-11-03; implementation complete, QA and independent review in progress.

## Objective

After **Prepare round 1**, present a focused poll-setup view containing only the confirmed candidates that will be included in the poll, selection-count controls, and the existing start-voting action. Hide or collapse the consolidated-list review content while setup is active.

## Current implementation anchor

- `apps/web/src/features/nominations/NominationAdminPanel.tsx` owns `firstRoundPrepared`, the confirmed nomination list, round setup form, saved draft state, and start/cancel controls.
- The **Prepare round 1** handler sets prepared state, but the consolidated-list section remains rendered, so both lists/content appear together.
- The API already supports saving a draft round, loading its roster, guarded draft deletion, and starting through the expected-voter confirmation. Reuse these contracts; no API change is expected.
- `docs/prototype/prototype.html` provides the state transition reference: confirmed roster, then a focused Round setup task with candidate count control and **Start voting**.

## Implementation completed

1. Extracted shared round-poll setup presentation into `RoundPollSetup.tsx`; lifecycle state and API calls remain in `NominationAdminPanel.tsx`. Round 1 supplies its own heading and cancel action labels.
2. Hide the confirmed-list review while Round 1 setup is active and render the unchanged server-confirmed candidate order with candidate count.
3. Keep the start action visible and gate it on a valid, saved, current draft; preserve the expected-voter confirmation and cutoff warning.
4. Preserve draft reload, guarded cancel/rebuild, focus restoration, and selection input after save/start failures. Failed start errors are announced in the open confirmation dialog.
5. Add frontend coverage for setup visibility, retry after save and start failures, draft reload, cancellation, and existing start confirmation.
6. Add narrow-layout wrapping and focus handling; formal accessibility conformance remains outside scope while E7.1 is unresolved.

## Acceptance verification

- Focused E3.1 `App.test.tsx` run: 2 passed.
- Run the full frontend test suite and record known baseline failures separately.
- Run the full frontend test suite and record known baseline failures separately.
- Run `npm run lint` and `npm run build` in `apps/web`.
- Capture a new desktop and narrow viewport screenshot without overwriting existing approved prototype or review evidence.
- Run `git diff --check`.

## Risks and boundaries

- The setup candidate list must come from the server-confirmed snapshot/draft roster, not a second independently mutable client list.
- Preserve the stale-draft guard when nomination data changes; do not permit starting an outdated roster.
- Do not alter nomination publication, participant link routing, ballot behavior, expected voter count, cutoff policy, reveal policy, or persistence.
- Starting voting must continue through the existing expected-voter confirmation and server-authoritative lifecycle transition.
- Product Owner approval covers implementation scope only. The backlog's P1 priority remains proposed and unchanged.