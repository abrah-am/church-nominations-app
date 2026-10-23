# Product Requirements (Draft)

**Status:** Discovery draft; not approved for implementation.  
**Product:** Church nominations and elections  
**Last updated:** 2026-10-16

## Purpose

Provide churches with a private, auditable way to propose nominees, run multi-round elections for church positions, retain historical records, and present election results. The application replaces a manual voting-board process while preserving transparency about aggregate outcomes without revealing how an individual voted.

## Users and roles

- **Church administrator:** Sets up elections and rounds, maintains participant and candidate lists, monitors participation, closes voting, reveals results, and prepares reports.
- **Election board:** The church committee responsible for proposing people for positions and participating in their election. A church typically has one board per year; membership changes annually. Named board-member records support attendance tracking, not account authentication.
- **Guest voter:** A person accessing a ballot without creating an account or signing in. Possession of a valid voting link grants access; the system does not establish the guest's real-world identity. Guest identity is not shown to church users, and guests must not see live totals or another guest's choices. The exact link issuance and one-use policy remains to be decided.
- **Nomination submitter:** Anyone with a position-scoped shared nomination link can submit proposed names without signing in. Each browser profile can revise its own names while intake is open. Administrators see proposed names without submitter or device identity. The committee agrees the per-person maximum and the administrator sets it for each intake.
- **Church tenant:** Each church has its own account/data boundary. A church must not access another church's elections, participants, ballots, or reports.

**Approved MVP decisions (2026-10-16):** Anyone may self-register an administrator application account. For the local POC, email is the username, passwords are locally validated and BCrypt-hashed in PostgreSQL, and HTTP Basic authentication is enabled only in the `dev` profile. Creating a church makes the registering administrator its sole admin; each admin may administer one church. The administrator has a `My churches` view. Automated email/password recovery is not part of the POC because no mail service is configured; the production recovery policy remains open. A church typically has one election board per year; the board proposes candidates for positions and participates in electing them, and prior-year membership history is retained when the board changes. Named board-member records are maintained for attendance by session, but board members do not need application accounts or passwords to participate. They use the guest nomination and voting link flows; attendance is stored separately and is never connected to ballot participation or selections. The production identity provider and the board-session fields and multiple-board exceptions remain undecided. The only application roles are `admin` and `guest`. Voters are guests: they do not need accounts or sign in, must receive a voting link, and are anonymous to church users. Links do not expire, but return HTTP 404 whenever there is no active poll for that link. A browser/device profile must be prevented from submitting twice to the same poll, but may edit or replace its choice while that poll is active. Poll setup (roster and candidates) is editable before voting starts and locked during the active poll. When voting completes, the poll closes; candidates are then marked eliminated or promoted into the next round. Candidate withdrawal is allowed before a poll starts or after it ends, but not while it is active. An administrator may override the two-candidate cutoff and reopen a poll. Results are revealed per round after closure. The approved privacy boundary is confidentiality from church users, not system operators or metadata correlation. The architecture is approved as proposed, subject to these decisions. Reports are approved in principle, but their audience, contents, export, and retention are not specified by the response yet.

## Church onboarding and board setup

1. Anyone can create an administrator application account without an invitation using an email address and password. Account creation alone does not grant access to church data.
2. An authenticated administrator registers a church and becomes its sole administrator. For the POC, each account administers one church. The administrator can view that church in `My churches`.
3. For each year, an authorized church administrator registers the church's election board. The board proposes candidates for positions and participates in voting through the election workflow. A church typically has one board per year; changes to membership apply to the new year's board while prior-year records remain available as history.

For the POC, the system enforces one board per church per year and requires at least one named member. Sessions are identified by date; saving attendance replaces that session's attended-member set. The board has named members for attendance tracking. An authorized administrator records attendance for each board session; attendance does not establish whether a member cast a ballot. Board members use account-free guest links for nominations and voting, so forgetting an application password cannot delay their participation. The board roster, session attendance, and ballots are separate records, with no mapping from a named member or attendance entry to a ballot. This workflow does not add a third application role: the approved roles remain `admin` and `guest`.

