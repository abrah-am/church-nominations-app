# MVP Backlog (Draft)

**Status:** Proposed; items are not implementation authorization.  
**Prerequisite:** Proposed architecture is approved. POC identity uses locally managed email/password accounts. Production identity hardening, automated password recovery, report specification, device-profile implementation, and operations must be resolved before production release.
**Last updated:** 2026-10-16

## Implementation status

- **Completed: local application foundation.** React + TypeScript/Vite frontend, Java 25/Spring Boot API, Gradle 9.1 wrapper, API health endpoint, frontend API connection state, and local CORS configuration are implemented. Validation: API tests 2/2 passed; frontend tests 4/4 passed; frontend production build and API boot JAR succeeded; browser check confirmed the frontend reports `API connected` against the running API.
- **Implemented local POC workflow:** Local account registration and church onboarding; annual boards and attendance; department election setup; anonymous nomination intake and consolidation; authenticated live intake updates; private ballot submission and replacement; draft/active/closed round lifecycle, expected-voter cutoff and reopen; per-round result reveal, ranked display, and candidate decisions. This is a development baseline, not production readiness. Verify specific stories and tests before relying on this summary.
- **Remaining MVP/product work:** Cross-epic admin workflow clarity and recovery, explicit lifecycle/progress states, full election history, accessibility validation, report specification and implementation, production identity/security/operations, and any remaining ballot/privacy policy decisions. The complete end-to-end workflow and all acceptance criteria are not yet signed off.
- **Lint note:** frontend lint completes with one existing non-null assertion warning in `apps/web/src/main.tsx`.

Status labels below reflect implementation evidence only. “Blocked” means implementation must wait for the approval prerequisite above; it does not mean the story is complete.

## MVP outcome

An administrator can register an account and church, establish the church's annual election board, set up a department election with multiple positions and opening counts, collect committee nominations through shareable links/QR codes, consolidate nominee names, run president-configured private voting rounds, and present a visual history of all rounds and elected outcomes without revealing voter-to-choice mappings.

## Product decisions blocking final acceptance criteria

- Production identity provider/hardening, account verification and account lifecycle, and automated password recovery (required before production release; not needed for the local POC).
- Church profile fields beyond name; the POC enforces one admin per church and one church per admin.
- Board-session attendance correction/audit policy; the POC uses session dates and replaces the attended-member set when attendance is saved.
- Device-profile implementation for same-device repeat prevention and choice editing, including cleared browser storage/device switching.
- Attendance changes during voting: the expected voter count confirmed at poll start remains fixed; a person arriving at the meeting may vote while the poll is active, and a person leaving votes before leaving. If the `N - 1` cutoff has already closed the poll, an authorized admin must reopen it before a late arrival can vote.
- Nomination operational requirements. Nomination link access/edit policy is set for the POC below; nomination submitters use no separate third application role. An authorized admin may close a poll; no separate committee-consensus step is required.
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
**Implementation status:** Partial for the local POC. Email/password accounts are authenticated with BCrypt-backed HTTP Basic in the `dev` profile. Church creation assigns one admin account to one church, and election/board/nomination/ballot operations resolve church scope from that account; cross-church reads/writes are denied on covered routes. Registration and business routes fail closed outside `dev`. Automated tests cover registration, password hashing, church assignment, election isolation, and non-dev denial. Production identity/transport hardening, password recovery, report routes, and tenant coverage for future endpoints remain incomplete.

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

**Story:** As an administrator, I can consolidate nomination submissions into a unique candidate list and use it as the first voting-round roster.
**Implementation status:** Implemented for the local POC. Admins review anonymous proposed names, correct or merge duplicates explicitly in the saved snapshot, then the entire consolidated list is used as round one's roster. Admins no longer select the same names a second time. Before creating a draft round, the admin can return to edit the snapshot; consolidation is locked after a draft/active round exists.

