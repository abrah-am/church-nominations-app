# E6.8 UX Design: Admin-Controlled Presentation View

**Phase:** UX discovery and design proposal  
**Date:** 2026-10-22  
**Status:** UX design approved by Product Owner 2026-10-22 for backlog breakdown; policy clarified by E6.10 on 2026-10-23. The participant session link and authenticated admin-controlled committee presentation are separate surfaces. Implementation remains subject to API/security contract review.

## E6.10 Decision Addendum (2026-10-23)

This addendum supersedes conflicting proposal/open-question text below. The participant link is one unexpired, revocable bearer link for an election session. During an active poll it shows the ballot without totals. When the poll closes, ballot access ends and the link transitions to neutral, read-only viewer mode; the admin may privately preview results. The participant viewer and presentation remain neutral until explicit admin reveal, which publishes only candidate names and aggregate vote totals to both viewer surfaces. Reopening clears current results until a new reveal. No-active-phase, ended, revoked, and unauthorized states use a generic unavailable response. Ballot-profile uniqueness is once per poll, and the opaque per-poll association remains valid while that poll may be reopened/current, then is invalidated when superseded or the session ends. The committee presentation is separate, read-only, opened and controlled by an authenticated admin, with independent show/hide/end; it uses the same approved results snapshot and clears on hide/context change/reopen. Historical reports and operational credential/audit retention remain subject to E6.4/E8.2 and PD-004/PD-005/PD-006/PD-012.

## Purpose and Scope

Provide two distinct capabilities. The stable participant link is shared with participants and routes to its election session's authorized current phase. The committee presentation view is opened separately by an authenticated admin action, optionally in a new tab, and has independent show/hide/end controls. Do not create or repeat participant-link controls inside each voting round. A future presentation view may provide a QR code for the participant link; QR generation/display is a future enhancement, not current functionality. Keep ballot-level data private and administrative decision controls out of both audience views.

This is a proposed UX contract, not an authorization design. The link resolves only the authorized current phase of its own election session, never another session or historical poll. In the voting phase, a closed-unrevealed poll transitions to neutral viewer mode; the admin's private preview is not exposed through the link. After explicit reveal, the same link shows the identical read-only shared results snapshot as the presentation; reopening returns both viewer surfaces to neutral mode. The presentation view remains read-only. Its future QR code would represent the same session link and is not current functionality.

## User Goals and Assumptions

**Administrator:** Prepare a legible shared-screen view, choose when approved information is shown, keep live totals hidden during voting, and return to an uninformative holding state when a round is active or results are not approved for display.

**Meeting audience:** Understand which position, intake, or voting round is being shown and read only the information the church has authorized for this audience. The audience may be a room viewing a projected display, authenticated users, or link holders; these are not interchangeable access groups.

**Admin and viewer capabilities:** The admin is the authenticated user who controls reveal and makes all list changes in the admin workspace. A viewer is anyone using the presentation-only display: they can observe the revealed active list and confirmed changes, but receive no controls or capability to modify it. “Viewer” is a presentation mode, not a third authenticated application role. The presentation session's access mechanism remains subject to E6.10 security design.

**Existing directed behavior to preserve:**

- While nomination intake is open, the admin sees only the number of submissions, never submitted names. The presentation view shows no intake count or names.
- After intake closes, names are available in the authenticated admin workspace. The presentation remains neutral until the admin explicitly selects `Reveal results`, which publishes the list in a separate presentation tab.
- There is one shared nomination list, not separate raw-intake and refined lists. The admin edits it only in the authenticated workspace; the presentation is read-only.
- Duplicate names remain separate entries until an admin explicitly removes a duplicate. The admin may correct misspellings, remove duplicates, record nominees who decline, and restore removed entries. No automatic or silent merge/removal is allowed; adding names and reordering are prohibited.
- Confirmed corrections, removals (including selected duplicate/decline reason), and restorations appear in the presentation live and remain observable in a chronological, append-only change log. A removed entry leaves the active list but its removal event remains visible in the log.
- On close, the participant link leaves ballot mode and enters neutral viewer mode. The admin can privately inspect results; viewer surfaces do not disclose ballot activity or results before explicit reveal.
- Once an administrator reveals the current poll's results, the same session link renders the identical read-only shared results view and approved aggregate snapshot used by the presentation results view. This is one shared results view, not a separate guest-specific results UI. The separately managed projector/presentation surface retains its own show/hide/session controls.
- If the current poll is reopened, the same session link and presentation return to neutral viewer mode and show no current results. A later close alone does not restore results; an administrator must reveal them again.

