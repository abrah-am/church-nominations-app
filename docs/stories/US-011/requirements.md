# US-011: Cast or Replace a Private Ballot

- **Epic:** P0 Ballot Operations
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As an eligible voter, I can submit one valid ballot from my phone without exposing my choices to other users.

## Acceptance Criteria
- Only a guest possessing a valid non-expiring voting link can access an active poll; the route returns 404 when no poll is active. Voter sign-in is not required.
- A ballot cannot select the same candidate more than once and obeys the configured selection-count rule.
- The system suggests a strict majority when a candidate is selected by more than half of ballots cast (for example, 9 of 17); for a single opening, the administrator/committee decides whether a candidate stays, advances, or is elected.
- For multiple openings, candidates who reach strict majority in a poll are elected automatically, up to the configured seat count. If more candidates qualify than openings remain, eliminate the other candidates and run one-choice rounds among the majority-qualified candidates. If nobody has a majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh totals until the remaining openings are filled.
- In a two-candidate, one-selection round with an even-sized group `N`, the round automatically closes after `N - 1` ballots have been submitted; for 14 voters, close after 13. For 17 voters, all 17 may vote.
- The expected voter count is confirmed at poll start and remains fixed. A meeting arrival may vote while the poll remains active; an attendee who must leave votes before leaving. If the automatic cutoff has closed the poll, an authorized administrator reopens it before a late arrival can vote.
- An administrator may close other rounds; totals remain hidden until result reveal.
- Tie-break rounds use a fresh tally starting at zero. If tied candidates are resolved, a subsequent round against a prior leader also starts at zero.
- An opaque browser-profile token cannot create a second ballot for the same poll, but may edit/replace its choice while active. This cannot guarantee a one-ballot-per-person or physical-device limit if browser data is cleared or another profile/device is used; token storage and recovery must be designed.
- The ballot-choice record has no voter identity reference; a separate participation record lets the administrator see completion status.
- API responses and UI do not show live candidate totals while the round is open.
- Errors and logs do not include ballot choices or credentials.

## Scope and Dependencies
Guest ballot submission and replacement, confidentiality from church users, operational cutoff, and tally rules. Depends on US-010 and active scoped voting link. Production device identity and recovery remain open (PD-004).

## Relevant Decisions
Guest links do not expire but resolve only for an active poll. Voters do not sign in. Confidentiality is from church users, not system operators or metadata correlation. Expected count is fixed at poll start; the approved even-group cutoff is `N - 1`.

## Implementation Notes and Limitations
Local POC ballot submission/replacement, exact selection enforcement, active-poll link, cutoff, close/reopen and reveal are reported implemented. Browser-profile control is not person/device identity; clearing storage or using another profile/device can bypass it. E4.3/E4.4 cover UX and production policy.
