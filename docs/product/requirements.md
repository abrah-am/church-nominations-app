# Product Requirements (Draft)

**Status:** Discovery draft; not approved for implementation.  
**Product:** Church nominations and elections  
**Last updated:** 2026-10-15

## Purpose

Provide churches with a private, auditable way to propose nominees, run multi-round elections for church positions, retain historical records, and present election results. The application replaces a manual voting-board process while preserving transparency about aggregate outcomes without revealing how an individual voted.

## Users and roles

- **Church administrator:** Sets up elections and rounds, maintains participant and candidate lists, monitors participation, closes voting, reveals results, and prepares reports.
- **Voter:** An eligible person participating in a church election. Each voter may submit at most one ballot per round. A voter must not be able to see live totals or another voter's choices.
- **Report viewer:** Reviews completed election records and reports. Exact access relative to administrators and voters remains to be confirmed.
- **Nomination committee member:** Submits proposed names for a selected position through its shareable nomination link or QR code. The committee determines the allowed number of names per submitter.
- **Church tenant:** Each church has its own account/data boundary. A church must not access another church's elections, participants, ballots, or reports.

## Core workflow

1. An administrator starts an election for a department and enters the positions to fill and the number of openings for each (for example, one director and two subdirectors).
2. The workflow begins with the first position. The administrator shares a position-specific nomination link or QR code with committee members so they can submit proposed names. The committee decides how many names each person may propose; the application does not impose a fixed nomination count.
3. After nominations close, the administrator reviews the submitted names, consolidates duplicates/variants into a unique list, and confirms the candidate identities. The application may assist by identifying likely duplicates, but must not merge names without human confirmation. The administrator promotes the selected unique names into the candidate roster for the first voting round.
4. The authorized administrator (typically the committee president) configures the number of distinct candidate selections per voter for each round. There is no fixed count or prescribed sequence; for a large list, the president may choose five selections, then three, then one in later rounds. After reviewing revealed results, the president chooses which candidates continue to the next round. Ballots must contain exactly the configured number of distinct selections. Selecting several candidates counts as one voter's ballot, not several voters.
5. Voters submit at most one ballot per round. The ballot payload and stored ballot-choice record do not include the voter's name; participation status is maintained separately.
6. No live totals are visible during voting. The administrator may close a round; a two-candidate, one-selection round with an even-sized voting group also closes automatically after `N - 1` ballots have been submitted, where `N` is the group size fixed when the round opens. After close, the administrator reveals aggregate results.
7. A candidate has a strict majority when selected by more than half of the ballots cast (for example, 9 of 17). For multiple openings, majority-qualified candidates are elected automatically up to the position's configured opening count. If more candidates qualify than openings remain, only those majority-qualified candidates continue into one-choice rounds; if nobody has a majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh totals until the openings are filled.
8. The same nomination and voting process is then run for the next position, such as subdirector. Multiple openings for one position are filled in that position's election; different positions have separate candidate/round histories. A person may be nominated for more than one position.
9. At completion, users can view a visual history of the election: positions, nomination/consolidation outcome, each round's candidate roster and revealed aggregate results, candidate advancement/elimination, and the elected person or people for each position.

## Confirmed business rules