**Acceptance criteria:**
- The admin can inspect submitted names and correct spellings or merge duplicates with explicit confirmation.
- The system may flag likely duplicates but never silently merges distinct people.
- The admin explicitly confirms the final consolidated names; no source-device data is exposed or used to merge.
- The consolidated nomination outcome is retained and is the complete round-one roster.
- Before a draft round is created, the admin can return to the consolidation editor without losing the saved names; the interface explains that creating a draft locks the snapshot.
- Later-round rosters contain candidates marked Advanced in the preceding revealed round; excluded candidates are not silently included.

### P0: Configure a voting round

**Story:** As the president or authorized administrator, I can choose the ballot selection count and candidate roster for each round.
**Implementation status:** Implemented for the local POC. The consolidated snapshot supplies the complete round-one roster; candidates marked Advanced in the prior revealed round supply subsequent rosters. The admin configures a valid exact selection count. Follow-up UX and draft correction work is tracked under Epics E2/E3.

**Acceptance criteria:**
- The authorized operator sets the exact number of distinct candidate selections for each round; the application imposes no fixed progression or default rule beyond valid input bounds.
- After viewing revealed results, the operator records candidate decisions; candidates marked Advanced are used for the next round. The application does not ask the operator to select the same roster again.
- Ballots require exactly the configured number of distinct selections; incomplete and duplicate selections cannot be submitted.
- Poll candidate configuration is editable before voting starts and locked while active; withdrawal is allowed only before start or after closure.

### P0: Cast a private ballot

**Story:** As an eligible voter, I can submit one valid ballot from my phone without exposing my choices to other users.
**Implementation status:** Implemented for the local POC. Guest ballots load by active poll link, require exactly the configured number of distinct choices, and allow the same browser profile to replace its ballot while active. Device-profile behavior remains a limitation and production policy item; responsive/accessibility validation is tracked under E4/E7.

**Acceptance criteria:**
- Only a guest possessing a valid non-expiring voting link can access an active poll; the route returns 404 when no poll is active. Voter sign-in is not required.
- A ballot cannot select the same candidate more than once and obeys the configured selection-count rule.
- The system suggests a strict majority when a candidate is selected by more than half of ballots cast (for example, 9 of 17); for a single opening, the administrator/committee decides whether a candidate stays, advances, or is elected.
- For multiple openings, candidates who reach strict majority in a poll are elected automatically, up to the configured seat count. If more candidates qualify than openings remain, eliminate the other candidates and run one-choice rounds among the majority-qualified candidates. If nobody has a majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh totals until the remaining openings are filled.
- In a two-candidate, one-selection round with an even-sized group `N`, the round automatically closes after `N - 1` ballots have been submitted; for 14 voters, close after 13. For 17 voters, all 17 may vote.
- The expected voter count is confirmed at poll start and remains fixed. A meeting arrival may vote while the poll remains active; an attendee who must leave votes before leaving. If the automatic cutoff has closed the poll, an authorized administrator reopens it before a late arrival can vote.
- An administrator may close other rounds; totals remain hidden until result reveal.
- Tie-break rounds use a fresh tally starting at zero. If tied candidates are resolved, a subsequent round against a prior leader also starts at zero.
- An opaque browser-profile token cannot create a second ballot for the same poll, but may edit/replace its choice while active. This cannot guarantee a one-ballot-per-person or physical-device limit if browser data is cleared or another profile/device is used; token storage and recovery must be designed.
- The ballot-choice record has no voter identity reference; a separate participation record lets the administrator see completion status.
- API responses and UI do not show live candidate totals while the round is open.
- Errors and logs do not include ballot choices or credentials.

### P0: Close and reveal a round

**Story:** As an administrator, I can close a round and reveal its aggregate results after voting is complete.
**Implementation status:** Implemented for the local POC. Admins can monitor profile/link ballot progress without live totals, close a round, reopen under the override rule, reveal aggregate results after closure, and record candidate decisions. The complete election history and lifecycle status presentation remain follow-up work under E1/E5/E6.

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

## Follow-up Epics: Admin Workflow and Production Readiness

The following stories decompose the proposed epics into assignable slices. Status refers to the current local POC baseline; the tech lead should confirm status against the current branch before assigning. Stories marked **Discovery/blocker** require a Product Owner decision before implementation. Suggested owners are role recommendations, not assignments.

