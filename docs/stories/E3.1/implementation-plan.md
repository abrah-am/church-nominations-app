# E3.1 Implementation Plan: Prepare Round 1

**Status:** Proposed; Product Owner approval required before implementation.

## Objective

After **Prepare round 1**, present a focused poll-setup view containing only the confirmed candidates that will be included in the poll, selection-count controls, and the existing start-voting action. Hide or collapse the consolidated-list review content while setup is active.

## Current implementation anchor

- `apps/web/src/features/nominations/NominationAdminPanel.tsx` owns `firstRoundPrepared`, the confirmed nomination list, round setup form, saved draft state, and start/cancel controls.
- The **Prepare round 1** handler sets prepared state, but the consolidated-list section remains rendered, so both lists/content appear together.
- The API already supports saving a draft round, loading its roster, guarded draft deletion, and starting through the expected-voter confirmation. Reuse these contracts; no API change is expected.
- `docs/prototype/prototype.html` provides the state transition reference: confirmed roster, then a focused Round setup task with candidate count control and **Start voting**.

## Proposed steps

1. Add a focused frontend test for the pre-prepare state, asserting the confirmed consolidated list is visible and the round setup roster is not.
2. Add a transition test for **Prepare round 1**, asserting the consolidated-list review content is hidden/collapsed and the exact poll roster, selection-count control, and start/cancel actions are visible.
3. Implement the smallest state-driven rendering change in `NominationAdminPanel.tsx`; retain existing candidate source, default selection count, draft persistence, stale-roster guard, and cancellation semantics.
4. Verify saved-draft reload and returning to the view preserve the focused setup state when a first-round draft exists; do not make a draft appear as nomination setup.
5. Add or adjust error-state coverage to verify roster and entered selection count remain visible on save/start failure.
6. Validate keyboard/focus behavior and narrow viewport layout against the approved accessibility target/device matrix when available. Do not claim formal conformance while E7.1 is unresolved.

## Acceptance verification

- Run focused `App.test.tsx` cases for first-round preparation, draft save/start, cancel/rebuild, and failure recovery.
- Run the full frontend test suite and record known baseline failures separately.
- Run `npm run lint` and `npm run build` in `apps/web`.
- Capture a new desktop and narrow viewport screenshot without overwriting existing approved prototype or review evidence.
- Run `git diff --check`.

## Risks and boundaries

- The setup candidate list must come from the server-confirmed snapshot/draft roster, not a second independently mutable client list.
- Preserve the stale-draft guard when nomination data changes; do not permit starting an outdated roster.
- Do not alter nomination publication, participant link routing, ballot behavior, expected voter count, cutoff policy, reveal policy, or persistence.
- Starting voting must continue through the existing expected-voter confirmation and server-authoritative lifecycle transition.
- This plan is not implementation approval. The backlog's P1 priority remains proposed pending Product Owner approval.