**Approved participant-link behavior (2026-10-23):**

- One stable, unexpired, revocable bearer link is issued for an election session, shared with participants, and reused as the authorized current phase changes across nomination intake and multiple voting rounds. Individual round UI contains no create-link, copy-link, or share-link controls.
- The session link resolves only that session's authorized current phase. It must never resolve another session, historical poll/report, admin data, or presentation controls. No-active-phase, ended, revoked, or unauthorized states use a generic unavailable response.
- The same session link follows the directed voting display lifecycle: active poll shows the ballot; closed-unrevealed shows neutral viewer mode; revealed shows the identical read-only shared results snapshot as the presentation; reopening returns to neutral mode; a later close needs a new reveal; the next authorized round is reached through the same session link.
- Browser ballot uniqueness remains once per poll. Each subsequent round is a new poll. The opaque per-poll credential remains usable while that poll may be reopened/current, then is invalidated when superseded or when the session ends. Credential storage/recovery and operational retention remain unresolved under PD-004.
- A future presentation view may show a QR code for the same link. Mark this as a placeholder only; do not imply QR generation or presentation-link controls exist today.

**Still unresolved:**

- The presentation view is separate from participant access: an authenticated admin opens it in a separate tab and independently controls show/hide/end. It is read-only but receives confirmed nomination changes and the append-only change log live.
- The direction to broadcast the revealed nomination list establishes the intended room-display behavior, not public or remote access rights. Projected viewers, authenticated users, guests, and voting-link holders are not interchangeable audiences.
- Aggregate fields beyond those already approved for the shared results snapshot remain to be confirmed. The directed guest-link behavior does not decide whether the separately managed projector is shown, nor does it establish access to other audiences, reports, or polls.
- The shared surface never shows voter names, participation-to-choice mappings, individual ballots, or ballot-level selections.
- The presentation view is for the current position and current intake/round, not a full historical report. E6.3 and E6.4 govern broader history/report scope.
- The participant link is a forwardable bearer capability and does not identify a person. An authorized admin may revoke it; it is unexpired and becomes unavailable when the session ends. Enforce tenant boundaries server-side.

## Proposed User Flow

1. While intake is open, the admin workspace shows intake state and a submission count only. The audience/presentation view remains neutral.
2. Closing intake disables further public submissions and makes the anonymous submissions available to the admin as one shared list. It does not publish names to the presentation.
3. The admin can review and edit the shared list in the authenticated workspace after close. Selecting `Reveal results` opens/publishes the current server-confirmed list in a separate presentation tab. The presentation has no edit controls or write actions.
4. The admin corrects spellings, removes duplicates or declined nominees, or restores entries only in the authenticated admin workspace. After presentation reveal, confirmed changes and their event history are mirrored promptly; a duplicate stays separate until explicitly removed.
5. The presentation identifies the position and that this is a nomination list, not an elected or approved roster. Before reveal it remains neutral; after reveal it contains no admin controls. Presentation access follows E6.10's authenticated admin-controlled session policy.
6. The stable session link resolves the current authorized phase. In the voting phase it shows the ballot only while active, then neutral viewer mode after close until explicit reveal. After reveal, it shows the same read-only results snapshot as the presentation. Reopening returns the link and presentation to neutral mode; closing again does not reveal automatically. Moving to the next authorized round does not require a new shared link.
7. Hiding the separately managed projector or changing its context clears old content before loading another position. Projector controls do not change the session link's phase resolution. The proposed contract must define the response when there is no current intake, poll, or session.
8. If a change cannot be confirmed because of a save error or connection loss, do not claim it was broadcast or saved. Show the admin the last confirmed state, visibly mark the presentation stale/unavailable, and provide a retry/reconnect path.

### Approved Participant Link Across Phases and Rounds

**Status:** Participant-link behavior approved by E6.10 (2026-10-23). This depicts one participant link per election session. The QR area is a future enhancement placeholder; do not build or promise QR functionality from this draft. Round-specific screens have no link creation or sharing controls. The committee presentation is separate and opened by an authenticated admin action.