### Epic E1: Election and Position Progress

**Outcome:** An administrator can identify the state of an election and each position, and see the next useful action.

**Baseline:** Election list/detail currently labels elections `Setup`; the detail has sequential Previous/Next position controls but no per-position workflow state.

**Story E1.1: Show meaningful election lifecycle status.** As a church administrator, I want each election to show its current lifecycle state so I can tell whether it needs setup, nominations, voting, or final review.
**Suggested owners:** Product/tech lead, backend, frontend, QA.
**Acceptance criteria:**
- Define and document election-level statuses and transition rules before implementation.
- Election list and detail show the same derived status using text, not color alone.
- Status reflects its positions and does not say `Setup` once any position has progressed beyond setup.
- API authorization and tenant scoping remain enforced; tests cover each status transition and cross-tenant reads.

**Story E1.2: Show position progress and next action.** As an administrator, I want position navigation to show each position's progress so I can move through the election without opening every position to discover its state.
**Suggested owners:** UX, frontend, backend, QA.
**Acceptance criteria:**
- Each position shows its name, opening count, current state, and a concise next action or completed label.
- Previous/Next continues to respect configured sequence and disabled boundaries.
- Changing position does not silently reset any persisted position data.
- The selected position and its state are programmatically announced and keyboard operable.

**Story E1.3: Remove contradictory election setup notice.** As an administrator, I want contextual guidance for the selected position so the page does not say voting is unavailable when a round is active or results are ready.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Replace the generic persistent notice with state-specific guidance.
- Guidance matches available actions for setup, open intake, consolidation, draft, active, closed-unrevealed, revealed, and complete states.
- No notice contradicts the actual API-enforced state.

### Epic E2: Nomination Workflow Clarity and Recovery

**Outcome:** Admins can collect, close, refine, and confirm nominations without losing work or encountering surprising transitions.

**Baseline:** Intake create/share/live updates/close and consolidation editor/snapshot are implemented. The editor removes exact duplicate entries on save. The API does not permit editing consolidation once a draft or active round exists.

**Story E2.1: Make intake states and closure consequences clear.** As an administrator, I want to see whether intake is open or closed and what closing it does so I can operate the nomination window confidently.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Show intake state, submission count, configured name limit, and whether the public link is usable.
- Closing nominations has a clear label and confirmation only if required by the approved UX policy; after success, show that submissions are read-only and consolidation is next.
- Empty submissions have an explicit state and a clear next action.
- Updates and closure are announced accessibly; no submitter/device identity is displayed.

**Story E2.2: Preserve consolidation drafts on failure and navigation.** As an administrator, I want my edited candidate list preserved if saving fails so I can recover without redoing cleanup.
**Suggested owners:** Frontend, QA.
**Acceptance criteria:**
- A failed save preserves the current textarea content and returns focus or directs the admin to the error.
- Duplicate cleanup and validation results are explained before or after saving; distinct variants are never silently merged.
- Confirmation is invalidated when the candidate text changes and must be reselected before saving.
- Tests cover server failure, empty list, duplicate exact names, and corrected text.

**Story E2.3: Explain the roster lock and provide a pre-draft edit path.** As an administrator, I want to know when the consolidated roster becomes locked so I can finish cleanup before creating the first draft.
**Suggested owners:** UX, frontend, backend, QA.
**Acceptance criteria:**
- Before draft creation, clearly state that draft creation locks consolidation.
- The pre-draft edit action restores the last saved names into the editor and allows correction/removal.
- If an edit attempt is blocked by server state, explain why and preserve user-entered content.
- The admin can cancel editing without losing the saved snapshot.

**Story E2.4: Decide correction behavior after draft creation.** **Discovery/blocker.** As an election administrator, I need an approved recovery policy for an incorrect roster after a draft exists.
**Suggested owners:** Product Owner, tech lead, backend.
**Acceptance criteria:**
- Decide whether an unstarted draft may be cancelled and rebuilt, whether edits are supported in place, or whether correction requires another controlled action.
- Define audit requirements and behavior once any poll has started.
- Do not implement a path that changes an active poll's roster.

