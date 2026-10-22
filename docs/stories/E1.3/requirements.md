# E1.3: Remove Contradictory Election Setup Notice

- **Epic:** E1 Election and Position Progress
- **Priority:** P1 (proposed)
- **Workflow status:** Needs scope reconciliation; possible duplicate/partial completion
- **User story:** As an administrator, I want contextual guidance for the selected position so the page does not say voting is unavailable when a round is active or results are ready.

## Acceptance Criteria
- Replace the generic persistent notice with state-specific guidance.
- Guidance matches available actions for setup, open intake, consolidation, draft, active, closed-unrevealed, revealed, and complete states.
- No notice contradicts the actual API-enforced state.

## Scope and Dependencies
State-specific contextual guidance. The generic notice removal appears in E1.1's handoff as implemented; reconcile whether remaining state-specific guidance is the complete intended scope before work. Depends on E1.1 status and E1.2 position state/action model.

## Implementation Notes and Limitations
Backlog identifies E1.3 separately from E1.2, but E1.1 handoff says the generic notice was already removed. Do not duplicate that completed change or imply E1.3 is fully complete without checking its remaining criteria.
