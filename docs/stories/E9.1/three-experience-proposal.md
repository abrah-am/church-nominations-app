# Three Connected Election Experiences

**Status:** UX proposal for Product Owner review. UX discovery was delegated to the UX Designer. This document refines E9.1 and coordinates existing stories; it does not authorize implementation.

**Scope boundary:** No application code, dependency, API, database, authorization, election rule, merge, or deployment change is authorized by this proposal. The companion HTML is an isolated interaction mock using representative data only.

**New Product Owner direction (2026-10-27; policy reconciliation required):** During nomination intake, the administrator can edit/remove names and broadcast the list to the presentation. The voter retains the nomination form and sees an additional compact, read-only view of the last broadcast list. Live exposure of proposed names conflicts with approved E6.9/E6.10 reveal-gated rules. This proposal and prototype capture the requested target but do not authorize a policy or API change.

**New Product Owner direction (2026-10-27; policy reconciliation required):** During nomination intake, the administrator should be able to edit/remove names and broadcast the list to the presentation. The participant link should show only a compact read-only version of the presentation, not a nomination form. This conflicts with approved E6.9/E6.10/E6.11 requirements that submitted names remain private before closure/reveal and the session link resolves to the nomination intake. This proposal and prototype capture the requested target but do not authorize a policy or API change.

## Decision Summary

Treat the application as three connected experiences over one election process, not three application roles:

- **Administrator:** authenticated operational workspace for election and position setup, nominations, rounds, results, candidate decisions, and completion.
- **Voter:** guest participant using the stable session bearer link. During nomination intake it shows only the compact last-broadcast list; while voting is active it shows the ballot. This intake behavior is pending reconciliation with E6.11.
- **Viewer / presentation audience:** read-only audience capability. The participant link becomes a neutral or explicitly released results view after poll closure. The separate presentation surface is opened and independently shown, hidden, or ended by an authenticated administrator action. “Viewer” is not a third authenticated role or an independently authorized session.

These are separate browser instances/surfaces, not tabs within one combined interface: the administrator uses the authenticated workspace, participants open the session link on their own devices, and the audience presentation runs in its own browser window on the display. They share the election process through the authorized product contracts, but retain distinct routes, controls, and visibility. The static prototype launcher opens separate role-specific windows; its localStorage synchronization is only a same-origin mock mechanism, requires serving the file over HTTP (not `file://`), and is not production authorization or a real-time API design.

The recommended administrator design is guided and state-driven: retain a persistent election/position context, compact progress, and one primary current task. Show only the current actionable stage by default; keep prior stages and historical rounds reachable without placing unrelated workflows on one long page.

## Participant Journeys

### Administrator

Select church and election → select position → open nomination intake → review the working list → edit/remove names and explicitly broadcast authorized updates → close intake → confirm the consolidated list → prepare the roster and round → confirm expected voter count/cutoff → open voting → monitor permitted operational progress without totals → close or reach cutoff → privately preview results → explicitly reveal current-round totals → record candidate decisions → preview and configure a fresh subsequent round or complete the position → continue to the next position. Open, hide, or end the read-only presentation independently from election operations.

At each stage the workspace identifies current status, prerequisites, the permitted action, and the next step. Previous tasks and rounds remain accessible as secondary navigation/history, not as simultaneous primary panels.

After results are revealed, admin decision rows show each candidate's vote total beside the selection control; use concise labels without the redundant word “Advance.” When the top-ranked candidate is elected, require an admin-recorded response step. If they accept, the opening is filled. If they decline, record the decline and let the committee choose either a fresh poll from eligible candidates in the last round or a direct invitation to the next-highest candidate by that round's vote total. These are prototype recommendations; E6.6/E6.7 policy details remain Product Owner decisions.

### Voter

