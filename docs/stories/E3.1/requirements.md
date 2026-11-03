# E3.1: Prepare Round 1 from the Confirmed Nominee List

- **Epic:** E3 Round Setup and Candidate Roster
- **Priority:** P1 (proposed)
- **Workflow status:** Implementation approved by Product Owner 2026-11-03; P1 priority remains proposed
- **User story:** As an election administrator, I want **Prepare round 1** to replace the consolidated-list view with the exact poll roster and selection-count controls, so I can verify who will be included and start voting confidently.

## Acceptance Criteria
- Before preparation, the confirmed consolidated list and **Prepare round 1** action remain visible as defined by E6.13.
- When the administrator selects **Prepare round 1**, hide or collapse the consolidated-list review content and present the first-round setup as the primary content; do not show both full lists at once.
- Show only the candidates included in the poll roster as a readable, read-only list, with a clear label that identifies it as the Round 1 poll roster and its candidate count.
- The Round 1 roster is the current server-confirmed consolidated list. Do not silently add, remove, reorder, or deduplicate candidates during this transition.
- Show the selection-count control alongside the poll roster. Accept an integer from one through the number of candidates in the roster; disable decrement/increment at the bounds and preserve valid user input on validation or save errors.
- Keep **Start voting** visible in the round setup state. It is enabled only when the roster and selection count are valid and the round setup has been successfully saved; starting retains the existing expected-voter-count confirmation and applicable cutoff warning before activating the poll.
- If saving setup or starting fails, keep the setup state, roster, and entered selection count visible; show an actionable error and allow retry without returning to the consolidated-list view.
- **Cancel and rebuild draft** remains available for an unstarted Round 1 draft and returns the administrator to the confirmed consolidated-list state. It must not delete an active or superseded round.
- The confirmed consolidated list is available again after cancellation; no nomination data is changed by entering or leaving round setup.
- The transition and controls work by keyboard and assistive technology, communicate loading/error/success states, and fit narrow viewports without horizontal scrolling.

## Scope and Dependencies
First-round administrator UI transition from the confirmed consolidated list into poll setup, including the read-only poll roster, selection-count control, visible **Start voting** action, existing save/start lifecycle, and cancel/rebuild path. Depends on E6.13 confirmed-list flow, US-010 round setup, and the existing start/expected-voter confirmation behavior. This story does not change ballot rules or API authorization.

## Relevant Decisions
- Round one uses the full server-confirmed consolidated snapshot; subsequent rounds use candidates marked Advanced.
- Selection count is configured independently for each round and must be between one and the round roster size.
- Poll configuration is locked during active voting. Candidate names are not editable in this setup view; corrections are made through the nomination consolidation workflow before the round is created.
- Expected voter count remains confirmed at poll start and fixed for the active round. Existing even-group two-candidate cutoff behavior is unchanged.

## Implementation Notes and Limitations
E6.13 implements the confirmed list, **Prepare round 1** action, selection-count stepper, saved draft, **Start voting**, and **Cancel and rebuild draft**. The current UI leaves the consolidated-list section visible above the setup form after preparation. This story closes that presentation gap by making the prepared poll roster the primary view, while preserving the existing server-backed draft and start lifecycle. Later-round setup remains outside this story.

## Explicitly Out of Scope
- Nomination intake, consolidation, confirmation, or presentation publication changes owned by E6.9/E6.13.
- New candidate selection, manual roster editing, deduplication, or ordering behavior.
- Changes to round APIs, persistence, ballot validation, expected-voter policy, cutoff rules, results, or voter-facing screens.
- Later-round roster preview and decision handoff owned by E3.2/E5.3.
- Changing the P1 proposed priority or granting implementation approval.