## Session and presentation access policy (Product Owner decision, 2026-10-23)

- One stable, unexpired participant bearer link belongs to an election session and resolves only that session's server-authorized current nomination or voting phase. An authorized administrator can revoke it; it is unavailable after the session ends. No-active-phase, ended, revoked, and unauthorized states use a generic unavailable response. The participant link never opens admin controls, presentation controls, another session, or historical reports.
- The participant link shows no ballot totals during an active poll. A closed-unrevealed poll uses the generic inactive response. Explicit admin reveal publishes only candidate names and aggregate vote totals for the current round. Reopening removes those results as current content; a later close requires another reveal.
- Browser-profile ballot uniqueness remains once per poll, with ballot replacement allowed while that poll is active. Each successive round is a new poll. The opaque per-poll credential association remains usable while that poll may be reopened/current and is invalidated when superseded or the session ends. This is not a one-vote-per-person guarantee; credential storage/recovery and operational retention remain unresolved.
- The committee presentation is a separate read-only view opened by an authenticated admin action, optionally in a new tab. Show/hide/end is controlled independently from participant-link phase resolution. It displays the same approved aggregate snapshot; hiding or changing context clears displayed content, and reopening a poll clears current results.
- Neither surface exposes participation status, voter identity, individual ballots, recommendations, candidate decisions, or history. Historical report audience and retention remain undecided under E6.4/E8.2 and PD-006/PD-012.

## Core workflow

### Session participant link and committee presentation policy (Product Owner decision, 2026-10-23)

- One stable, unexpired participant bearer link belongs to an election session and resolves only that session's server-authorized current nomination or voting phase. The administrator can revoke it; it is unavailable after the session ends. No-active-phase, ended, expired, revoked, and unauthorized states use a generic unavailable response. The participant link never opens admin controls, presentation controls, another session, or historical reports.
- The participant link shows no ballot totals during an active poll. A closed-unrevealed poll uses the generic inactive response. An explicit admin reveal publishes only candidate names and aggregate vote totals for the current round. Reopening removes those results as current content; a later close requires another reveal.
- Browser-profile ballot uniqueness remains once per poll, with ballot replacement allowed while that poll is active. Each successive round is a new poll. The opaque per-poll credential association remains usable while that poll may be reopened/current and is invalidated when superseded or the session ends. This remains a device/profile safeguard, not person-level identity or a one-vote-per-person guarantee; storage/recovery and operational retention remain unresolved.
- The committee presentation is a separate read-only view opened by an authenticated admin action, optionally in a new browser tab. Its show/hide/end controls are independent of participant-link phase resolution. It displays the same approved aggregate snapshot; hiding or changing context clears displayed content, and reopening a poll clears its current results.
- The presentation and participant link do not expose participation status, voter identity, individual ballots, recommendations, candidate decisions, or history. Historical report audience and retention remain undecided under E6.4/E8.2 and PD-006/PD-012. Credential lifecycle remains undecided under PD-004.

