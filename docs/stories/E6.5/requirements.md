# E6.5: Decide and Design a Results-Only View for Poll Participants

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (decision blocker)
- **Workflow status:** Blocked by E6.4
- **User story:** As an administrator sharing the election on screen, I want to show revealed aggregate results either in a separate results-only window or on participants' devices after voting ends, without exposing them during an active poll.

## Acceptance Criteria
- Decide whether results are admin-only, available to anyone with the voting link after reveal, available only through another credential, or another explicit audience. Do not assume possession of a shared bearer link authorizes results.
- Decide whether reveal alone makes results available, an admin must explicitly publish, and whether access is temporary or retained.
- Define fields and ensure only approved aggregate data appears, never voter identities, participation-to-choice mappings, or ballot choices by voter.
- Preserve no-results-while-active; reopening makes prior results unavailable as current results.
- Specify separate-screen behavior and whether participant link transitions from ballot to results after closure/reveal.
- Define server-side authorization, tenant/link scope, forwarding behavior, audit events, and tests. Changing current 404 behavior when no poll is active requires explicit approval.

## Scope and Dependencies
Discovery/design. Depends on E6.4 audience decision, E8.2 privacy/retention, and existing active-link contract.

## Earlier Baseline (Superseded in Part by E6.10)
No aggregate results while active. The former poll-scoped voter link returned 404 when no poll was active. E6.10 replaces that for the session participant link with a generic unavailable/inactive response and decides current-session aggregate publication after explicit reveal. Historical report audiences and publication remain unresolved.

## E6.10 Policy Update (2026-10-23)
- For the current session only, the participant link may show candidate names and aggregate vote totals after explicit admin reveal. It uses a generic unavailable/inactive response while closed-unrevealed or reopened; a later close requires a new reveal.
- The separate committee presentation view is opened by an authenticated admin action, has independent show/hide/end controls, and shows the same approved aggregate snapshot. It does not expose admin recommendations/decisions, participation, ballot details, or history.
- Historical report audiences, retention, exports, and access duration remain unresolved under E6.4/E8.2 and PD-006/PD-012.