During nomination intake, open the shared session link → submit or revise the voter's own names in the nomination form → receive a clear submission confirmation → separately view the compact read-only list that the admin has broadcast, without admin editing controls or source identities → after voting opens, read the current position, round, and exact selection instruction → select the required distinct candidates → submit → receive a clear confirmation → while the same poll remains active, replace the ballot if needed → after closure, see a neutral state until explicit results release → see only the permitted current-round aggregate results after release → use the same session link for a later round when the server authorizes it.

The mobile screen contains no admin navigation, private election information, participation status, live totals, or ballot-choice history. Generic unavailable and closed states must not reveal other sessions or historical data.

### Presentation audience

The authenticated administrator opens the separate presentation surface → audience sees a neutral holding state until the administrator broadcasts authorized nomination content or explicitly releases results → audience sees the latest broadcast nomination list/change log or released current-round aggregate snapshot → on hide, context change, reopen, or stale data, presentation content clears or returns to neutral; the participant link independently retains only its last authorized broadcast snapshot → at position completion, the proposed final-outcome treatment is subject to the policy approval called out below.

Presentation is read-only and has no admin actions. Its visibility control is separate from the participant link's phase resolver. The admin may prepare an operational next step without forcing an unintended viewer transition.

## Shared Election Lifecycle and Visibility Matrix

| Operational election state / transition event | Administrator: visible and available actions | Voter session link | Separate presentation |
| --- | --- | --- | --- |
| Setup; admin creates election/positions | Configure department, ordered positions, and openings; select current position | Generic unavailable until a phase is authorized | Neutral |
| Nomination intake opens | See configured name limit and permitted profile-level intake metrics; share link | Compact read-only view of the currently broadcast list; no submission form | Neutral until admin chooses to broadcast |
| Intake active | Review working list; edit/remove names and explicitly broadcast updates, pending policy approval | Compact read-only copy of only the last broadcast list; no form, intake count, source identity, or admin controls | Read-only copy of the last broadcast list; no intake counts or submission sources |
| Intake closes; refinement begins | Edit/remove/merge names in the admin working list; confirmed changes append to the change log | Submission form closes; voter sees the full aggregated working list and confirmed edits/removals read-only | Same full aggregated list and live confirmed change log, read-only |
| Nomination list confirmed/revealed | Prepare roster; explicitly control publication | Compact read-only list if currently authorized | Confirmed active list and approved append-only change log, read-only |
| Round draft/configuration | Choose roster and exact selection count; confirm expected count/cutoff; start | No draft or setup controls | Neutral |
| Voting active | Monitor allowed profile/link progress; close or apply existing cutoff behavior; no totals | Exact-selection ballot; submit or replace while active; no totals | Neutral; no totals or participation status |
| Voting closed, results unrevealed | Private results preview; explicit reveal action; candidate-decision controls remain admin-only | Neutral viewer state; ballot is closed; no activity or totals | Neutral even if already open |
| Results explicitly revealed | View current aggregate and administer decisions/next-round preparation | Candidate names and aggregate totals only for the current round | Same approved aggregate snapshot, only while presentation is shown |
| Poll reopened | Reopen under existing override policy; previous results are no longer current | Active ballot; no results | Clear old results immediately; neutral |
| Candidate decisions saved | Review saved advancement/elimination/election decisions; prepare next roster | No recommendations or decisions | No decisions, recommendations, or history |
| Subsequent round draft/active | Configure a new poll; fresh tally; operate as above | Same session URL resolves only to the authorized current phase; one ballot per profile per poll | Clear old context before showing newly authorized content |
| Position/election completion | Show existing completion state and navigable admin history | No historical access implied; current-session access follows server policy | User-requested final elected name is proposed, not policy-approved; see approval conflicts |
| No active phase, session ended/revoked, or unauthorized | Admin sees operational state | Generic unavailable response | Neutral/unavailable; never stale content |

This matrix combines existing policy with the new requested nomination-view behavior. Intake broadcast and participant-link changes are not production-approved until the policy conflict below is resolved. It does not expand public access to history or admin information.

