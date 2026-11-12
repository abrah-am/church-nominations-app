# E6.7: Handle Declined Offers and Select a Replacement Path

- **Epic:** E6 Election Completion and History
- **Priority:** P1 (proposed)
- **Workflow status:** Partially clarified; see the 2026-11-11 Product Owner update and remaining edge cases
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

## Approved replacement-selection addendum (2026-11-07; PD-018/PD-020)

Clarification status: the original questions about which round/ranking applies, the top-tie path, and the fresh-poll eligible roster are resolved by the rules below. A decline or no eligible candidate leaves Vacancy and requires an administrator-selected next allowed path or approved candidates; continued ranking/offer caps, additional allowed paths, and committee/approval process remain open. The original questions are retained as history and are not independent authorization to choose a different rule.

After a post-finalization Vacancy, the administrator selects a replacement path; the application never automatically elects or creates a voting round. An opening remains unfilled until an invitee separately records Accepted.

- **Direct invitation:** Use candidates in the most recent completed, non-voided voting round associated with the opening's Elected candidate. A direct invitee must have a saved `Advanced` decision in that same round and must not have a prior Accepted/Elected outcome for another filled opening, a Declined response, or an explicit Remove/Eliminated decision. Rank eligible candidates by aggregate vote count in that same round.
- **Top tie:** Do not resolve a tie by arbitrary direct choice. With administrator confirmation, create a fresh tie-break voting poll containing only the tied top eligible candidates.
- **Fresh replacement poll:** The administrator explicitly selects the roster from candidates in that same round, excluding anyone already accepted/elected for a filled opening, anyone who declined, and anyone explicitly removed/eliminated. The administrator records the roster rationale. The poll uses a fresh tally; no previous poll, ballot, result, or decision is changed.
- **No automatic follow-up:** An invitee's decline or an empty eligible pool leaves Vacancy derived. The administrator must choose another allowed path or add approved candidates. Do not infer continued ranking after a decline, offer/poll caps, automatic nomination, or committee/quorum process.

These rules retain PD-018's tie requirement and supersede its less-specific 2026-11-02 ranking/roster wording. See [PD-018](../../product/product-decisions.md), [E6.6](../E6.6/requirements.md), and [E6.1](../E6.1/requirements.md). Still-open questions are committee/approval process for roster rationale, behavior if no eligible candidate remains or an invitee declines (beyond requiring another admin-selected allowed path or approved candidates), and any additional allowed replacement paths. Refine those before implementation.

## WEB-NEXT-M5 replacement update (Product Owner approved, 2026-11-11)

This update supersedes the 2026-11-07 same-round-only fresh-poll roster and blanket eligibility exclusions for the M5 mock workflow. It does not change prior results or historical decisions.

- **Direct recommendation:** Use Advanced candidates from the most recent completed, non-voided round associated with the declined candidate. Exclude candidates Elected for another opening in the same position election, candidates who declined this position, and Eliminated/Removed candidates. Other positions/departments do not affect eligibility. Rank by votes and recommend only a unique highest candidate; a tie at the top requires an Admin-confirmed fresh tie-break poll containing only the tied top candidates.
- **Invitations:** The Admin explicitly chooses each direct invitation. No automatic offers or numeric cap; after a decline the Admin may explicitly choose the next ranked candidate or another allowed replacement path.
- **Manual replacement poll:** When direct recommendations are unavailable/exhausted, the Admin may start a replacement poll and manually enter/select any number of names from historical nomination or round data for this same position election. The Admin uses judgment: the application does not rank or filter this manual roster by prior Elected, Declined, or Eliminated status. Require an audited reason; preserve historical polls, decisions, responses, and results. Names from other positions/departments and automatic nominations are not allowed.
- **Empty history:** If the position has no historical names for a replacement roster, keep Vacancy; do not create an empty poll or auto-nominate. A new candidate source requires separate Product Owner approval.
- **Finalization:** A position is finalized only when every opening is Accepted and no poll is open. Reopen is explicit, confirmed, audited, and does not create/start a poll. See PD-020 and E6.6.

Committee/quorum process and response correction/reversal remain unresolved and out of M5. Contact dates/details are not collected. If a candidate declines after an invitation, do not automatically send another offer.