### Epic E3: Round Setup and Candidate Roster

**Outcome:** Round rosters and selection counts are easy to understand and valid for each poll.

**Baseline:** Round one uses the full consolidated snapshot. Later rounds use candidates marked Advanced. Selection count is configurable; the duplicate name picker has been removed.

**Story E3.1: Clarify roster source and valid selection count.** As an authorized administrator, I want to see where the current roster came from and the valid selection-count range so I can configure a round correctly.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Round one is labeled as using the saved consolidated roster; later rounds identify the preceding round as their source.
- Display candidate count and require an integer selection count from one through that count.
- Validation errors state the valid range and preserve the entered value.
- The roster and selection count are visible before saving or starting a draft.

**Story E3.2: Preview the next-round roster from saved decisions.** As an administrator, I want to review which candidates will carry forward before I create the next draft.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Preview includes only candidates marked Advanced in the preceding revealed round.
- Candidates marked Eliminated or Elected are visibly excluded, with no implication that votes alone automatically decide a single-opening outcome.
- Changes to saved decisions refresh the preview consistently.

**Story E3.3: Implement the approved draft correction policy.** **Blocked by E2.4.** As an administrator, I want to correct an unstarted draft roster according to the approved policy.
**Suggested owners:** Backend, frontend, QA.
**Acceptance criteria:**
- Implement only the correction path approved in E2.4.
- Preserve audit history and validate candidate/selection-count constraints on the server.
- Active-round rosters remain immutable.

### Epic E4: Ballot Operations

**Outcome:** Admins can start and operate polls confidently, and guests can submit or replace a ballot on mobile.

**Baseline:** Private ballot links, exact selection enforcement, ballot replacement, progress, expected voter count, the two-candidate even-count cutoff warning, manual close, and reopen controls are implemented in the local POC.

**Story E4.1: Explain expected voter count and cutoff before start.** As an administrator, I want the start confirmation to explain the fixed expected count and any automatic cutoff so I know what happens after starting.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Explain that the value is an operational expected count, not a verified attendance list, and that it is fixed for the active round.
- For the applicable two-candidate, one-selection, even-count case, show the exact `N - 1` cutoff.
- Changing the count updates the warning; invalid counts cannot start a round.
- Cancel leaves the round as a draft and preserves the configured count.

**Story E4.2: Make ballot progress and lifecycle actions scannable.** As an administrator, I want active, closed, and reopened round states to be obvious so I can act without confusing progress with vote totals.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Active round displays ballots received versus expected, clearly qualified as profile/link submissions rather than verified people.
- Active rounds do not display totals, candidate ranking, or choice information.
- Close, reopen, and reset actions and their outcomes are clearly distinguished and accessible. Reopen resumes the same round and retains its ballots; reset starts a fresh voting attempt and invalidates the prior attempt.
- After reopen, stale revealed results are not shown as current results.

**Story E4.5: Reset a closed voting round and start a fresh attempt.** As an authorized administrator, I want to reset a closed round when its voting attempt must be discarded, so voting can restart from zero with a newly configured selection count and expected voter count.
**Suggested owners:** Product/tech lead, backend, frontend, QA.
**Acceptance criteria:**
- Reset is a distinct action from **Reopen voting** and is available only for a closed round when no later round has started. Active rounds cannot be reset; the admin must close them first.
- Before reset, show a confirmation naming the round and warning that the current ballot count and revealed results (if any) will be voided and excluded from election decisions. Require explicit confirmation; cancel leaves the round unchanged.
- On confirmation, mark the prior voting attempt as reset/voided so its ballots and results cannot be used for current or future election decisions. Retain an audit event with actor, timestamp, round, and reset reason if provided; do not include ballot choices in that audit event. Physical ballot-data deletion versus restricted retention follows the approved retention policy.
- Preserve the closed round's candidate roster as the starting roster for a fresh draft. Require the admin to configure the allowed selections and expected voter count again before starting; the new attempt begins with zero ballots and no prior tally or participation count.
- Preserve the prior attempt's reset/voided status in history and clearly distinguish it from a normal closed/revealed round. A reset attempt cannot be reopened as though its old ballots remain valid.
- If a later round has already started, prevent reset and explain that the round is referenced by later election activity; do not silently reset or cascade-delete later rounds.
- Tests cover authorization, active-round rejection, cancel, successful reset, zeroed progress/results, fresh configuration, audit/history, and rejection when a later round has started.

