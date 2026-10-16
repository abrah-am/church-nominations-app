# MVP Backlog (Draft)

**Status:** Proposed; items are not implementation authorization.  
**Prerequisite:** Proposed architecture is approved. POC identity uses locally managed email/password accounts. Production identity hardening, automated password recovery, report specification, device-profile implementation, and operations must be resolved before production release.
**Last updated:** 2026-10-16

## Implementation status

- **Completed: local application foundation.** React + TypeScript/Vite frontend, Java 25/Spring Boot API, Gradle 9.1 wrapper, API health endpoint, frontend API connection state, and local CORS configuration are implemented. Validation: API tests 2/2 passed; frontend tests 4/4 passed; frontend production build and API boot JAR succeeded; browser check confirmed the frontend reports `API connected` against the running API.
- **Not complete: MVP/business foundation.** Local account registration, church creation, church-scoped election setup, and the configured single-church election setup slice are implemented. Production identity hardening, nominations, ballots, results, and reports are not implemented. No end-to-end election workflow is complete.
- **Lint note:** frontend lint completes with one existing non-null assertion warning in `apps/web/src/main.tsx`.

Status labels below reflect implementation evidence only. “Blocked” means implementation must wait for the approval prerequisite above; it does not mean the story is complete.

## MVP outcome

An administrator can register an account and church, establish the church's annual election board, set up a department election with multiple positions and opening counts, collect committee nominations through shareable links/QR codes, consolidate nominee names, run president-configured private voting rounds, and present a visual history of all rounds and elected outcomes without revealing voter-to-choice mappings.

## Product decisions blocking final acceptance criteria

- Production identity provider/hardening, account verification and account lifecycle, and automated password recovery (required before production release; not needed for the local POC).
- Church profile fields beyond name; the POC enforces one admin per church and one church per admin.
- Board-session attendance correction/audit policy; the POC uses session dates and replaces the attended-member set when attendance is saved.
- Device-profile implementation for same-device repeat prevention and choice editing, including cleared browser storage/device switching.
- Voter group size and handling late arrivals/departures before/during a poll.
- Nomination operational requirements and exact ballot-close consensus behavior. Nomination link access/edit policy is set for the POC below; nomination submitters use no separate third application role.
- Report audience, fields, exports, and retention; the report area was approved but concrete values were not specified.

## Prioritized backlog

### P0: Reproducible local database environment

**Story:** As a developer, I can start the local PostgreSQL database with one command so I can run the API and verify migrations without provisioning a database manually.
**Implementation status:** Complete for the local developer environment. PostgreSQL 16 Compose service, loopback port, readiness health check, named volume, ignored `.env` configuration, and start/stop/reset documentation are implemented. A Testcontainers PostgreSQL 16 integration test verifies Flyway migration and election create/read persistence.

**Acceptance criteria:**
- A pinned PostgreSQL major version starts through Docker Compose and binds only to the local host interface.
- A health check reports when PostgreSQL is ready; a named volume preserves local data between container restarts.
- Local credentials are configurable via an ignored `.env` file with a non-secret example template; no production credentials are committed.
- Documentation covers start/stop, API environment variables, Flyway startup migration, and how to reset the local data volume.
- A real PostgreSQL-backed API test/build verifies Flyway migrations and election setup persistence; H2-only results do not satisfy this check.

### P0: Tenant and access foundation

**Story:** As a church user, I can access only my church's application data.
**Implementation status:** Partial for the local POC. Email/password accounts are authenticated with BCrypt-backed HTTP Basic in the `dev` profile. Church creation assigns one admin account to one church, and election operations resolve church scope from that account; cross-church reads/writes are denied. Registration and business routes fail closed outside `dev`. Automated tests cover registration, password hashing, church assignment, election isolation, and non-dev denial. Production identity/transport hardening, password recovery, guest ballot/report routes, and tenant coverage for future endpoints remain incomplete.

