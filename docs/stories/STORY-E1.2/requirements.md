# E1.2: Show Position Progress and Next Action

- **Epic:** E1 Election and Position Progress
- **Priority:** P1 (follow-up; proposed priority)
- **Workflow status:** Accepted by Product Owner 2026-10-21; PR #5 merged to `main` in `a23033e`
- **User story:** As an administrator, I want position navigation to show each position's progress so I can move through the election without opening every position to discover its state.

## Acceptance Criteria
- Each position shows its name, opening count, current state, and a concise next action or completed label.
- Previous/Next continues to respect configured sequence and disabled boundaries.
- Changing position does not silently reset any persisted position data.
- The selected position and its state are programmatically announced and keyboard operable.

## Scope and Dependencies
Position navigation progress/state/action. E1.3 contextual notices are separate. Depends on E1.1 lifecycle concepts and position workflow data.

## Relevant Approved Decisions
Handoff records Product Owner approval on 2026-10-21 for state/action vocabulary, precedence, completion rule, navigation, and save-before-switch. Complete takes precedence; otherwise newest actionable round precedes nomination/setup. Responses omit candidate names and ballot totals. Unsaved position drafts block switching/exiting until stay or explicit discard.

## Implementation Notes and Limitations
Handoff states accepted and PR #5 merged on 2026-10-21 (`a23033e`), with frontend/API tests and build evidence. It notes no signed-in live browser or screen-reader session and partial reliance on adjacent tests for persisted round-trip/keyboard behavior. Current checkout is the feature branch at its story commit and browser context includes PR #4; verify actual target-branch merge provenance before finalizing dashboard classification.