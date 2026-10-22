# E1.3: Remove Contradictory Election Setup Notice

- **Epic:** E1 Election and Position Progress
- **Priority:** P1 (proposed)
- **Workflow status:** Closed; delivered by E1.1/E1.2, no separate implementation required
- **User story:** As an administrator, I want contextual guidance for the selected position so the page does not say voting is unavailable when a round is active or results are ready.

## Acceptance Criteria
- Replace the generic persistent notice with state-specific guidance.
- Guidance matches available actions for setup, open intake, consolidation, draft, active, closed-unrevealed, revealed, and complete states.
- No notice contradicts the actual API-enforced state.

## Scope and Dependencies
State-specific contextual guidance. The generic notice removal and lifecycle status were delivered under E1.1; selected-position progress and next-action guidance were delivered under E1.2. This story is closed as duplicate/covered scope and does not require a separate code change. Depends on E1.1 status and E1.2 position state/action model.

## Closure Evidence
- The generic “Voting is not available yet” notice is absent from election list/detail views; `App.test.tsx` asserts it is not rendered.
- The selected-position summary provides state-specific next-action guidance. Frontend tests cover setup, nominations open/closed, consolidated, draft, active, closed-unrevealed, results revealed, candidates advanced, and complete states.
- The API derives and returns progress status and next action for those lifecycle states; `ElectionControllerTest` covers the progress mappings and tenant scoping.
- Validation run on 2026-10-22: `npm test -- --run src/App.test.tsx` passed (52 tests); the focused `ElectionControllerTest` Gradle run passed with `--rerun-tasks`.
- The E1.2 implementation commit `27ea016` is present on `origin/main`. No standalone E1.3 feature change was made.

## Known Separate Follow-up
The frontend intentionally displays “Progress unavailable” / “Action unavailable” if progress fields are missing. `DEFECT-001` tracks checking API version/response and is separate from E1.3 state-specific guidance; it does not keep this story open.