### Visibility constraints

| Data/action | Admin workspace | Voter link | Presentation |
| --- | --- | --- | --- |
| Intake configuration and allowed profile count | Yes, per current rules | No admin metrics | No intake count |
| Proposed/working names during open intake | Admin workspace; explicitly broadcast a snapshot under requested direction, pending policy approval | Own submission form plus only the last broadcast snapshot | Only the last broadcast snapshot |
| Aggregated list during post-close refinement | Yes; admin may edit, merge, or remove | Full current list, read-only | Full current list, read-only |
| Confirmed refinement changes | Yes | Read-only change log, no mutation controls | Same live read-only change log |
| Active ballot and exact selection rule | Round operation context | Yes | No |
| Participation status | Admin only where existing policy permits; label profile/link submissions, not people | No | No |
| Closed, unrevealed results | Private preview | No | No |
| Revealed current-round results | Yes, with decisions separately controlled | Candidate names and aggregate totals only | Same approved snapshot |
| Candidate decisions/recommendations/identity/individual ballots | Admin decisions only where applicable; never voter-to-choice mapping | No | No, except final-elected outcome requires explicit policy resolution |
| Historical rounds/reports | Existing admin access policy only | No access implied | No history view |

## State Model Recommendation

Distinguish two concepts in the design and UI, without introducing backend state:

1. **Operational election state** remains authoritative: intake/round lifecycle, results-release event, candidate decisions, and position/election completion.
2. **Presentation display state** describes what the separate read-only surface is currently allowed to display: neutral/hidden, authorized nomination content, authorized released current-round snapshot, or unavailable/stale-cleared.

They are orthogonal: an administrator can work on a next step while a previously released presentation remains visible if existing presentation policy permits it; an admin hide/context change clears it independently. A poll reopen invalidates the old result snapshot as current content on both viewer surfaces. UI must not infer “show results” solely from “poll closed.”

This is a conceptual model and display derivation from existing lifecycle/release information and existing presentation controls. It proposes **no new persisted field, API endpoint, event, or backend state**. If implementation discovery finds the current contract cannot represent the required independent display behavior, stop and request Product Owner approval before proposing contract or state changes.

## Wireframes

### Administrator: nomination intake

```text
Election: Spring election  /  Position: Chair · 1 opening
Progress: Nomination intake open                         [Intake open]

CURRENT TASK                                                   [Nominations]
Review working list
Profile submissions: 3 (profile-level, not verified people)

[Editable nominee name                              ] [Remove]
[Editable nominee name                              ] [Remove]
[Editable nominee name                              ] [Remove]

[Broadcast list] [Close intake]
Last broadcast: 3 names · Edits appear only after rebroadcast
```

Voter submissions populate the admin working list. Keep the editable working list and last-broadcast snapshot conceptually distinct. A newly submitted name or admin edit/removal is not sent to either audience until the administrator explicitly broadcasts again. During post-close refinement, typing a correction is a private draft: an explicit Save commits the name once, records one before/after event, and updates both read-only audience views. Removal is a separate explicit action and records one removal event. Submitter/device identity never appears in the working list or audience surfaces. Confirm correction/removal audit semantics against E6.9 or a PO-approved policy update.

### Voter: compact nomination viewer

```text
Spring election                                      Nominations open
Chair

Names shared for Chair
Current broadcast · Read-only

Candidate name
Candidate name
Candidate name
```

During open intake, the compact list appears alongside the nomination form and shows the last list explicitly broadcast by the admin. After intake closes, the form is replaced by a read-only view of the full aggregated list and its confirmed refinement changes. Admin edits/removals update the voter and presentation views live, but neither audience has mutation controls. Do not expose source identity, profile counts, or ballot information. This post-close voter access/change-log behavior needs PO approval against E6.9/E6.10; it must not be inferred from the open-intake form permission in E6.11.

### Administrator: desktop guided task

