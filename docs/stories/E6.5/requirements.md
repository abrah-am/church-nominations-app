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

## Relevant Approved Decisions
No aggregate results while active; current voter link returns 404 when no poll is active. Results-only audience and publication behavior are unresolved.