1. An administrator starts an election for a department and enters the positions to fill and the number of openings for each (for example, one director and two subdirectors).
2. The workflow begins with the first position. The administrator creates an intake, sets the maximum name count agreed by the committee, and shares one position-scoped link or QR code. Anyone with the link can submit without an account. A browser profile can revise its own list while intake is open; the admin sees names but not submitter/device identity. The admin closes the intake when nominations end.
3. After nominations close, the administrator reviews submitted names, corrects spellings or manually merges duplicates/variants into a unique list, and explicitly confirms the consolidation. The system does not identify or reveal submission sources and does not silently merge names. The confirmed list is retained for selection into a voting-round roster.
4. The authorized administrator (typically the committee president) configures the number of distinct candidate selections per voter for each round. There is no fixed count or prescribed sequence; for a large list, the president may choose five selections, then three, then one in later rounds. After reviewing revealed results, the president chooses which candidates continue to the next round. Ballots must contain exactly the configured number of distinct selections. Selecting several candidates counts as one voter's ballot, not several voters.
5. Guest voters open their non-expiring link, which resolves only while its poll is active; otherwise it returns 404. A browser/device profile cannot submit twice to a poll, but can edit/replace its choice while the poll is active. The ballot payload and stored ballot-choice record do not include a guest's name.
6. Before voting starts, the administrator may edit the roster/poll setup. Once active, configuration is locked except that a guest may edit their own choice and an administrator may override/reopen the poll under the approved cutoff policy. No live totals are visible during voting. On completion/closure, the administrator reveals aggregate results for that round; candidates are then eliminated or promoted to the next round.
7. A candidate has a strict majority when selected by more than half of the ballots cast (for example, 9 of 17). For multiple openings, majority-qualified candidates are elected automatically up to the position's configured opening count. If more candidates qualify than openings remain, only those majority-qualified candidates continue into one-choice rounds; if nobody has a majority in a runoff, eliminate the lowest-vote candidate and repeat with fresh totals until the openings are filled.
8. The same nomination and voting process is then run for the next position, such as subdirector. Multiple openings for one position are filled in that position's election; different positions have separate candidate/round histories. A person may be nominated for more than one position.
9. At completion, users can view a visual history of the election: positions, nomination/consolidation outcome, each round's candidate roster and revealed aggregate results, candidate advancement/elimination, and the elected person or people for each position.

## Confirmed business rules

