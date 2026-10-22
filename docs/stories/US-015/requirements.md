# US-015: Private Voting Rounds POC

- **Epic:** P0 Ballot Operations (legacy umbrella work item)
- **Priority:** P0
- **Workflow status:** Work in progress in the original handoff; local POC functionality implemented, but formal acceptance/merge is not recorded
- **User story:** As an eligible guest voter, I can submit or replace a private ballot in an administrator-configured round, while an administrator can operate round lifecycle and reveal aggregate results without exposing voter-to-choice mappings.

## Acceptance Criteria
- Voters use scoped links without accounts; ballots require exactly the configured number of distinct choices.
- A browser-profile credential cannot create a second ballot for the same poll but may replace its choice while the poll is active; this is not a real-person or physical-device guarantee.
- Ballot-choice records do not contain voter identity; participation status is stored separately and does not expose choices.
- Active-round totals remain hidden; authorized admins may close/reopen as allowed and reveal aggregate results after closure.
- Candidate decisions, round lifecycle transitions, cutoff behavior, and audit events are recorded without ballot choices or credentials.
- Tenant-scoped APIs reject cross-church access and guest access is limited to the intended active poll.

## Scope and Dependencies
Legacy implementation umbrella for private round lifecycle, ballots, result reveal, candidate decisions, and audit. It overlaps the more granular current requirements US-010 through US-012 and E4/E5/E8; keep it as historical traceability rather than a second assignable implementation story. Depends on election/position configuration and nomination/consolidation.

## Relevant Decisions
- React/TypeScript frontend, Spring Boot, and PostgreSQL are the local architecture.
- Ballot choices are separate from voter identity; confidentiality is from church users, not system operators or metadata correlation.
- No live totals; admin may close/reveal; even two-candidate groups use the `N - 1` cutoff and may be reopened by an admin.

## Implementation Notes and Limitations
Existing [handoff](../STORY-PRIVATE-VOTING-ROUNDS/handoff.md) records broad code work as uncommitted/in progress, the focused PostgreSQL integration test as passed with JDK 25, frontend tests/build and selected API checks as passed, lint with one warning, and full backend suite/browser E2E as not run. It lists review findings and unresolved nomination-link policy, device identity, reports, retention, production identity, and operational setup. Preserve that handoff as the execution record; this requirements file does not replace or upgrade its status. The E1.2 branch and current worktree may not represent that historical handoff's branch state; verify before assigning it.