```text
ADMIN · ELECTION SESSION                         PARTICIPANT · SAME LINK ON MOBILE
┌────────────────────────────────────┐           ┌──────────────────────────┐
│ [Election / department]            │           │ [Church / election]      │
│ Session: ACTIVE                    │           │                          │
│                                    │           │ Current session phase   │
│ Session link                       │           │                          │
│ [https://…/session/••••••••] [Copy]│           │                          │
│ Shared once for this session       │           │ [Phase-specific content]│
│                                    │           │                          │
│ Future presentation enhancement   │           │                          │
│ [ QR code placeholder ]            │           │                          │
│ Not available in current product   │           │                          │
└────────────────────────────────────┘           └──────────────────────────┘

ROUND WORKSPACE (NO LINK CONTROLS)
┌────────────────────────────────────┐
│ Position [name] · Round [n]         │
│ [Round setup / active / closed UI]  │
│ [Existing round actions]            │
│ No create, copy, or share-link UI   │
└────────────────────────────────────┘
```

Participant view on that same link as the session changes:

```text
SAME SESSION LINK                         DEVICE VIEW
Nomination intake active  ──────────────> Nomination form for current position
Active poll               ──────────────> Ballot for current round
Closed, unrevealed        ──────────────> Neutral read-only viewer mode
Results revealed          ──────────────> Identical read-only shared results snapshot
Next round authorized     ──────────────> Ballot for next current round, same URL
Session ended             ──────────────> Ended/unavailable state [wording TBD]
No active intake/poll     ──────────────> No-current-phase state [behavior TBD]
```

The phase transition must be server-authoritative. Clear ballot content at close and show neutral viewer mode, never the private admin preview. Never fall back to another session or a historical poll. During the closed-unrevealed and reopened states disclose no ballot activity or totals. Reveal makes the same link show the shared read-only snapshot; reopening removes it as current content. Browser-profile ballot uniqueness is once per poll under E6.10.

On mobile, use a single-column layout, readable phase/status heading, one primary phase-specific action, and no horizontal scrolling at 320 CSS px. Keep candidate names and result totals paired in stacked rows. The admin's session link is exposed once at session level, not repeated in round screens. The future QR placeholder must have a text equivalent and must not be the only way to access the session link. Use semantic headings and labels, keyboard-visible focus, accessible status announcements for phase changes, and WCAG 2.2 AA contrast. Do not use color alone to distinguish active, inactive, revealed, ended, or unavailable states.

## Screen Specifications

### Admin Workspace: Presentation Controls

**Purpose:** Let the admin see intake volume, reveal the closed nomination list, and edit that shared list while keeping election operations separate.

**Hierarchy and controls:**

1. Position and election context, followed by intake/round state.
2. During open nomination intake, show the submission count only. Submitted names and a name preview are prohibited in this state.
3. After intake closes, show all proposed names and the profile count in the authenticated admin workspace. Keep the presentation neutral until the admin invokes `Reveal results` to publish the list in a separate tab.
4. Show the editable shared nomination list and save/broadcast state in the authenticated admin workspace after close. Correction, remove (duplicate/declined/other reason), restore, and save controls belong there only; adding and reordering are prohibited. The presentation surface has no controls that can change data, but displays the confirmed active list and append-only change log live. Provide `Hide presentation` only in the admin workspace; hiding must not undo the reveal or silently discard edits.
5. For voting rounds, show the closed/revealed state separately. Do not offer a results-presentation control for an active or unrevealed round. Revealing makes the current poll's approved aggregate snapshot available through the stable session link; the projector remains separately managed.
6. A separate link/action may open the authenticated result-review workspace for candidate decisions, if applicable.

Do not put `Elect`, `Eliminate`, or `Advance` controls in the presentation controls or preview unless the PO expressly wants a separate authenticated admin panel. The recommended default is to keep those actions in the existing admin-only result workspace, outside the projected surface. Their placement and whether they should be visible to the presenter during projection are PO decisions.

### Wireframe: Nomination Intake Open, Count Only

The admin sees the count, never names. The shared display does not disclose either names or the count. Submission count means received submissions, not unique people or submitters.

```text
ADMIN WORKSPACE                          PRESENTATION DISPLAY
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ [Position name]              │         │ [Church / election context]  │
│ Nomination intake · OPEN     │         │                              │
│                              │         │       Nomination intake      │
│ Submissions received: 18    │         │                              │
│                              │         │   This information is not    │
│ Names are hidden until       │         │       being presented.       │
│ intake closes and you choose │         │                              │
│ Reveal results.             │         │                              │
└──────────────────────────────┘         └──────────────────────────────┘
```