- An election cycle belongs to a department and contains one or more position elections. Each position has a configured number of openings (for example, one director and two subdirectors).
- Each position has its own nomination intake, candidate consolidation, voting rounds, and elected outcome. Multiple openings for one position are filled through that position's election; different positions have separate histories. A person may be nominated for multiple positions.
- A single position-specific shared nomination link/QR code can be opened by anyone without sign-in. The committee agrees the maximum names per submitter and the administrator configures that limit for each intake; there is no application-wide fixed count.
- Nominations are anonymous to administrators as to source: admins see the proposed names, not which member/device submitted them. A browser profile can replace its own submitted list while intake is open. The device-profile key supports editing and limiting only; it is not a verified person identity.
- The administrator closes nomination intake; the link is no longer usable for reading or submitting after closure. Nominations remain separate from voting ballots and ballot choices.
- Voting is guest-based for the MVP: a voter does not create an account or sign in and must receive a voting link to access the ballot. Guest identity is not exposed to church users.
- The MVP has two application roles: `admin` and `guest`; there is no separate report-viewer role.
- Anyone may self-register an application account; creating a church grants the creator initial administrator membership for that church.
- Local POC sign-in uses the account email as username and password verification through database-backed BCrypt credentials in the `dev` profile. Email-based password reset is unavailable until a mail service is selected and configured.
- Each POC admin account belongs to one church, and each church has one admin; authorized election operations derive church scope from the authenticated account.
- Administrators can view their church through a `My churches` view.
- An election board is the church committee that proposes candidates and participates in electing them. A church typically has one board per year, with prior-year board membership retained as history.
- Board members are stored as named roster entries for committee attendance, not as application accounts. Attendance is recorded per board session and is not inferred from voting.
- Board members use guest nomination and voting links without signing in or entering a password. Named attendance and board-member records are never associated with a ballot or ballot selections.
- Voting links do not expire. A link returns 404 when no poll is active for it and resolves to the active poll otherwise.
- A browser/device profile is limited to one ballot submission per poll but can edit/replace its ballot while the poll is active. This is a device/profile-level safeguard, not proof of one vote per real-world person; clearing browser data or using another profile/device may bypass it.
- Poll roster and candidate setup are editable before voting starts and locked while active. Candidate withdrawal is allowed before start or after the poll ends, not during active voting.
- When a poll is complete, it closes and candidates are marked eliminated or promoted to the next round. Results are revealed per round after closure. An administrator may override the two-candidate cutoff and reopen the poll.
- The administrator consolidates duplicate or variant names with human confirmation and promotes the resulting unique names into the round roster.
- The authorized election administrator (typically the president) sets the exact selection count independently for each round. The application does not prescribe a fixed count or sequence; the setting must be valid for the round's candidate list.
- The president/authorized administrator sets each round's selection count and interprets results to configure the next-round candidate roster, subject to the confirmed majority and multi-opening election rules.
- A ballot must contain exactly the configured number of distinct candidates; duplicate selections are invalid, and an incomplete ballot cannot be submitted.
- The number of selections is not fixed across elections; it depends on the candidate-list size and is configured for each round. For example, a five-candidate list may use a one-selection ballot.
- Each submitted ballot represents one use of a valid guest voting link. In a multi-selection ballot, each selected candidate receives one selection from that ballot; selections do not multiply the number of ballots. At most one accepted ballot per link can be enforced. A one-ballot-per-real-world-person guarantee is only possible if the approved policy uses individual, non-shareable links; the system cannot technically prevent link sharing.
- A candidate has a suggested strict majority if selected on more than half of ballots cast (for example, 9 of 17). For a single opening, the system advises and the administrator/committee controls the outcome. For multiple openings, candidates who reach strict majority in a poll are elected automatically, subject to the hard cap on openings. If too many candidates qualify in one poll, eliminate the other candidates and use repeated one-choice rounds among the qualified candidates; when no candidate has majority in a runoff, eliminate the lowest-vote candidate and repeat with a fresh tally until all openings are filled.
- When an administrator starts a round, the application asks them to confirm the expected voter count, preserving the previously entered value when available. That count is fixed for the active round and is not adjusted for attendance changes. A person arriving at the meeting after voting starts may vote in the current poll while it remains active; a person who must leave votes before leaving. For a two-candidate, one-selection round with an even-sized group `N`, warn before start that voting will automatically close after `N - 1` ballots (for example, 15 of 16). If the cutoff has already closed the poll before a late arrival can vote, an authorized administrator must reopen it first. An administrator may also close the round manually.
- Tied candidates may be voted on in a separate tie-break round. A tie-break winner may then enter a new round against the prior round's leader. Every new round begins with zero votes; prior tallies are not carried forward.
- Candidate elimination, advancement, and election decisions are controlled by the administrator/committee and recorded.
- The election is complete when the required number of candidates has been elected; each elected candidate and the round in which they qualified are recorded.
- Candidate names are locked when a poll becomes active. Candidate withdrawal is allowed before voting starts or after the poll ends, but not while voting is active.
- The completed election has a visual, reviewable history showing nomination consolidation, all voting rounds and aggregate results, candidate progression, and elected outcomes per position.
- Ballot submissions contain no voter name, and stored ballot choices are separate from named participation status. Administrators may see participation status but must not see which candidates a voter selected. This is confidentiality from church users, not a promise of unlinkability from system operators.
- No live results are shown while a round is open. An administrator reveals aggregate results after closing the round.
- Historical rounds and audit information are required for transparency.
- Each church is a separate tenant. Users of one church cannot see another church's process or data.
- Mobile access is required for participating voters.
- An active-member directory integration is a possible future aid to selecting and normalizing candidate names, not a confirmed MVP integration.

## Functional requirements