```text
Church / Department Elections / Spring election          [Election status]
Election: Spring election  /  Position: Chair · 1 opening
Progress: Nominations complete  →  Voting round 1 active  →  Decisions

Position task navigation: Overview | Nominations | Voting rounds | History

CURRENT TASK                                                   [Round 1 · Active]
Monitor voting
Profile/link submissions: 14 of 18 expected
Ballot totals remain hidden while voting is active.

                                                      [Close voting]
```

The next state replaces the card rather than appending another workflow below it. On close, a private result-review task replaces the active monitor card; after explicit reveal, admin decision controls appear in that focused task. Keep rare/destructive override actions secondary and explicitly confirmed. Position/election headers persist across the task; historical rounds stay available from navigation.

### Voter: mobile ballot

```text
Spring election                                      Voting open
Chair · Round 1

Choose exactly 2 candidates
Select two different people. You can replace your ballot while voting is open.

[ ] Candidate name
[ ] Candidate name
[ ] Candidate name
[ ] Candidate name

2 of 2 selected
[Submit ballot]
```

After submit, replace the form with an announced confirmation and a clearly labeled “Replace ballot” action while active. Closed, unavailable, already-submitted, loading, and error states each have a direct next step without exposing private state. No horizontal scrolling at 320 CSS px; long names wrap naturally.

### Presentation: large screen

```text
SPRING ELECTION                                   CHAIR · ROUND 2
Voting results · Closed and released

Candidate name                                             18
Candidate name                                              7
Candidate name                                              2

                                                     [No controls]
```

Nomination mode uses the latest explicitly broadcast list and, if authorized under the reconciled E6.9 rules, a confirmed change log. Before the first broadcast or after a clearing event, show a calm neutral holding screen. The participant session link mirrors only the current broadcast list in a compact mobile read-only view during intake; it does not expose admin editing controls or submission forms under this requested design. Use high contrast, large type, stable name/total pairing, no auto-scroll, and fullscreen support through the browser. At completed position, a final winner treatment is proposed only after the access-policy conflict is approved.

## Navigation and Interaction Recommendations

- **Admin entry hierarchy:** mock sign-in → My churches (church name) → election periods (for example, 2026 Elections) → selected period overview grouped by department → positions with opening count, current status, and contextual action. Departments and positions are administrator-configured; the dashboard must not assume a fixed department/position catalog.
- Use existing ownership: US-004/US-005 cover account and church onboarding; US-007 covers department election and ordered position setup; E1.1/E1.2 cover election/position state and next action. The prototype’s `Not started`, `In progress`, and `Filled` labels are readable dashboard summaries mapped to existing setup/progress/completion concepts, not new backend statuses.
- Selecting an in-progress position opens its existing focused workflow. Selecting a not-started position routes to its existing nomination/setup task; selecting a filled position opens read-only outcome/history when allowed by E6.3/E6.4 policy.
- Keep election and position context persistent in admin view; use a compact progress indicator and one focused primary task card.
- Admin hierarchy: workspace (Department Elections / Annual Boards) → election overview and ordered positions → contextual position task. Use local task navigation, not a new router requirement.
- Keep prior stages and round history accessible as secondary destinations; do not make the user scroll a long mixed-workflow page to find the current action.
- Keep voter and presentation surfaces standalone. They have no admin navigation, admin controls, or cross-session/history navigation.
- Provide the stable session link once per session, not once per round. QR delivery remains later E6.12 scope.
- Treat close, broadcast, final nomination reveal, results reveal, reopen, hide, end, and candidate-decision save as distinct actions with clear state feedback. A working-list edit does not alter the last-broadcast snapshot until an explicit broadcast. Voting results reveal is never implied by closure.
- Clear stale/current results on reopen or context change; on reconnect fetch authoritative approved content before showing it as current.
- Keep success/error and unsaved state beside the affected task; do not rely on transient toast-only feedback for important transitions.