Do not expose names through previews, notifications, accessibility labels, page titles, exports, or presentation payloads while intake is open. An updated count can appear when server-confirmed; do not imply that each submission is a distinct person.

### Wireframe: Intake Closed, Presentation Hidden

Closing intake disables further submissions and makes the shared list available to the admin. The presentation remains neutral until the admin explicitly publishes the list.

```text
ADMIN WORKSPACE                          PRESENTATION DISPLAY
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ [Position name]              │         │ [Church / election context]  │
│ Nomination intake · CLOSED   │         │                              │
│ Submissions received: 18    │         │       Nomination intake      │
│                              │         │                              │
│ Shared nomination list      │         │   This information is not    │
│ [Name 1]                     │         │       being presented.       │
│ [Name 2]                     │         │                              │
│ [ Reveal results ]           │         │                              │
└──────────────────────────────┘         └──────────────────────────────┘
```

Require an intentional action; do not reveal automatically on close, reload, or context navigation. Confirm the server accepted the reveal before displaying names. The unresolved audience/access policy still governs who may load the presentation surface; it does not remove the directed admin reveal step.

### Wireframe: Admin Editor and Read-Only Presentation

There is one shared nomination list, not parallel raw-intake and refined lists. On close, the authenticated admin sees the alphabetized names; reveal publishes them in a separate tab. Each submitted name is its own stable row, including repeated names. The admin edits only in the authenticated workspace. The presentation has no write capability, mirrors server-confirmed updates, and displays a chronological change log. Use stable row identity so spelling corrections, duplicate/decline removals, and restorations are distinguishable.

```text
ADMIN WORKSPACE                                  PRESENTATION DISPLAY
┌──────────────────────────────────────┐       ┌────────────────────────────┐
│ [Position name] · NOMINATIONS        │       │ [Church / position]        │
│ REVEALED · Synced                    │       │ Nomination list            │
│                                      │       │                            │
│ 1  [Name................] [Save] [×] │       │ 1. [Name]                  │
│ 2  [Name................] [Save] [×] │       │ 2. [Name]                  │
│ 3  [Name................] [Save] [×] │       │ 3. [Name]                  │
│                                      │       │                            │
│ [Edit] [Remove: duplicate/declined] │       │ Recent changes             │
│                                      │       │ 14:03  [old] → [corrected] │
│ Change history                      │       │ 14:02  [Name] removed      │
│ 14:03 [old] → [corrected] by Admin  │       │                            │
│ 14:02 [Name] removed by Admin       │       │ Removed entry retained in  │
│                                      │       │ history, not active list.  │
└──────────────────────────────────────┘       └────────────────────────────┘
```

The actual presentation shows the current active list and a visible, legible change log for confirmed corrections, duplicate/decline/other removals, and restorations. Removed names are not active rows; their removal event and selected reason remain visible. The presentation is strictly read-only and contains no controls that modify content. All controls remain in the admin workspace. It receives changes only after server confirmation. Identify the actor using a non-sensitive display label; never expose account email or submitter/device identity. Ensure change-history retention and access follow PD-005/E8.2.

### Audience Surface: Hidden / Open State

Use a neutral state that does not expose whether ballots have been submitted or reveal which content is waiting. Keep the heading generic enough to avoid falsely implying results are available.

```text
┌──────────────────────────────────────────────────────────┐
│                 [Church / election context]               │
│                                                          │
│                    Nomination intake                     │
│                                                          │
│          This information is not being presented.         │
│                                                          │
│              [No live totals or voter details]            │
└──────────────────────────────────────────────────────────┘
```

The `Nomination intake` title is an example, not a required fixed title. For an active poll, use a similarly neutral context label such as the position and `Voting round`; do not show live totals, candidate ranking, participation, or a “results pending” preview that implies ballot activity. Do not show nominee names while nomination intake remains open.

The shared-list wireframe above replaces a separate raw-submission and refined-list flow. In the closed-but-not-revealed state, names are visible only in the authenticated admin workspace; the presentation remains neutral. After reveal, label the content `Nomination list` or equivalent, never `Candidates`, `Approved`, or `Elected` unless a later authorized workflow establishes that status.