**Product decision before implementation:** Confirm whether reset should be allowed after a round has been revealed but before any subsequent round starts. This story assumes yes, with the revealed result marked void and unavailable for decisions. Confirm the retention policy that governs whether superseded ballot records are physically deleted or kept under restricted retention while remaining excluded from all election reporting.

**Story E4.3: Improve guest ballot mobile and recovery states.** As a guest voter, I want to understand how many candidates to select and whether my ballot was saved or replaced.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Ballot shows position, selection count, clear privacy wording, and progress toward the exact required number of choices.
- Submit/replace remains unavailable until the exact count is selected; prior choices are restored when the same profile returns.
- Loading, inactive, save success, and save failure states are distinguishable and announced accessibly.
- Layout and controls remain usable at mobile viewport sizes and by keyboard.

**Story E4.4: Document and validate device-profile limitations.** **Discovery/blocker for production policy.**
**Suggested owners:** Product Owner, security, backend, QA.
**Acceptance criteria:**
- Decide the intended browser-profile token lifetime, storage, recovery, and cleared-storage behavior.
- UI and documentation do not claim one ballot per real-world person or physical device.
- Validate authorization, tenant scoping, duplicate ballot behavior, and replacement access server-side.

### Epic E5: Results Review and Candidate Decisions

**Outcome:** Admins can assess ranked aggregate results and record decisions with a clear audit trail.

**Baseline:** Revealed results are sorted by votes descending and name ascending. Admins can record Advanced, Eliminated, or Elected decisions with an optional reason; recommendations are guidance, not automatic single-opening decisions.

**Story E5.1: Make result rankings and recommendations easy to scan.** As an administrator, I want vote totals, rankings, and recommendations presented consistently so I can review outcomes efficiently.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Results remain sorted by votes descending, then candidate name A–Z for ties.
- Each candidate row associates name, vote total, recommendation, current decision, and decision controls.
- Recommendations are explicitly labeled as suggestions and are not saved automatically.
- Aggregate display reveals no voter names or candidate selections by voter.

**Story E5.2: Show unsaved and failed candidate decisions.** As an administrator, I want to know which decisions are saved so I can complete result review without uncertainty.
**Suggested owners:** Frontend, backend, QA.
**Acceptance criteria:**
- Draft decision changes are distinguishable from persisted decisions.
- Save success/failure is associated with the candidate; failures preserve selected decision and reason.
- A decision is not treated as saved until the API confirms it.
- Decision actor/time/reason follow the approved audit policy without linking a ballot to a voter.

**Story E5.3: Provide a reviewed-results handoff to the next round.** As an administrator, I want to see the number and names of candidates advancing before configuring the next round.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- After decisions are saved, show the Advanced roster and clearly indicate whether another round can be configured.
- If no candidates advance, explain the state and available resolution instead of presenting an unusable setup form.
- Selection-count bounds use the previewed next-round roster.

### Epic E6: Election Completion and History

**Outcome:** Administrators can identify completed positions/elections and later review how each outcome was reached.

**Story E6.1: Define completion states and transition rules.** **Discovery/blocker.**
**Suggested owners:** Product Owner, tech lead, backend.
**Acceptance criteria:**
- Define when a position is complete for one or multiple openings, including unresolved ties, withdrawals, and no-advancement cases.
- Define election-level completion from its positions.
- Specify which states are user-visible and which actions remain available after completion.

