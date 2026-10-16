# MVP Backlog (Draft)

**Status:** Proposed; items are not implementation authorization.  
**Prerequisite:** Product Owner approval of the remaining product policy decisions. The stack is confirmed as React + TypeScript, Java/Spring Boot, and PostgreSQL.
**Last updated:** 2026-10-15

## MVP outcome

A church administrator can set up a department election with multiple positions and opening counts, collect committee nominations through shareable links/QR codes, consolidate nominee names, run president-configured private voting rounds, and present a visual history of all rounds and elected outcomes without revealing voter-to-choice mappings.

## Product decisions blocking final acceptance criteria

- Candidate withdrawal policy and how the roster is fixed if attendees arrive or leave after voting opens.
- Whether the two-candidate even-group auto-close safeguard can be overridden or reopened.
- Whether result reveal is per-round or can be delayed until the whole election ends.
- Nomination link identity, expiry, submission limits, and edit policy.
- Identity provider/invitation method; report-viewer access; retention/export requirements.

## Prioritized backlog

### P0: Tenant and access foundation

**Story:** As a church user, I can access only my church's application data.

**Acceptance criteria:**
- Every tenant-owned API operation checks the authenticated user's church membership and role.
- Cross-tenant access attempts fail even when a valid identifier from another church is supplied.
- Tests cover list, detail, update, ballot, and report endpoints for tenant boundary violations.

**Story:** As an administrator, I can maintain a church's users and permissions.

**Acceptance criteria:**
- Administrator, voter, and report-viewer capabilities are explicit and enforced by the API.
- Authentication and invitation approach is selected before this story is implemented.
- Role overlap and multiple-church membership behavior are covered by approved requirements.

### P0: Configure an election

**Story:** As an administrator, I can create an election for a department, list each position and number of openings, and configure the process for each position.

**Acceptance criteria:**
- The election belongs to exactly one church and department and contains one or more positions with opening counts.
- Each position has an independent nomination/candidate/round history; multiple openings for that position are filled within its process.
- The admin can open and manage positions one at a time, beginning with the first selected position.

### P0: Collect and consolidate nominations

**Story:** As a committee member, I can submit proposed names for a position using a link or QR code shared by the administrator.

**Acceptance criteria:**
- The link/QR code is scoped to the active position's nomination intake.
- The committee decides how many names each submitter may propose; there is no application-wide fixed count.
- Nominations are collected separately from voting ballots and are not included in ballot anonymity guarantees.
- Nomination-link access, expiry, submission limits, and identity requirements follow the policy selected before implementation.

**Story:** As an administrator, I can consolidate nomination submissions into a unique candidate list and promote selected names into a voting round.

**Acceptance criteria:**
- The admin can inspect submitted names and correct spellings or merge duplicates with explicit confirmation.
- The system may flag likely duplicates but never silently merges distinct people.
- The admin selects which consolidated candidates enter the round roster.
- The consolidated nomination outcome and candidate roster are retained in election history.

### P0: Configure a voting round

**Story:** As the president or authorized administrator, I can choose the ballot selection count and candidate roster for each round.

**Acceptance criteria:**
- The authorized operator sets the exact number of distinct candidate selections for each round; the application imposes no fixed progression or default rule beyond valid input bounds.
- After viewing revealed results, the operator explicitly chooses the candidates for the next round.
- Ballots require exactly the configured number of distinct selections; incomplete and duplicate selections cannot be submitted.
- Candidate/round configuration is locked once the round opens, subject to an approved withdrawal policy.

### P0: Cast a private ballot

**Story:** As an eligible voter, I can submit one valid ballot from my phone without exposing my choices to other users.