### Shared Results View: Participant Link and Presentation

The participant link renders this view when its authorized current session phase is a poll that is closed and explicitly revealed. It never resolves another session or historical poll. The separately managed presentation may render the same view and snapshot under its authenticated admin-controlled show/hide lifecycle. There is no independently calculated tally. Sort by vote total descending, then candidate name A–Z for ties, consistent with E5.1. Show only candidate names and aggregate vote totals; do not infer election or advancement from ranking alone.

```text
┌──────────────────────────────────────────────────────────┐
│                  [Church / department]                    │
│                   [Position name]                         │
│       Voting results · Round [n] · Closed and revealed     │
│                                                          │
│   Candidate                              Votes            │
│   [Candidate name]                       [total]           │
│   [Candidate name]                       [total]           │
│   [Candidate name]                       [total]           │
│                                                          │
│   [Ballots cast: count, only if approved]                  │
│   Aggregate results for this round                         │
└──────────────────────────────────────────────────────────┘
```

The candidate/result rows above are the canonical shared view. At narrow widths, render one candidate per stacked row with that candidate's vote count paired directly beside/below the name; retain the church/department, position, round, and closed/revealed headings. At 320 CSS px there is no horizontal scrolling. Do not hide approved context or separate a count from its candidate to fit the screen. The guest view is read-only and has no enlarged action controls; larger touch targets apply only to relevant admin controls on touch devices.

No recommendations, participation counts, voter identifiers, personal choices, audit metadata, or admin controls appear by default. E5.1 requires recommendations and decisions in the admin result-review row; it does not establish that they belong on a projected view. If a PO-approved version includes an outcome label, keep `elected`, `advanced`, or `eliminated` visually distinct from raw vote totals and ensure the state is based on the administrator's recorded decision.

## State and Transition Model

| Source state | Admin behavior | Participant session link | Committee presentation |
| --- | --- | --- | --- |
| Nomination intake active | Admin sees intake controls/count under the existing workflow. | Resolve to the current position's authorized nomination intake. | Neutral unless separately authorized and revealed under the nomination workflow. |
| Round active | No reveal or show-results action. Do not preview live totals. | Resolve to the current round's ballot; conceal totals and participation status. | Neutral holding state; no ballots, totals, or participation status. |
| Round closed, unrevealed | Admin may privately preview results and explicitly reveal them. | Neutral read-only viewer mode; no totals or ballot activity. | Neutral holding state. |
| Round closed, revealed | Results exist in the admin result workflow. Projector remains separately managed. | Render the identical shared results view and approved snapshot as presentation results. | Render only when separately shown/authorized; use the same shared view and snapshot. |
| Revealed round reopened | Immediately invalidate results as current results. Admin may retain historical/audit data according to E6.4/E8.2 policy. | Return to neutral viewer mode; show no current results. Closing again does not restore results without a new reveal. | Clear prior results immediately and return to neutral active-round holding state. |
| Next round becomes current | Admin configures/starts the next round through existing controls; no new link/share action is shown in round UI. | Same session URL resolves to the newly authorized current round. | Clear old content before separately authorized presentation of new context. |
| No active intake/poll or session ended | Admin sees the relevant workflow status. | Generic unavailable state; do not show another session or historical poll. | Neutral holding/unavailable state. |
| Projector hidden | Link state is not changed by projector controls. | Continues to resolve the authorized current session phase. | Neutral holding state; hiding does not unreveal results or change link resolution. |
| Context switch or connection lost / stale data | Mark admin/projector state stale and block presentation of unconfirmed content. | Clear old content while resolving. On reconnect, fetch server-authoritative current phase and do not present cached results as current if it cannot be confirmed. | Replace stale content with unavailable state; do not silently preserve totals as current. |

Reopening behavior follows E6.5's requirement that prior results become unavailable as current results. This proposal does not decide whether already revealed aggregates remain in authorized history, what happens to prior snapshots after a later reveal, or who may access historical round snapshots. The guest voting link grants no historical-report access.

## Refresh and Live Behavior