- **FR-1 Tenant isolation:** Each church has an isolated account and its users can access only that church's data.
- **FR-2 Role-based access:** Enforce the two MVP roles `admin` and `guest`. Guests access ballots through received links without accounts or sign-in. Report visibility must use one of these roles; the exact report audience remains to be specified.
- **FR-3 Election setup:** Create a department election containing ordered position elections, each with an opening count, nomination list, eligible voter list, and configurable rounds.
- **FR-16 Department election setup:** Create an election for a department with multiple positions, each having a configured number of openings; process positions independently in sequence.
- **FR-17 Nomination intake:** Generate a shared link/QR code scoped to a position; accept the committee-agreed, administrator-configured maximum number of names per browser profile without sign-in. Allow that profile to replace its submitted list while intake is open. Admin views expose names without submitter/device identity. Closing intake disables the public link.
- **FR-18 Nominee consolidation:** Allow an administrator to review anonymous proposed names, edit spellings, manually merge duplicates/variants with explicit confirmation, and save a unique consolidated snapshot. Candidate selection/promotion into a round roster is handled during round configuration.
- **FR-19 Visual election history:** Present all positions and their nomination outcome, rounds, revealed aggregate results, candidate changes, and elected person/people in a navigable visual summary.
- **FR-15 Multiple openings:** Allow an election to specify the number of people required for one office and track elected candidates across rounds until that number is reached.
- **FR-20 Admin registration:** In the local POC, allow anyone to create an administrator account using an email and password without invitation. Verify the password against a stored BCrypt hash; an account without church membership cannot access church data. Production identity hardening remains a release task.
- **FR-21 Church registration and selection:** Allow an authenticated administrator to create a church, grant the creator its sole admin membership, and view that church in `My churches`. The POC associates one church with each administrator account.
- **FR-22 Annual election boards:** Allow an authorized church administrator to register the church's election board for a year, record its relationship to the church, support annual membership changes, and retain prior-year board history. Board members propose candidates and participate in voting through the approved election workflows.
- **FR-23 Board attendance:** Maintain a named board-member roster for attendance purposes and allow an authorized administrator to record attendance for each board session. Store attendance separately from ballot participation and ballot choices; do not require board members to sign in or enter an application password to nominate or vote through guest links.
- **FR-4 Candidate list management:** Add and normalize proposed names before a poll opens. Lock its roster while active; candidate withdrawal is allowed only before opening or after closure.
- **FR-5 Ballot submission:** Accept a ballot only through a non-expiring guest voting link while its poll is active; return 404 when no poll is active. Require exactly the round's configured number of distinct selections and reject duplicates/incomplete ballots. Prevent a browser/device profile from submitting twice to a poll, but allow it to edit/replace its ballot while the poll is active. This does not guarantee one vote per real-world person.
- **FR-6 Ballot confidentiality:** Do not require guest voter identity or expose a mapping between a named voter and candidate selections to church admins or guests. Do not claim anonymity from system operators or metadata correlation. The opaque browser-profile credential needed to edit/replace a ballot may be associated with that ballot internally and must be access-restricted.
- **FR-7 Participation tracking:** Track whether a browser/device profile has submitted for the poll without exposing ballot choices. Whether/how admins see this status remains subject to the report/privacy policy.
- **FR-8 Result concealment and reveal:** Hide aggregate totals during an active poll; allow an admin to close/reopen as authorized, then reveal aggregate results per round after closure.
- **FR-9 Round management:** Allow roster/poll setup edits before voting starts; lock setup while active. After closure, preserve results and allow the admin to mark candidates eliminated or promoted to the next round, recording each decision and when.
- **FR-10 Historical reporting:** Retain completed election and round records for later review. Report formats, exports, and retention duration remain to be decided.
- **FR-11 Auditability:** Record election configuration, round state transitions, result reveal, and administrative candidate advancement/removal. Do not include voter names or selections in ballot records or identity-linked audit entries.
- **FR-12 Majority guidance:** Calculate strict-majority information based on ballots cast, counting each ballot once per candidate it selects. The president/admin chooses selection count and next-round roster; apply the confirmed outcome rules for single- and multiple-opening positions.
- **FR-13 Tie handling:** Support administrator-configured tie-break rounds with fresh tallies and no carry-forward of prior-round votes.
- **FR-14 Two-candidate even-group cutoff:** In a two-candidate, one-selection poll with an even-sized group `N`, automatically close after `N - 1` ballots have been submitted, as a guard against an unexpected tie; an admin may override the cutoff and reopen the poll.

## Nonfunctional requirements

- **Privacy:** Guest voters do not sign in and their identity is not exposed to other guests or admins. Ballot choices must remain secret and no live totals may influence an active poll. This does not promise unlinkability from system operators or metadata correlation.
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
- Email/SMS notifications and external identity-provider integration for voters; voters are guests using received voting links. The production identity provider for administrator accounts remains undecided.
- Real-time/live tally display.

## Open questions and risks