**Acceptance criteria:**
- Every tenant-owned operation checks authenticated church membership/role for admins; guest voting operations validate a scoped voting link and its church/election/round context server-side.
- Cross-tenant access attempts fail even when a valid identifier from another church is supplied.
- Tests cover list, detail, update, ballot, and report endpoints for tenant boundary violations.

**Story:** As an administrator, I can maintain a church's users and permissions.
**Implementation status:** Partial for the POC. Registered admins authenticate with email/password; church creation grants the creator the sole admin role for that church. Additional admin accounts per church are not allowed. Non-dev business routes fail closed. MVP roles are `admin` and `guest`; guests have no account, and no separate report-viewer role is planned.

**Acceptance criteria:**
- Admin capabilities are explicit and enforced by the API. Guests have no accounts; ballot access is authorized by an active-poll link. Nomination-submit access will use `admin` or `guest`, not a third role.
- Production identity hardening, account recovery, and any change to the POC one-admin/one-church rule are resolved before production use.
- Role overlap and cross-church access behavior are covered by automated tests.

### POC: Local admin identity and church onboarding

**Implementation status:** Implemented for local demonstration. Email is the username; passwords are BCrypt-hashed in PostgreSQL and HTTP Basic authentication is enabled only in the local `dev` profile. Public registration creates an account without church access; the authenticated creator becomes the sole admin of one church. The migration preserves old election tenant IDs as unclaimed church records, which require manual handling before those old elections can be managed by a registered account. Password-reset email delivery is not implemented because the POC has no mail service.

**Story: Register for the application as an administrator.** As a prospective church administrator, I can create an application account so I can register a church and administer it.

**Acceptance criteria:**
- Open self-registration is allowed in the local `dev` profile; no invitation or approval is required.
- Email is the sign-in username. Passwords are BCrypt-hashed and never returned by registration or account APIs.
- Creating an account alone does not grant access to church data; administrator capabilities require an explicit church membership/role association.
- Automated tests cover successful registration, invalid or duplicate registration, password verification, authentication, and denial of tenant data access without church membership.

**Story: Register a church.** As an authenticated administrator, I can register a new church so its elections and users have a tenant to belong to.

**Acceptance criteria:**
- An authenticated account can create a church using its name.
- The creating administrator becomes the initial administrator for that church, with membership and role recorded server-side.
- Church records have stable identifiers; all subsequent church-owned records are associated with exactly one church.
- A `My churches` view lists the authenticated administrator's church; church creation is available to an account with no church.
- The POC enforces exactly one admin per church and one church per admin; election access derives the church from the authenticated account, not a process-wide church setting.
- Tests cover create/list authorization, no-election-access-before-church, and cross-church election denial.

**Story: Register an election board.** As an authorized church administrator, I can register an election board for my church so election administration has a defined owner.

**Implementation status:** Implemented for the local POC. Each church can register one board per year with a non-empty named member roster. Administrators can list/open boards, create dated sessions, and replace attendance per session. Board and attendance APIs derive church scope from the authenticated admin; foreign boards are hidden. Board members need no accounts or passwords, and roster/attendance are separate from ballots. Migration, API, and UI tests cover the flow. Production hardening and any later change to the one-board-per-year POC rule remain outside this slice.

**Acceptance criteria:**
- An election board is the church committee responsible for proposing people for positions and participating in their election.
- The POC enforces one board per church per year; its board membership may change from year to year, and prior-year board and membership history is retained.
- An authorized church administrator can register and maintain a year's board within a church; each board belongs to exactly one church and is associated with its year.
- The board has a non-empty named member roster for attendance purposes; members do not need application accounts or passwords for MVP participation.
- An authorized administrator can create sessions identified by date and record which named board members attended each session. Attendance is not inferred from nomination or voting activity.
- Board members propose candidates through the nomination workflow and vote through the existing guest-link flow, without signing in or entering a password.
- Named board membership and session attendance are stored separately from ballot records; no attendance entry, member identity, or participation status can be joined to a ballot or its selections.
- Tests cover board creation, listing/detail/update, year association, prior-year history, per-session attendance, anonymous guest-link voting, and cross-church access denial.