- An election cycle belongs to a department and contains one or more position elections. Each position has a configured number of openings (for example, one director and two subdirectors).
- Each position has its own nomination intake, candidate consolidation, voting rounds, and elected outcome. Multiple openings for one position are filled through that position's election; different positions have separate histories. A person may be nominated for multiple positions.
- Position-specific nomination links/QR codes allow committee members to submit proposed names. The committee determines the allowed number of nominations per person; no fixed number is imposed by the application.
- The administrator consolidates duplicate or variant names with human confirmation and promotes the resulting unique names into the round roster.
- The authorized election administrator (typically the president) sets the exact selection count independently for each round. The application does not prescribe a fixed count or sequence; the setting must be valid for the round's candidate list.
- The president/authorized administrator sets each round's selection count and interprets results to configure the next-round candidate roster, subject to the confirmed majority and multi-opening election rules.
- A ballot must contain exactly the configured number of distinct candidates; duplicate selections are invalid, and an incomplete ballot cannot be submitted.
- The number of selections is not fixed across elections; it depends on the candidate-list size and is configured for each round. For example, a five-candidate list may use a one-selection ballot.
- Each submitted ballot represents one voter. In a multi-selection ballot, each selected candidate receives one selection from that voter; selections do not multiply the number of voters/ballots.
- A candidate has a suggested strict majority if selected on more than half of ballots cast (for example, 9 of 17). For a single opening, the system advises and the administrator/committee controls the outcome. For multiple openings, candidates who reach strict majority in a poll are elected automatically, subject to the hard cap on openings. If too many candidates qualify in one poll, eliminate the other candidates and use repeated one-choice rounds among the qualified candidates; when no candidate has majority in a runoff, eliminate the lowest-vote candidate and repeat with a fresh tally until all openings are filled.
- For a two-candidate, one-selection round with an even-sized voting group `N`, the round automatically closes after `N - 1` ballots have been submitted (for example, 13 of 14). For an odd-sized group such as 17, all 17 may vote. The group size is fixed when the round opens; the administrator may also close a round.
- Tied candidates may be voted on in a separate tie-break round. A tie-break winner may then enter a new round against the prior round's leader. Every new round begins with zero votes; prior tallies are not carried forward.
- Candidate elimination, advancement, and election decisions are controlled by the administrator/committee and recorded.
- The election is complete when the required number of candidates has been elected; each elected candidate and the round in which they qualified are recorded.
- Candidate names are locked once a round opens. The candidate-withdrawal policy is unresolved; discovery answers conflict on whether withdrawal is allowed.
- The completed election has a visual, reviewable history showing nomination consolidation, all voting rounds and aggregate results, candidate progression, and elected outcomes per position.
- Ballot submissions contain no voter name, and stored ballot choices are separate from named participation status. Administrators may see participation status but must not see which candidates a voter selected. This is confidentiality from church users, not a promise of unlinkability from system operators.
- No live results are shown while a round is open. An administrator reveals aggregate results after closing the round.
- Historical rounds and audit information are required for transparency.
- Each church is a separate tenant. Users of one church cannot see another church's process or data.
- Mobile access is required for participating voters.
- An active-member directory integration is a possible future aid to selecting and normalizing candidate names, not a confirmed MVP integration.

## Functional requirements

- **FR-1 Tenant isolation:** Each church has an isolated account and its users can access only that church's data.
- **FR-2 Role-based access:** Enforce separate administrator, voter, and report-viewer permissions. Exact role overlap and report visibility require confirmation.
- **FR-3 Election setup:** Create a department election containing ordered position elections, each with an opening count, nomination list, eligible voter list, and configurable rounds.
- **FR-16 Department election setup:** Create an election for a department with multiple positions, each having a configured number of openings; process positions independently in sequence.
- **FR-17 Nomination intake:** Generate a shareable nomination link/QR code scoped to a position; accept the committee-determined number of proposed names per submitter.
- **FR-18 Nominee consolidation:** Allow an administrator to review submissions, merge duplicate/variant names with explicit confirmation, and promote unique nominees into a round's candidate roster.
- **FR-19 Visual election history:** Present all positions and their nomination outcome, rounds, revealed aggregate results, candidate changes, and elected person/people in a navigable visual summary.
- **FR-15 Multiple openings:** Allow an election to specify the number of people required for one office and track elected candidates across rounds until that number is reached.
- **FR-4 Candidate list management:** Add and normalize proposed names before a round opens. Prevent changes to that round's candidate list after opening, subject to a confirmed withdrawal policy.
- **FR-5 Ballot submission:** Accept one ballot per eligible voter per round and require exactly the round's configured number of distinct candidate selections; reject duplicates and incomplete ballots.
- **FR-6 Ballot confidentiality:** Never expose a mapping between a named voter and their candidate selections to ordinary church administrators or report viewers.
- **FR-7 Participation tracking:** Show administrators whether each expected voter has completed the round without exposing ballot choices.
- **FR-8 Result concealment and reveal:** Hide aggregate totals during an open round; allow an authorized administrator to close and reveal results.
- **FR-9 Round management:** Preserve candidate lists and results, allow authorized post-round advancement/removal decisions, and record who made each decision and when.
- **FR-10 Historical reporting:** Retain completed election and round records for later review. Report formats, exports, and retention duration remain to be decided.
- **FR-11 Auditability:** Record election configuration, round state transitions, result reveal, and administrative candidate advancement/removal. Do not include voter names or selections in ballot records or identity-linked audit entries.
- **FR-12 Majority guidance:** Calculate strict-majority information based on ballots cast, counting each voter once per candidate selected. The president/admin chooses selection count and next-round roster; apply the confirmed outcome rules for single- and multiple-opening positions.
- **FR-13 Tie handling:** Support administrator-configured tie-break rounds with fresh tallies and no carry-forward of prior-round votes.
- **FR-14 Two-candidate even-group cutoff:** In a two-candidate, one-selection round with an even-sized group `N`, automatically close after `N - 1` ballots have been submitted, as a guard against an unexpected tie.

