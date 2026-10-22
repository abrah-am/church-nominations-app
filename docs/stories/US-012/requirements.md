# US-012: Close and Reveal a Round

- **Epic:** P0 Ballot Operations
- **Priority:** P0
- **Workflow status:** Implemented for local POC; formal acceptance not recorded
- **User story:** As an administrator, I can close a round and reveal its aggregate results after voting is complete.

## Acceptance Criteria
- Only an authorized admin can close and reveal a poll.
- Results remain inaccessible to voters and administrators before reveal, including by direct API request.
- Revealed results show the agreed electorate/ballot denominator, aggregate candidate totals, and any approved threshold.
- Close/reveal times and actor are recorded without linking actors to ballot choices.
- The administrator can record candidate removal/advancement/election decisions; the decision and reason are retained. The election completes when all configured openings are filled.
- After an even-group, two-candidate cutoff, the poll closes automatically at `N - 1` submissions; an admin may override the cutoff and reopen the poll.

## Scope and Dependencies
Admin lifecycle actions, aggregate reveal, and candidate decisions. Depends on US-011. Historical presentation/report policy and completion semantics link to E6.

## Relevant Decisions
Only authorized admins close/reveal; no live totals. Admin may reopen after cutoff. Candidate outcomes are recorded by authorized admin/committee.

## Implementation Notes and Limitations
Local POC has progress monitoring without live totals, close/reopen, reveal, and candidate decisions. Full election history and status presentation are follow-up scope. The exact report audience and fields remain unresolved (PD-006).