**Story E6.2: Show completion status in election and position lists.** As an administrator, I want to see which positions are complete and which need action.
**Suggested owners:** UX, frontend, backend, QA.
**Acceptance criteria:**
- Election and position status derive from persisted workflow state and follow E6.1.
- Status uses text and does not rely on color alone.
- Lists expose a useful next action for incomplete positions and a clear completed state for finished ones.

**Story E6.3: Build navigable position history.** As an authorized church administrator, I want to inspect the full history of a position's nominations and rounds.
**Suggested owners:** UX, frontend, backend, QA.
**Acceptance criteria:**
- History includes intake outcome, consolidated roster, each round's roster and revealed aggregate totals, candidate decisions, and elected outcomes.
- Round chronology and candidate progression are understandable without exposing ballot-level choices.
- Historical views are tenant-scoped and use only approved report audiences/fields.

**Story E6.4: Define historical result/report access.** **Discovery/blocker.**
**Suggested owners:** Product Owner, tech lead, security.
**Acceptance criteria:**
- Decide which of `admin` and `guest` may access revealed results and history.
- Decide visible participation fields, exports, and retention period.
- Record privacy constraints and acceptance criteria before implementing exports or public history.

### Epic E7: Accessibility and Responsive Administration

**Outcome:** Admin and guest workflows work across mobile, keyboard, and assistive technology.

**Story E7.1: Approve accessibility target and test approach.** **Discovery/decision.**
**Suggested owners:** Product Owner, UX, QA.
**Acceptance criteria:**
- Approve a conformance target and supported browser/device matrix.
- Define automated and manual test expectations, including keyboard and screen-reader coverage.

**Story E7.2: Audit and repair workflow semantics and keyboard access.** As an administrator or voter using assistive technology, I want controls and status changes announced clearly.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Headings, form labels, list semantics, disclosure expanded state, and dialog names/descriptions are programmatically exposed.
- All actions are keyboard reachable with visible focus and logical order.
- Async status and validation messages are announced without unexpected focus movement.
- Automated accessibility checks cover the principal admin and guest flows; manual findings are recorded and resolved against the approved target.

**Story E7.3: Validate responsive layouts for core workflows.** As an administrator or voter on a phone, I want to complete core actions without horizontal scrolling or cramped controls.
**Suggested owners:** UX, frontend, QA.
**Acceptance criteria:**
- Test nomination, consolidation, round setup, results decisions, dialogs, and ballot submission at agreed mobile widths.
- No content or action is obscured, overlapping, or dependent on hover.
- Candidate names and vote counts remain associated at narrow widths; touch targets meet the approved standard.

### Epic E8: Privacy, Audit, and Production Readiness

**Outcome:** Privacy claims, audit behavior, tenant controls, and production operations match approved policies.

**Story E8.1: Resolve production identity and account lifecycle.** **Discovery/blocker for production.**
**Suggested owners:** Product Owner, security, backend, operations.
**Acceptance criteria:**
- Select production identity provider and define email verification, account lifecycle, admin recovery, and session/token policy.
- Retain the local POC behavior only for local development; document the deployment boundary and required transport protections.

**Story E8.2: Define privacy, participation, and retention policy.** **Discovery/blocker.**
**Suggested owners:** Product Owner, security, legal/privacy, backend.
**Acceptance criteria:**
- Decide nomination submission retention/correction behavior and ballot/device-token retention.
- Define what participation status admins may see and ensure it cannot be joined to candidate choices.
- Document the privacy boundary: confidentiality from church users, not unlinkability from system operators or metadata correlation.

**Story E8.3: Complete tenant and privacy security verification.** As a church administrator and voter, I want tenant boundaries and ballot confidentiality enforced server-side.
**Suggested owners:** Backend, security, QA.
**Acceptance criteria:**
- Every tenant-owned admin endpoint checks church authorization server-side.
- Guest endpoints validate active scoped links; unauthorized and inactive access follows the approved response policy.
- Tests cover cross-tenant reads/writes, ballot replacement authorization, no live totals, and absence of voter-to-choice exposure.
- Logs and audit events exclude credentials and ballot selections.