**Acceptance criteria:**
- Only an eligible authenticated voter can submit during an open round.
- A ballot cannot select the same candidate more than once and obeys the configured selection-count rule.
- The system suggests a strict majority when a candidate is selected by more than half of ballots cast (for example, 9 of 17); for a single opening, the administrator/committee decides whether a candidate stays, advances, or is elected.
- For multiple openings, candidates who reach strict majority in a poll are elected automatically, up to the configured seat count. If more candidates qualify than openings remain, eliminate the other candidates and run one-choice rounds among the majority-qualified candidates. If nobody has a majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh totals until the remaining openings are filled.
- In a two-candidate, one-selection round with an even-sized group `N`, the round automatically closes after `N - 1` ballots have been submitted; for 14 voters, close after 13. For 17 voters, all 17 may vote.
- An administrator may close other rounds; totals remain hidden until result reveal.
- Tie-break rounds use a fresh tally starting at zero. If tied candidates are resolved, a subsequent round against a prior leader also starts at zero.
- A voter can submit at most once per round; retries do not create extra ballots.
- The ballot-choice record has no voter identity reference; a separate participation record lets the administrator see completion status.
- API responses and UI do not show live candidate totals while the round is open.
- Errors and logs do not include ballot choices or credentials.

### P0: Close and reveal a round

**Story:** As an administrator, I can close a round and reveal its aggregate results after voting is complete.

**Acceptance criteria:**
- Only an authorized administrator can close and reveal a round.
- Results remain inaccessible to voters and administrators before reveal, including by direct API request.
- Revealed results show the agreed electorate/ballot denominator, aggregate candidate totals, and any approved threshold.
- Close/reveal times and actor are recorded without linking actors to ballot choices.
- The administrator can record candidate removal/advancement/election decisions; the decision and reason are retained. The election completes when all configured openings are filled.
- After an even-group, two-candidate cutoff, the round closes automatically at `N - 1` submissions to prevent an unexpected tie.

### P1: Historical reports and audit review

**Story:** As an authorized church user, I can review completed elections and understand how each result was reached.

**Acceptance criteria:**
- Historical election, position, nomination/consolidation, round, candidate, aggregate result, and administrative decision records are retained.
- A visual election history traces every position from nomination intake through each round and the elected outcome(s).
- Report access is restricted by the approved role policy and tenant boundary.
- Audit history does not expose ballot selections or voter-to-candidate mappings.
- Export formats are added only after the Product Owner confirms whether CSV/PDF is required.

### P1: Member directory integration discovery

**Story:** As an administrator, I can reduce duplicate candidate identities by choosing from the church's active-member list.

**Acceptance criteria:**
- First release remains usable without this integration.
- Before integration work, identify the system of record, API/export mechanism, authorization, matching/correction policy, and data refresh cadence.
- Manual name correction remains available and auditable.

## First vertical slice (proposed)

Deliver a department election with two positions (one director and two subdirector openings), running the nomination, consolidation, voting, and history workflow for both positions:

1. An administrator creates an election for a department and configures Director (1 opening) and Subdirector (2 openings).
2. The admin opens the Director nomination intake and shares its link/QR code. Committee members submit names within the committee-decided limit.
3. The admin consolidates duplicate names with explicit confirmation and promotes unique nominees into the first round.
4. The president sets the selection count and opens voting. Voters submit private ballots from mobile; no user sees totals while the round is open.
5. The admin closes and reveals results, then configures another round's candidate roster and selection count as needed. Multi-opening majority outcomes obey the hard opening count and runoff rule.
6. Repeat nomination intake, consolidation, and voting for Subdirector, filling two openings under the multi-seat rule.
7. The completed view presents both positions' nomination submissions, consolidated rosters, all rounds and aggregate results, candidate progression, and elected outcome(s) as a visual history.
8. The application persists the process and audit history and blocks cross-church access.

**Definition of done:** API and frontend behavior satisfy approved acceptance criteria; PostgreSQL migrations and constraints are tested; tenant and ballot privacy checks pass; focused unit/integration/E2E checks run and results are reported; no unresolved critical security/privacy finding remains.

## Suggested implementation sequence (after approval)

1. Resolve the remaining product-policy questions and approve the draft requirements and monorepo boundaries.
2. Establish authentication, church tenancy, role authorization, database migrations, and automated tenant-isolation tests.
3. Implement department election setup, position opening counts, nomination links, and candidate consolidation.
4. Implement president-configured rounds, ballot submission, and separated participation tracking with duplicate protection.
5. Implement close/reveal, aggregate results, candidate progression, and audit history.
6. Build the visual election history and complete the responsive/mobile accessibility pass.

Do not begin scaffolding, install packages, or implement these items until the Product Owner approves the architecture and remaining product-policy decisions required for the vertical slice.