## Bootstrap 5 Design System Proposal

Bootstrap 5 is the proposed CSS/layout foundation per E9.1; the prototype itself does not import it. Keep current React components responsible for application state, semantics, validation, and events. Do not add React-Bootstrap or another component framework.

| Token/pattern | Proposed standard |
| --- | --- |
| Typography | 16px body, labels, and instructions as the baseline; compact but legible operational headings; final font family requires visual review |
| Spacing | Bootstrap spacing scale/utilities with consistent section rhythm; no parallel grid or spacing system |
| Colors | Restrained brand/theme layer for ink, surface, accent, focus, and status; confirm exact palette before implementation; status never depends on color alone |
| Buttons | One primary permitted action per current task; secondary actions nearby; destructive/rare overrides separated and confirmed |
| Forms | Persistent labels, grouped related controls, inline errors, readable option rows, clear exact-selection count |
| Status | Consistent text labels for draft, active, closed, revealed, completed, blocked, unavailable; text/icon plus color |
| Dialogs | Responsive, named and described; initial focus, focus containment, safe Escape behavior, background interaction prevention, and focus restoration |
| Accessibility | Semantic headings/labels, logical keyboard order, visible focus, announced async status, reflow, long-name support, reduced-motion respect |

Keep admin, mobile participant, and large-screen presentation shells purpose-specific while sharing tokens and primitives (shell/heading, alerts/status, loading/empty/error, fields, action groups, responsive rows, disclosures, and confirmation dialogs). Migrate incrementally and check Bootstrap resets against legacy global CSS on every touched surface.

## Existing Story Coverage and Dependencies

No duplicate “three experiences” feature story is recommended. Refine and sequence existing ownership:

| Capability | Existing owner(s) | Scope note/dependency |
| --- | --- | --- |
| Bootstrap foundation/shared standards | E9.1 | Foundation only; implementation plan approval required |
| Election and position progress | E1.1, E1.2 | Existing lifecycle status and next action; E1.3 reconciled |
| Intake states and consolidation recovery | E2.1-E2.4, US-008, US-009 | E2.4 is a product decision gate; E2.2/E2.3 remain backlog |
| Candidate roster/round configuration | E3.1-E3.4, US-010 | E3.3 blocked on E2.4; E3.2 depends on decisions |
| Start, active progress, close, mobile ballot | E4.1-E4.6, US-011 | E4.3 owns mobile/recovery; E4.4 device/profile policy and E4.5 reset remain gated |
| Results, decisions, next-round handoff | E5.1-E5.4, US-012 | E5.4 undo policy unresolved; results release must remain explicit |
| Completion/history/outcomes | E6.1-E6.7, US-013 | E6.1/E6.4/E6.6/E6.7 and E8.2 policies block dependent history/decision scope |
| Presentation and nomination reveal | E6.8, E6.9 | E6.9 implementation/QA reported complete; acceptance/push status in backlog is authoritative |
| Session link and access policy | E6.10, E6.11 | E6.10 policy accepted; E6.11 implementation contract review pending |
| Session QR | E6.12 | Future scope, not initial link delivery |
| Accessibility and responsive validation | E7.1-E7.3 | E7.1 target/device/test approach unresolved; gates sign-off |
| Privacy and operational verification | E8.1-E8.4 | Identity, retention, tenant/privacy verification, and operations remain production gates |
| Onboarding, boards, election setup | US-004-US-007 | Apply shared design within existing scope; no new parallel stories |

Suggested dependency sequence: resolve/bound E7.1/PD-009 and theme decisions → approve E9.1 implementation plan → shared Bootstrap foundation plus one admin and one participant slice → existing nomination/round/voting/results stories → E6 presentation/session-link work after E6.9/E6.11 contract readiness → history/completion once E6.1/E6.4/E8.2/E6.6/E6.7 decisions are settled → E7.2/E7.3 cross-workflow validation. Coordinate branch/worktree sequencing with the existing E6.9 work; do not mix changes without explicit approval.