**Story E8.4: Define operational readiness and recovery.** **Discovery/blocker for production.**
**Suggested owners:** Product Owner, operations, backend.
**Acceptance criteria:**
- Decide expected scale, availability, backup/restore objectives, hosting region, and incident ownership.
- Specify how election data and audit history are backed up and restored.
- No production-readiness claim is made until operational checks are documented and tested.

## Suggested delivery order

1. **Assignable now:** E1.2, E1.3, E2.1, E2.2, E2.3, E3.1, E3.2, E4.1, E4.2, E4.3, E5.1, E5.2, E5.3, E7.2, E7.3. Confirm these stories against the current branch before assignment because the POC is evolving.
2. **Product/tech-lead discovery first:** E1.1, E2.4, E6.1, E6.4, E7.1, E8.1, E8.2, E8.4.
3. **After decisions:** E3.3, E6.2, E6.3, E8.3. Security verification can begin as a test inventory before the policies are finalized.

## Story ownership guidance

- **Frontend:** state labels, progress navigation, warning copy, recovery affordances, result-review ergonomics, responsive layouts, and accessible interactions.
- **Backend:** persisted lifecycle derivation, draft correction policy, authorization, history/query support, and audit/privacy enforcement.
- **UX:** status model and information hierarchy, error/recovery paths, mobile interaction details, result-review layout, and accessibility review.
- **QA:** acceptance-test matrix across workflow states, mobile/keyboard checks, tenant/privacy regression tests, and end-to-end position history.
- **Product Owner/tech lead:** decisions marked discovery/blocker; confirm acceptance criteria and dependencies before assigning implementation.

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
3. Confirm the current POC baseline, then deliver admin lifecycle/progress, nomination recovery, and roster/draft-lock clarity stories (Epics E1-E3).
4. Harden ballot operation and result-decision interactions, including mobile and accessibility validation (Epics E4, E5, E7).
5. Agree completion semantics and report/history audience; then build the navigable election history (Epic E6).
6. Complete production identity, privacy, tenant-security, audit, and operations decisions and implementation before production release (Epic E8).

The proposed architecture and the guest voting/poll lifecycle policies listed above are approved. Resolve production admin identity, device-profile limitations, report specifics, nomination operations, and operations before implementing dependent functionality.

## Next work to start

1. **Start now: resolve remaining implementation details.** The modular-monolith architecture, open admin self-registration, creator-as-initial-church-admin rule, `My churches` view, one annual election board per church in the POC, named attendance by dated session, shared anonymous nomination links, per-profile edits while nomination intake is open, committee-set per-intake name limit, two roles (`admin`, `guest`), poll edit/close lifecycle, administrator close authority, expected voter-count confirmation at start, fixed expected count during the poll, meeting arrivals voting while the poll is active, departing attendees voting before leaving, even-group `N - 1` warning/cutoff, cutoff override/reopen, per-round reveal, and church-user ballot privacy boundary are approved. Resolve the production identity provider and account lifecycle, church profile and multi-church rules, attendance correction/audit policy, browser-profile token limitations, report audience/content/export/retention, nomination operational needs, and operations. Production onboarding remains deferred until production-release preparation.
2. **Can run as bounded discovery: member-directory integration.** Identify the system of record, access mechanism, authorization, matching/correction policy, and refresh cadence. Keep manual nomination usable and do not implement integration until separately approved.
3. **Deferred until production-release preparation: admin onboarding and church setup.** Implement the ordered account registration, church registration, election-board registration, and tenant authorization stories above after their open policies are resolved. Guest voters remain account-free and use active-poll links.
4. **Next work: admin workflow usability and product-policy resolution.** Ballot submission, expected-voter confirmation/cutoff, close/reopen, result reveal, and candidate decisions are implemented in the local POC. Follow-up stories are listed under Epics E1-E8; confirm their status against the current branch and resolve the marked Product Owner decisions before assigning dependent production work.

The election setup and main nomination-to-ballot-to-result paths are implemented for the local POC. Production identity and security remain incomplete, and the end-to-end workflow still needs product acceptance, history/status work, accessibility validation, and operational readiness before the MVP can be considered complete.