- The presentation surface should reflect server-confirmed state transitions, not client-only flags. Reveal, edit, remove, reorder, hide, and restore operations must provide visible confirmation to the admin.
- While intake is open, expose only the submission count to the admin. Never subscribe or return names to that UI or any presentation client. The display remains neutral.
- After reveal, admin and display use one server-authoritative list. The display receives changes promptly; apply an optimistic edit only if it is clearly marked pending and can be reconciled without hiding the last confirmed value.
- Correcting spelling changes the existing row in place and appends the old/new values, actor label, and time to the change log. Do not create a second candidate implicitly.
- Duplicate text remains as separate entries with stable identities. Do not merge based on exact or fuzzy matching. The admin may explicitly edit a duplicate into another name or remove it; each action must be confirmed, broadcast, and recorded.
- Use the initial alphabetical order specified in E6.9 and keep it fixed; do not add or reorder entries. Persist that order server-side.
- A removal immediately leaves the active list but remains visible in the change log with the removed name, selected reason, actor, and time. Provide an explicit restore action in the admin workspace; restoration is a new recorded change. Never silently remove a row from the public history.
- Save edits explicitly or provide an equally clear per-row save behavior. Show `Saving`, `Saved at [time]`, or `Save failed`; do not report success until the server confirms the write. Prevent overlapping edits to the same row from silently overwriting each other; surface a conflict and allow reload/resolve.
- Never subscribe any surface to ballot-level submissions or live tallies. The proposed session link resolves the authorized current phase; only after a confirmed admin reveal may it load the approved aggregate snapshot shared with the presentation results view.
- When an active round is reopened, clear the session link's result content immediately and return to neutral viewer mode. Clear projector results immediately and return that surface to its neutral holding state. A subsequent close does not restore results without a new admin reveal.
- On opening or refreshing the session link, resolve only the authorized current phase of that session and fetch its server-authoritative state. During an active poll show its ballot without totals; while closed-unrevealed show neutral viewer mode while the admin may privately preview; while closed-revealed render the canonical shared results view; if reopened return to neutral viewer mode. When the next round becomes current, the same link may resolve to it. Never substitute another session or a historical poll.
- Define and enforce session capability resolution server-side. Link forwarding, expiry, revocation, tenant boundaries, and the no-active-phase/session-ended response are product/API/security decisions; do not infer that a forwarded link identifies an authorized individual.
- If push updates are supported, use them only for approved state/publication changes and aggregate snapshot changes after reveal. A polling fallback may be used, but its interval and stale threshold need product/engineering agreement.
- On refresh failure, show `Presentation unavailable` (or approved equivalent), not last-known data as current. A manual retry is available to the admin; the audience surface offers no route into admin controls. If a display has lost connection, visibly mark it stale and stop presenting the list as live; on reconnection, fetch the current server snapshot and history before resuming.
- If saving fails, retain the last server-confirmed value as authoritative, mark the local edit unsaved, and offer retry or discard. Do not broadcast an unconfirmed edit as saved. On connection loss, disable destructive actions until current state is reloaded; queued non-destructive edits may not be replayed without explicit conflict review.
- Confirmed removal/change events remain observable after reconnect and refresh. A failed removal must leave the item active and clearly report failure.
- Define whether refresh preserves presentation publication across browser reloads. Conservative proposal: reload starts hidden until the admin reauthorizes the display, unless a secure, explicit presentation session is approved.

## Privacy, Audience, and Access Boundaries

- E6.10 approves one session-scoped participant bearer link that resolves only its own authorized current phase. It is distinct from the presentation view, which is opened through an authenticated admin action.
- Enforce session scope server-side: the proposed link resolves only its own authorized current phase, never another session, a historical poll, admin data, or projector controls. E6.5 and PD-012 continue to govern broader history/report access.
- Treat the participant link as forwardable bearer access: anyone possessing it may use the allowed current phase. It does not identify a person. The link does not expire, may be revoked by an authorized admin, and becomes unavailable when the session ends. Enforce the church tenant boundary server-side. Presentation access requires admin authentication; do not embed participant credentials in presentation URLs.
- Decide how browser ballot uniqueness applies across polls and rounds. Current requirements prevent a browser/device profile from submitting twice to the same poll; they do not establish uniqueness across a session or whether the same profile may vote in each round.
- Apply church tenant isolation server-side to both presentation creation and data retrieval. Hiding controls in the UI is not authorization.
- Keep ballot choices detached from voter identity. Do not expose participation status, voter names, device/profile identifiers, ballot records, or any voter-to-choice mapping on either surface.
- Audit presentation start/hide/end and admin-confirmed nomination changes without logging individual viewers or link credentials. Historical result/report retention and nomination audit retention periods remain governed by E6.4, PD-005/PD-006, and E8.2.
- Avoid displaying private admin-only recommendations, election notes, or decision rationale on the shared screen unless separately approved.

