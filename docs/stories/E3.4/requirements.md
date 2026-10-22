# E3.4: Make Candidate Rosters Easy to Review

- **Epic:** E3 Round Setup and Candidate Roster
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want the round candidate roster displayed as a readable list so I can verify the names before voting.

## Acceptance Criteria
- Show each candidate as a distinct row/item rather than a cramped single-line sequence.
- Preserve the configured roster order and associate any candidate-specific status/count with the correct name.
- Long names wrap without clipping, overlap, or horizontal scrolling at supported narrow widths.
- The roster remains readable with keyboard navigation and assistive technology; do not add ballot-selection behavior to the admin preview.
- Tests cover empty, single-candidate, multi-candidate, and long-name displays.

## Scope and Dependencies
Admin read-only candidate roster presentation. Depends on round roster data. Responsive/a11y test requirements relate to E7.1-E7.3.
