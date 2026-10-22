# E6.7: Handle Declined Offers and Select a Replacement Path

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Product clarification needed
- **User story:** As an election administrator, I want to choose an approved replacement process when an elected person declines so the position can be filled transparently.

## Acceptance Criteria
- After a decline is recorded, the administrator can choose either to invite the next eligible candidate directly or to start a new poll, subject to the confirmed product rules.
- Direct invitation identifies the candidate based on an approved ranking rule and records the invitation and response without changing prior ballot results.
- A replacement poll can use eligible candidates from the specified prior round; before it starts, the committee may agree to eliminate candidates and the administrator records the resulting roster and decision rationale.
- When the direct-successor ranking is tied, the system does not choose arbitrarily; it supports a poll among the tied candidates if that is the approved policy.
- Every new poll has a fresh tally, preserves the earlier results and decisions, and follows normal roster-lock, ballot privacy, close, and reveal rules.
- Position status remains unfilled until the replacement accepts, and history shows the decline, administrator-selected path, poll/decision, and final accepted outcome.

## Scope and Dependencies
Replacement workflow following a declined elected person. Depends on E6.6 response tracking, E6.1 completion semantics, and E6.3 history. The normal successor is described as the person with the most votes in the last round, but the exact ranking rule and applicable round require confirmation. This story must not silently infer committee authority, ties, or candidate eligibility.

## Clarifications Needed
- Which round determines the next-ranked candidate when an election has multiple rounds: the final round only, or a defined ranking across the election history?
- If the highest-ranked remaining candidate is tied, should the system require a tie-break poll before offering the position, or may the administrator choose a new poll or another policy?
- When the committee chooses a new poll, which prior-round candidates are eligible by default, and who can eliminate candidates? Is recorded committee agreement sufficient, or must attendance/quorum be checked?
- Does the new poll include all eligible candidates from the chosen round or only the tied/remaining candidates? Does the administrator configure the selection count and expected voter count as for any new round?
- If a directly invited successor also declines, may the administrator continue down the ranking, or must they choose a new poll?
- Are there limits on how many replacement polls can be run, and what happens if no candidate accepts?