## Responsive and Target Display Behavior

- Treat the projector/large shared display as a target while ensuring the same results view works for voters opening the guest link on mobile. Use a centered, high-contrast content region, readable candidate names and totals, generous row spacing, and restrained supporting text. Avoid dense admin navigation and controls.
- On wide displays, use aligned candidate and vote-count columns. On mobile/narrow screens, use one candidate/result per stacked row, with the vote count paired directly beside or below its candidate name. Retain church/department, position, and round/status headings and the same result ordering and content as the projector view.
- Do not rely on hover, pointer precision, or a particular aspect ratio. The admin controls must remain usable on a laptop or tablet while a separate audience window is shown.
- At 320 CSS px, no horizontal scrolling: long names wrap, vote counts stay paired with the correct candidate, and headings/context remain visible. Support browser zoom/reflow without clipping; do not shrink text to fit a fixed-height presentation.
- Provide an explicit browser full-screen affordance only if supported by the host application; do not assume the browser can enter full screen without user interaction. Keep the exit path apparent to the presenter.
- Avoid automatic slide rotation or motion that can distract during a meeting. Respect reduced-motion preferences. Any transition should not delay privacy-sensitive clearing when hiding or reopening.

## Accessibility Requirements

- Use semantic page heading and table/list structure. For results, use a semantic table with candidate and vote-total column headers on wide screens, or an equivalently accessible list of stacked candidate/result rows on narrow screens. Preserve the same reading order and candidate/count association in both layouts.
- Announce meaningful state changes to assistive technology, such as `Results hidden because this round is open` or `Results are no longer current; the round was reopened`. Do not announce every refresh or repeat unchanged totals continuously.
- Ensure text labels communicate hidden, active, closed, revealed, stale, and unavailable states; color and animation are supplemental only.
- Keep admin controls keyboard-operable with visible focus and clear accessible names. Any confirmation dialog for showing/hiding or changing audience must manage focus, support keyboard cancellation, and return focus to the initiating control.
- Maintain WCAG 2.2 AA contrast for projected text and controls. Validate at actual presentation scale and typical room viewing distance; do not use color alone for majority, tie, or decision states.
- Ensure both the projector and guest-link results view remain understandable at 200% zoom/reflow and with screen-reader reading order. Candidate names and vote counts must remain paired when rows stack; do not require touch gestures or horizontal scrolling to read results.
- Keep the guest results surface read-only. Use larger touch targets only for admin actions that are actually present on mobile; do not add decorative or nonfunctional controls to the voter-facing view.

## Empty, Loading, and Error States

- **No submissions/list empty:** Keep the audience surface neutral unless the unresolved audience policy approves an empty-state message. Admin sees a zero submission count during intake; after close the empty shared list is visible to the admin, and reveal may publish the empty state. Adding names is not allowed under E6.9.
- **Active poll through the proposed session link:** Show the ballot for the authorized current round without totals or participation status.
- **Closed-unrevealed or reopened poll:** Show neutral viewer mode; do not disclose totals or whether ballots have been submitted. The admin may privately preview closed results. Closing again does not change viewer content until an admin reveals results.
- **Closed-revealed current poll:** Render the canonical shared results view and approved aggregate snapshot through the same session link.
- **No active intake/poll or session ended:** Show the product-approved generic state once decided. Do not resolve another session or a historical poll.
- **No revealed results on projector:** `Results are not available for presentation.` Do not expose whether ballots exist or how many were submitted unless policy allows it.
- **Loading/context switch:** Neutral loading state with no prior position's content retained.
- **Unavailable/expired/revoked session link:** Use a generic unavailable message that does not disclose whether an election or result exists. The recovery/authorization flow is undecided and must not be assumed here.
- **Stale or offline:** `Presentation unavailable. Reconnecting…` Keep no stale content presented as current. On reconnect, fetch authoritative list and history before showing again.
- **Admin save failed:** Keep the last confirmed server value, mark the attempted edit unsaved, and offer retry/discard. A failed removal leaves the row active. Do not report a failed or pending edit as broadcast.
- **Conflicting edit:** Identify the value changed elsewhere and offer reload/resolve. Never silently overwrite either version.