**Deferred production hardening:**
- Select a production identity provider and account lifecycle; add verified email and automated recovery when a mail service is available.
- Replace development-profile-only Basic authentication with production-suitable transport/session/token protections before exposure beyond localhost.
- Retain server-side church authorization; it must not rely on process-wide `APP_CHURCH_ID`.
- Election setup and all other tenant-owned administrator operations enforce church membership; valid identifiers from another church do not grant access.
- Automated tests cover unauthenticated and unauthorized requests, list/detail/create/update behavior, and cross-tenant access denial.
- Development-profile registration and Basic authentication remain unavailable outside the local POC profile.

### P0: Configure an election

**Story:** As an administrator, I can create an election for a department, list each position and number of openings, and configure the process for each position.
**Implementation status:** Complete for local setup in the configured one-church-per-admin POC. The API supports durable create/list/detail/setup edits and ordered position/opening configuration; edits preserve position IDs through rename and reorder. The UI opens the first configured position and navigates positions sequentially. API tests include PostgreSQL Testcontainers migration and create/read/update/reorder persistence coverage; frontend tests and production build pass.

**Acceptance criteria:**
- An election belongs to the authenticated admin's church and one department, and contains one or more ordered positions with opening counts. The API derives this scope from the admin's persisted church assignment.
- Each position has a stable identity, independent opening count, and configured sequence so later nomination, candidate, and round records can be associated with the correct position. Those later workflows are separate stories.
- The administrator can open and manage positions one at a time in configured sequence, beginning with the first position. The UI provides sequential position navigation.

### P0: Collect and consolidate nominations

**Story:** As a committee member, I can submit proposed names for a position using a link or QR code shared by the administrator.
**Implementation status:** Implemented for the local POC. An admin creates one position-scoped intake, selects a maximum number of names based on committee agreement, and shares a bearer link suitable for a QR code. Anyone with the link can submit without an account. Each browser profile can revise its own list while intake is open; it is used only for editing and is never shown to the admin. Public access ends when the admin closes the intake. API, PostgreSQL, and frontend tests cover the flow. A browser-profile token cannot prove a real-world person submitted only once.

**Acceptance criteria:**
- The shared link/QR code is scoped to one position's nomination intake and can be opened without sign-in.
- The committee agrees the maximum names per submitter; the administrator configures that limit for the intake. There is no application-wide fixed count.
- Nominations are collected separately from voting ballots and are not included in ballot anonymity guarantees.
- Each browser profile can replace its own submitted list while intake is open; public reads return only that profile's list.
- The admin sees proposed names without submitter/device identity. Closing the intake disables public read/edit access.

**Story:** As an administrator, I can consolidate nomination submissions into a unique candidate list and promote selected names into a voting round.
**Implementation status:** Partial. The admin can review anonymous proposed names, correct or merge them explicitly in a unique-name snapshot, and retain the confirmed list. Promotion into a configured voting-round roster is deferred to the voting-round story.

**Acceptance criteria:**
- The admin can inspect submitted names and correct spellings or merge duplicates with explicit confirmation.
- The system may flag likely duplicates but never silently merges distinct people.
- The admin explicitly confirms the final consolidated names; no source-device data is exposed or used to merge.
- The consolidated nomination outcome is retained; candidate promotion into a round roster is completed with round configuration.

### P0: Configure a voting round

**Story:** As the president or authorized administrator, I can choose the ballot selection count and candidate roster for each round.
**Implementation status:** Not started; blocked pending role and round-policy decisions.

**Acceptance criteria:**
- The authorized operator sets the exact number of distinct candidate selections for each round; the application imposes no fixed progression or default rule beyond valid input bounds.
- After viewing revealed results, the operator explicitly chooses the candidates for the next round.
- Ballots require exactly the configured number of distinct selections; incomplete and duplicate selections cannot be submitted.
- Poll candidate configuration is editable before voting starts and locked while active; withdrawal is allowed only before start or after closure.