## Nonfunctional requirements

- **Privacy:** Ballot choices must not be visible to other voters, church administrators, or report viewers. No live totals may influence an open round.
- **Tenant security:** Every tenant-owned operation must enforce the church boundary server-side, not only in the UI.
- **Auditability:** Preserve enough history to review each round and administrative action without linking a voter to their choices.
- **Usability:** Voters must be able to participate on mobile devices.
- **Reliability:** Ballot submission must be durable and prevent duplicate submissions. Availability targets and offline behavior are not yet defined.
- **Accessibility, language, retention, backup/recovery, and hosting-region requirements:** Not yet specified.

## Out of scope for the MVP (proposed)

- Automatic nomination deduplication or automatic selection of a later-round roster; the president/admin reviews results and chooses subsequent candidates, except for the confirmed majority/runoff outcomes in multi-opening elections.
- Automatic selection of nominees from duplicate submissions without administrator confirmation.
- Integration with an external church membership directory.
- Automatic assignment of candidates across different offices or optimization of a person's preferred position.
- Email/SMS notifications and external identity-provider integration until needed and selected.
- Real-time/live tally display.

## Open questions and risks

1. **No-majority policy outside overqualification runoff:** The administrator decides whether to keep, remove, or advance candidates if no one receives a suggested strict majority in a regular round. Confirm whether the system should offer any additional candidate recommendations beyond the majority flag.
2. **Close override:** The application auto-closes a two-candidate, one-selection round with an even-sized group `N` after `N - 1` ballots submit. Clarify whether an administrator can override this safeguard or reopen the round.
3. **Candidate withdrawal:** Discovery answers conflict on whether withdrawal is allowed. Confirm the intended policy; withdrawal after opening also conflicts with the locked candidate list.
4. **Voting population changes:** Define how the participant roster changes if attendees arrive or leave after a round opens, and whether the two-candidate even-group cutoff uses the roster fixed at opening.
5. **Result release:** Results are hidden while a round is open and revealed by an administrator. Confirm whether reveal is always per-round or can be delayed until the whole election ends.
6. **Authentication and account administration:** Decide how users are invited/authenticated, whether one person may belong to multiple church tenants, and whether accounts are church-specific as well as data-isolated.
7. **Nomination access:** Decide whether a nomination link is anonymous, requires sign-in, expires, or is limited to one submission per invited committee member; define whether nominators may edit submissions before nominations close.
8. **Report audiences/content:** Confirm whether completed histories are visible to voters, committee members, or only designated viewers; whether named participant status, aggregate totals, and action history appear; and whether CSV/PDF export is required.
9. **Scale and operations:** Confirm initial church count, expected voters per round, hosting preference/budget, target availability, backup/restore objectives, and retention period.
10. **Privacy/compliance and accessibility:** Identify applicable jurisdiction, data-retention expectations, accessibility target, supported languages, and whether candidate names are personal data requiring correction/deletion procedures.

## Acceptance criteria for MVP (draft)

- A user from one church cannot access another church's data by changing a URL or API identifier.
- An administrator can create a department election with multiple positions and opening counts.
- Committee members can submit names through a position-specific nomination link/QR code; an administrator can consolidate duplicates with confirmation and promote unique names into a voting roster.
- An administrator can configure a position's participant roster and a round before opening it.
- An eligible voter can submit one valid ballot from a mobile viewport; repeated or invalid submissions are rejected without duplicating a vote.
- The configured number of distinct selections is enforced for each round; incomplete or duplicate selections cannot be submitted.
- Majority counts each voter once per candidate, regardless of the number of selections on that ballot. For a single opening, the administrator/committee makes the election decision; for multiple openings, the confirmed majority and runoff rules determine elected candidates within the hard opening cap.
- An election records its number of openings and tracks elected candidates across one or more rounds until the required number is reached.
- A tie-break round begins at zero votes, and the two-candidate even-group cutoff closes after `N - 1` submissions when the group size `N` is even.
- Neither voters nor administrators can view aggregate results while the round is open.
- Administrators can see participant completion status without seeing ballot selections.
- After an authorized close and reveal, participants can view aggregate round results and later review the historical record.
- The completed election view presents each position and visually traces nominations, consolidated candidates, every round's roster and revealed totals, candidate progression, and elected person/people.
- The stored audit record captures configuration and administrative transitions without associating ballot choices with voter identities.
- A visual history shows every position's nominations, rounds, aggregate results, candidate changes, and elected outcomes.
- MVP report/history access matches the audiences approved during discovery.