## Usability and Privacy Risks

- **Reveal may be mistaken for broader publication:** Revealing a poll does not automatically show the separately managed projector or authorize other audiences, sessions, or reports. Label and manage the projector action separately.
- **Shared-link overreach:** The proposed link may resolve the authorized current phase of its own session only. Do not treat it as permission for another session, historical polls/reports, admin data, or projector controls.
- **Screen exposure:** Projected content can be photographed or seen by people not in the room's intended audience. Approve fields and audience before enabling display.
- **Reopen race/stale totals:** Clear projector content and return the session link to its existing inactive message on reopen before refresh; do not retain the previous tally as current even if a request is delayed or fails.
- **Session capability overreach:** Limit resolution to the authorized current phase of the link's own session. Do not expose another session, historical poll/report, admin data, or projector controls through it.
- **Deletion hidden from the room:** A plain nomination-list removal would violate the direction that edits/removals be observable. Keep a visible append-only change log and make all list writes server-confirmed and auditable.
- **Duplicate names:** Do not automatically deduplicate or suppress repeated names. Keep duplicates as separate rows unless the admin explicitly changes/removes one; show an ambiguity indicator only if it does not imply an automatic merge.
- **Nomination versus candidate status:** The broadcast content is a nomination list, not an approved candidate roster. The downstream policy for selecting candidates into a voting round remains outside this design.
- **Decision controls on broadcast:** Showing elect/eliminate/advance controls could expose deliberation or invite accidental operation. Keep them in admin-only workspace by default.
- **Unclear ballot denominator:** Multi-selection ballots count once per ballot but can add a selection to several candidates. Confirm whether to show ballots cast, vote totals, or both, and label accurately.

## Superseded Discovery Questions

The questions below were written before E6.10 decisions on 2026-10-23. They are retained as discovery history only; see the E6.10 Decision Addendum above for current approved policy. Historical-report/retention questions remain open under E6.4/E8.2 and PD-004/PD-005/PD-006/PD-012.

1. Should the proposed stable session link replace current position-scoped nomination and poll-scoped voting links? What does it show when there is no active intake/poll, and what should it show when the session ends?
2. Who may use/open the session link, and what authorization model applies? What are the link-forwarding policy, expiry and revocation behavior, and tenant-boundary requirements? Which projector audiences remain separately controlled?
3. How should browser ballot uniqueness work across polls and rounds: once per poll, once per session, or once per round? How should an already-submitted profile behave when the same link advances to the next round?
4. Which aggregate fields are approved in the shared revealed-results snapshot: candidate names, vote totals, ballots cast, majority/tie indicators, recommendations, and recorded decisions? The projector's separate show action remains independently managed.
5. Should `Elect`, `Eliminate`, and `Advance` remain only in the admin result workspace, or should an admin-only control panel be available while presenting? These controls must not appear on the audience surface.
6. The session link returns to the existing inactive message on reopen and requires a new admin reveal after the next close. Should prior revealed results remain available to authorized audiences in history, or become unavailable there as well?
7. May an admin present a closed/revealed voting round while another round is active, or does an active round hide all projector presentation surfaces?
8. How long does a presentation session remain available? Should reload start the display hidden, and how should the admin revoke/end a session?
9. What is the approved no-intake/no-poll/session-ended disclosure? May viewers learn that no nominations/results exist, or should the surface stay generic?
10. What stale/offline threshold and audience-facing wording are acceptable? Is server-confirmed live update behavior sufficient, or is a specific update latency required?
11. What display environments are in scope beyond the responsive mobile view (projector aspect ratio/resolution, TV, tablet), and are language, text-size, or contrast preferences required beyond WCAG 2.2 AA? The shared results view must support mobile, stacked candidate/result rows, and no horizontal scrolling at 320 CSS px.
12. What retention and access rules apply to the visible nomination change history, including tombstones, spelling corrections, restoration, and the admin actor/time shown on the display?

## Approval Gate

The UX design is approved for backlog breakdown. E6.10's participant-link, presentation-access, current-results, and per-poll uniqueness policies are recorded in the addendum and cross-referenced product/API documents. E6.8 and E6.11 remain subject to implementation contract and security review; historical-report audience and retention, ballot credential storage/recovery, and audit retention remain open under their owning decisions. The future presentation QR code is a later enhancement and is not part of initial delivery.