### P0: Cast a private ballot

**Story:** As an eligible voter, I can submit one valid ballot from my phone without exposing my choices to other users.
**Implementation status:** Not started; non-expiring links, active-poll 404 behavior, same-device repeat prevention with ballot editing, withdrawal timing, and cutoff override/reopen are approved. Device-token and group-size details remain open.

**Acceptance criteria:**
- Only a guest possessing a valid non-expiring voting link can access an active poll; the route returns 404 when no poll is active. Voter sign-in is not required.
- A ballot cannot select the same candidate more than once and obeys the configured selection-count rule.
- The system suggests a strict majority when a candidate is selected by more than half of ballots cast (for example, 9 of 17); for a single opening, the administrator/committee decides whether a candidate stays, advances, or is elected.
- For multiple openings, candidates who reach strict majority in a poll are elected automatically, up to the configured seat count. If more candidates qualify than openings remain, eliminate the other candidates and run one-choice rounds among the majority-qualified candidates. If nobody has a majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh totals until the remaining openings are filled.
- In a two-candidate, one-selection round with an even-sized group `N`, the round automatically closes after `N - 1` ballots have been submitted; for 14 voters, close after 13. For 17 voters, all 17 may vote.
- An administrator may close other rounds; totals remain hidden until result reveal.
- Tie-break rounds use a fresh tally starting at zero. If tied candidates are resolved, a subsequent round against a prior leader also starts at zero.
- An opaque browser-profile token cannot create a second ballot for the same poll, but may edit/replace its choice while active. This cannot guarantee a one-ballot-per-person or physical-device limit if browser data is cleared or another profile/device is used; token storage and recovery must be designed.
- The ballot-choice record has no voter identity reference; a separate participation record lets the administrator see completion status.
- API responses and UI do not show live candidate totals while the round is open.
- Errors and logs do not include ballot choices or credentials.

### P0: Close and reveal a round

**Story:** As an administrator, I can close a round and reveal its aggregate results after voting is complete.
**Implementation status:** Not started; per-round reveal after closure and admin cutoff override/reopen are approved.

**Acceptance criteria:**
- Only an authorized admin can close and reveal a poll.
- Results remain inaccessible to voters and administrators before reveal, including by direct API request.
- Revealed results show the agreed electorate/ballot denominator, aggregate candidate totals, and any approved threshold.
- Close/reveal times and actor are recorded without linking actors to ballot choices.
- The administrator can record candidate removal/advancement/election decisions; the decision and reason are retained. The election completes when all configured openings are filled.
- After an even-group, two-candidate cutoff, the poll closes automatically at `N - 1` submissions; an admin may override the cutoff and reopen the poll.

### P1: Historical reports and audit review

**Story:** As an authorized church user, I can review completed elections and understand how each result was reached.
**Implementation status:** Not started; report work is approved in principle, but audience, contents, exports, and retention values were not specified and remain open.

**Acceptance criteria:**
- Historical election, position, nomination/consolidation, round, candidate, aggregate result, and administrative decision records are retained.
- A visual election history traces every position from nomination intake through each round and the elected outcome(s).
- Report access is restricted by the approved role policy and tenant boundary.
- Audit history does not expose ballot selections or voter-to-candidate mappings.
- Export formats are added only after the Product Owner confirms whether CSV/PDF is required.

### P1: Member directory integration discovery

**Story:** As an administrator, I can reduce duplicate candidate identities by choosing from the church's active-member list.
**Implementation status:** Not started; discovery may proceed, but integration is future scope and is not an MVP blocker.

**Acceptance criteria:**
- First release remains usable without this integration.
- Before integration work, identify the system of record, API/export mechanism, authorization, matching/correction policy, and data refresh cadence.
- Manual name correction remains available and auditable.