## Regression, Accessibility, and Privacy Validation

- Preserve existing route, API, election, tenant, authorization, ballot, and reveal behavior. UI hiding is not a security boundary.
- Cover nomination open/close/reveal; confirmation, save failure, and conflict recovery; round draft/start/cutoff; active/replace/closed/reveal/reopen; same session URL resolving a later round; decision-save feedback; and completion.
- Assert forbidden content is absent on both viewer surfaces: no active totals; no participation counts/status; no voter identity or ballot-level choice; no recommendations, admin decisions, or history; no admin controls.
- Verify closure alone keeps both viewers neutral, reveal publishes only the approved snapshot, reopen clears the old snapshot, and presentation hide/context change clears content independently.
- Label profile/link submissions accurately; do not imply real-world voter counts. Keep named board attendance separate from participation and ballots.
- At 320 CSS px and the later PO-approved matrix, check overflow, clipping, long names, name/total pairing, dialog sizing, keyboard order/focus, zoom/reflow, labels, announcements, contrast, screen-reader use, and fullscreen/presentation readability.
- E7.1/PD-009 have not approved a conformance target or device matrix. WCAG 2.2 AA remains a proposal, not a claim. Record manual and automated evidence in owning story QA artifacts.
- The static prototype can validate screen/state concepts and navigation only. It cannot validate server authorization, tenant isolation, persistence, real-time propagation, ballot durability, or API-driven phase resolution.

## Approval Questions and Conflicts

1. **Viewer final outcome conflict:** This request asks for the final elected candidate(s) on the completed presentation. Current E6.8/E6.10 policy excludes candidate decisions and history from viewer surfaces; current result snapshots are limited to candidate names and aggregate totals. Approve an explicit E6 policy change and define whether the outcome is presentation-only, participant-visible, or neither before implementation. The prototype marks this proposed content as approval-required.
2. **Nomination disclosure and refinement audience:** During open intake, the voter submits names and sees only the last admin-broadcast list. After intake closes, this design proposes showing the aggregated list and confirmed edits/removals live to the voter and presentation, read-only. Current E6.9/E6.10 rules gate nomination visibility behind explicit reveal and do not authorize a participant-side refinement log. Approve this extension and define whether the initial refinement state itself is considered reveal, which edits/removals are immediately visible, audit/confirmation semantics, and how hide/context changes affect the two viewer surfaces. Source identity, intake/profile counts, and submission attribution remain excluded.
3. **Presentation while admin prepares next step:** Confirm the intended expectation that a previously released presentation may remain visible during independent admin preparation, except where existing rules require clear on reopen, hide, or context change. No backend state is proposed; if current contract cannot support it, return for approval before API work.
4. **Accessibility/device gate:** Approve target, browser/device/viewport matrix, and test approach in E7.1/PD-009. WCAG 2.2 AA is not assumed.
5. **Candidate acceptance and decline:** E6.6/E6.7 remain clarification-needed. This prototype shows explicit accept/decline recording; a decline can lead to either the next-highest candidate by the previous round's votes or a fresh poll from eligible candidates in that round. Confirm ranking/tie rules, roster eligibility/committee authority, response correction/audit, and when an opening/election is complete before production implementation.
6. **Existing unresolved policies:** E6.1 completion edge cases; E6.4/E8.2 report audience, fields, and retention; E2.4/E3.3 post-draft correction; E5.4 undo; PD-004 credential lifecycle; PD-005 audit retention.
7. **Implementation gate:** Approve the refined E9.1 implementation plan separately. Bootstrap direction approval and this design review do not authorize package installation or production implementation.

## Companion Prototype

Open [prototype.html](prototype.html) for the mock scenario. It uses representative mock data and simulated controls; it is not connected to the API and does not implement production access controls. Its final elected-candidate presentation is explicitly pending the policy decision above.