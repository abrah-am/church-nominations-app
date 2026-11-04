# E5.1: Make Result Rankings and Recommendations Easy to Scan

- **Epic:** E5 Results Review and Candidate Decisions
- **Priority:** P1 (proposed)
- **Workflow status:** Backlog; not formally accepted
- **User story:** As an administrator, I want live vote totals and rankings presented consistently so I can monitor voting and review the closed round efficiently.

## Acceptance Criteria
- Results remain sorted by votes descending, then candidate name A–Z for ties.
- The admin sees aggregate candidate totals and rankings update during active voting and after close.
- The Audience Presentation control is available during voting and controls whether aggregate totals are also shown on both participant and presentation viewer surfaces; turning it off clears them.
- Each candidate row associates name, vote total, recommendation, current decision, and decision controls.
- Recommendations are explicitly labeled as suggestions and are not saved automatically.
- Aggregate display reveals no voter names or candidate selections by voter.

## Scope and Dependencies
Admin live and closed-round aggregate results presentation. Depends on US-012 and the Audience Presentation visibility contract.

## Relevant Approved Decisions
Recommendations are guidance, not automatic single-opening decisions. Aggregate results do not expose voter-to-choice mappings.

## Implementation Notes and Limitations
The current approved behavior replaces explicit result reveal with live admin totals and presentation-toggle-controlled viewer totals. Candidate actions remain admin-only.