## First vertical slice (proposed)

Deliver an annual church-board election with two positions (one director and two subdirector openings), running the nomination, consolidation, voting, and history workflow for both positions:

1. An administrator registers an application account, registers a church, and becomes its initial administrator. The church appears in `My churches`.
2. The church administrator registers the election board for the year; board membership and prior-year history are retained.
3. The admin creates an election for a department and configures Director (1 opening) and Subdirector (2 openings).
4. The board opens the Director nomination intake and shares its link/QR code. Committee members submit names within the committee-decided limit.
5. The admin consolidates duplicate names with explicit confirmation and promotes unique nominees into the first round.
6. The president sets the selection count and opens voting. Voters submit private ballots from mobile; no user sees totals while the round is open.
7. The admin closes and reveals results, then configures another round's candidate roster and selection count as needed. Multi-opening majority outcomes obey the hard opening count and runoff rule.
8. Repeat nomination intake, consolidation, and voting for Subdirector, filling two openings under the multi-seat rule.
9. The completed view presents both positions' nomination submissions, consolidated rosters, all rounds and aggregate results, candidate progression, and elected outcome(s) as a visual history.
10. The application persists church, board, election, and audit history and blocks cross-church access.

**Definition of done:** API and frontend behavior satisfy approved acceptance criteria; PostgreSQL migrations and constraints are tested; tenant and ballot privacy checks pass; focused unit/integration/E2E checks run and results are reported; no unresolved critical security/privacy finding remains.

## Suggested implementation sequence (after approval)

1. Resolve the remaining product-policy questions and approve the draft requirements and monorepo boundaries.
2. Establish authentication, church tenancy, role authorization, database migrations, and automated tenant-isolation tests.
3. Configure department elections with ordered positions and opening counts. The local setup slice is complete; re-enable it for production after the identity and tenant foundation is in place.
4. Implement president-configured rounds, ballot submission, and separated participation tracking with duplicate protection.
5. Implement close/reveal, aggregate results, candidate progression, and audit history.
6. Build the visual election history and complete the responsive/mobile accessibility pass.

The proposed architecture and the guest voting/poll lifecycle policies listed above are approved. Resolve production admin identity, device-profile limitations, voter-group sizing, report specifics, nomination operations, voting-close consensus, and operations before implementing dependent functionality.

## Next work to start

1. **Start now: resolve remaining implementation details.** The modular-monolith architecture, open admin self-registration, creator-as-initial-church-admin rule, `My churches` view, one annual election board per church in the POC, named attendance by dated session, shared anonymous nomination links, per-profile edits while nomination intake is open, committee-set per-intake name limit, two roles (`admin`, `guest`), poll edit/close lifecycle, withdrawal timing, cutoff override/reopen, per-round reveal, and church-user ballot privacy boundary are approved. Resolve the production identity provider and account lifecycle, church profile and multi-church rules, attendance correction/audit policy, browser-profile token limitations, group sizing/late arrivals, report audience/content/export/retention, nomination operational needs, voting-close consensus, and operations. Production onboarding remains deferred until production-release preparation.
2. **Can run as bounded discovery: member-directory integration.** Identify the system of record, access mechanism, authorization, matching/correction policy, and refresh cadence. Keep manual nomination usable and do not implement integration until separately approved.
3. **Deferred until production-release preparation: admin onboarding and church setup.** Implement the ordered account registration, church registration, election-board registration, and tenant authorization stories above after their open policies are resolved. Guest voters remain account-free and use active-poll links.
4. **Next P0 story: configure a voting round.** Position-scoped anonymous nomination intake and manual consolidation are implemented; the next dependency is selecting candidates from the confirmed snapshot and setting the ballot selection count. The consensus rule for closing a voting round still needs definition before ballot closure is implemented.

The P0 election setup story is complete for the local configured-church development scope. Production identity and tenant security remain incomplete, and no end-to-end election workflow is complete.