# US-008: Collect Position Nominations

- **Epic:** P0 Nomination Workflow
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As a committee member, I can submit proposed names for a position using a link or QR code shared by the administrator.

## Acceptance Criteria
- The shared link/QR code is scoped to one position's nomination intake and can be opened without sign-in.
- The committee agrees the maximum names per submitter; the administrator configures that limit for the intake. There is no application-wide fixed count.
- Nominations are collected separately from voting ballots and are not included in ballot anonymity guarantees.
- Each browser profile can replace its own submitted list while intake is open; public reads return only that profile's list.
- The admin sees proposed names without submitter/device identity. Closing the intake disables public read/edit access.

## Scope and Dependencies
Anonymous, position-scoped intake and browser-profile editing. Depends on configured election positions. Does not establish a real-world submitter identity or guarantee one submission per person.

## Relevant Decisions
No third application role; anyone holding the shared link may submit. Admin closes intake; no committee-consensus step is required.

## Implementation Notes and Limitations
Backlog reports shared bearer links, configured per-intake limits, profile-local edits, closure, live updates, and API/PostgreSQL/frontend coverage. A browser-profile token cannot prove one real-world submission per person. Retention and correction/audit policy remain open (PD-005).