1. **No-majority policy outside overqualification runoff:** The administrator decides whether to keep, remove, or advance candidates if no one receives a suggested strict majority in a regular round. Confirm whether the system should offer additional candidate recommendations beyond the majority flag.
2. **Production administrator identity and recovery:** Local POC email/password auth, open signup, one admin per church, and one church per admin are defined. Before production, select stronger identity/transport protections and define email verification, account lifecycle, password recovery, and mail delivery. Guest voters need no accounts.
3. **Voting device identifier:** Define what counts as the same device (browser profile, browser installation, or device), how its non-expiring ballot-edit credential is stored/recovered, and the expected behavior when browser storage is cleared. Client-side device identity is a deterrent, not a robust identity guarantee.
5. **Nomination operations:** Define retention and correction/audit expectations for anonymous submissions. POC policy is a shared, non-login link per position, a committee-agreed per-profile maximum, edits while intake is open, and admin closure; the device profile is not proof of a person's identity.
6. **Report details:** The report topic was marked approved, but no concrete values were supplied. Specify whether guests may see reports, which aggregate results/participation/audit fields are shown, whether CSV/PDF export is needed, and retention duration.
7. **Scale and operations:** Confirm initial church count, expected voters per poll, hosting preference/budget, target availability, and backup/restore objectives.
8. **Privacy/compliance and accessibility:** Identify applicable jurisdiction, accessibility target, supported languages, and candidate-name correction/deletion obligations. The approved ballot privacy boundary is confidentiality from church users, not system operators or metadata correlation.
9. **Election-board session details and annual scope:** Define required board-session fields and attendance correction/audit behavior; confirm whether the usual one-board-per-church-per-year model must allow concurrent exceptions. Board members are named for attendance, use guest links for nomination/voting, and do not need application accounts.

## Acceptance criteria for MVP (draft)

- A user from one church cannot access another church's data by changing a URL or API identifier.
- Anyone can create an administrator account with email/password; an authenticated administrator can register one church and becomes its sole administrator. Their `My churches` view shows that church. Password reset is not available in the local POC.
- An authorized church administrator can register an annual election board that proposes candidates and participates in voting; board membership changes by year and prior-year history is retained.
- An authorized administrator can record named board-member attendance for each session. Attendance is separate from guest-link voting and cannot be used to determine whether a named member cast a ballot or how they voted.
- An administrator can create a department election with multiple positions and opening counts.
- Committee members can submit names through a position-specific nomination link/QR code; an administrator can consolidate duplicates with confirmation and promote unique names into a voting roster.
- An administrator can configure a position's participant roster and a round before opening it.
- A guest with a non-expiring voting link can access the poll only while it is active; otherwise the route returns 404. The guest may revise a ballot while active, but the same browser/device profile cannot create a second ballot for that poll.
- The configured number of distinct selections is enforced for each round; incomplete or duplicate selections cannot be submitted.
- Majority counts each ballot once per candidate selected, regardless of the number of selections on that ballot. For a single opening, the administrator/committee makes the election decision; for multiple openings, the confirmed majority and runoff rules determine elected candidates within the hard opening cap.
- An election records its number of openings and tracks elected candidates across one or more rounds until the required number is reached.
- A tie-break round begins at zero votes, and the two-candidate even-group cutoff closes after `N - 1` submissions when the group size `N` is even.
- Neither guests nor admins can view aggregate results while the poll is active; the admin can close/reopen the poll under the approved override rule and reveal results after closure.
- The system can track poll submission by browser/device profile without exposing ballot selections; admin access to this status follows the still-open report policy.
- After an authorized close and reveal, aggregate results are available per round; which of the two roles can view them follows the still-open report audience policy.
- The completed election view presents each position and visually traces nominations, consolidated candidates, every round's roster and revealed totals, candidate progression, and elected person/people.
- The stored audit record captures configuration and administrative transitions without associating ballot choices with voter identities.
- A visual history shows every position's nominations, rounds, aggregate results, candidate changes, and elected outcomes.
- MVP report/history access matches the audiences approved during discovery.