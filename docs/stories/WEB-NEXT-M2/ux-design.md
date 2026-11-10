# WEB-NEXT-M2 · Position Workspace UX design

**Status: Approved by the Product Owner 2026-11-09 for Phase 2 implementation
within the approved read-only scope.** Final acceptance remains subject to T007
verification and T008 review. This approval does not authorize merge/deployment.
The [visual-reference gallery](visual-references/index.html) remains the UX
baseline for implementation.

## Design intent

Help an administrator inspect one position, its polls and its current candidate
roster without changing the participant session or election data. The accepted
M1 shell remains the frame: a 246px desktop application sidebar, neutral
surfaces, restrained teal status accents, and Church → Term → Department →
Position context in the content header only.

The primary view is the closed Round 1 poll, with its aggregate results and
recorded decisions together. The participant session remains visibly Round 2
Open. “Viewed” and “Active” are separate, persistent concepts; changing view,
context, or workspace tab never activates a poll. M2's details are read-only
presentation. That does **not** make a closed current-term poll immutable as a
product policy or change any existing decision-revision policy.

## User and assumptions

- **Primary user:** an administrator reviewing a Church Elder position, its
  closed poll, and the effective candidate statuses.
- **Goal:** answer “What was recorded for this poll?”, “What is each opening's
  current state?”, and “Which poll is serving participants?” without confusing
  historical inspection with session control.
- **Assumptions:** use the approved Prototype V2 Riverside 2027 fixture and
  accepted M1 shell; all displayed content is static, illustrative design
  content, not live data or a production API contract.
- No user research is claimed. C1–C4 remain held as recorded in M0
  dependencies; this design does not resolve them.

## Main flow

1. Enter Elections and identify Riverside → 2027 Church Board → Ministry →
   Church Elder in the labeled content-header context.
2. Read the compact opening summary. It separates election decision from
   candidate response; an elected-but-awaiting-response opening is not filled.
3. Use the persistent session toolbar to identify the active participant
   session (Church Elder · Round 2 · Open). Its four clearly marked MOCK
   affordances are link copy, QR preview, participant preview, and presentation
   preview. These are non-election-mutating design affordances, not real links,
   tokens, generated QR data, or viewer integration.
4. Open Polls. The poll history marks Round 1 as **Viewed** and Round 2 as
   **Active** independently. The selected closed Round 1 details show eight
   aggregate ballots, recorded outcomes and the distinct response state. When
   Round 2 is selected, authenticated-admin results show its live aggregate
   ballot totals while voting remains open.
5. Switch to Candidates to inspect the effective position-wide roster. Keep the
   viewed poll and active session identities in view; display current effective
   status separately from the Round 1 snapshot and response.
6. To inspect the approved nomination poll, select it in history. Its approved
   roster is visible; original nomination submissions stay collapsed for
   traceability. Round 2 remains the active session.

### Viewed vs active safeguard

Keep a persistent, compact toolbar across Polls and Candidates with separate
labels and values for **Active participant session** and **Viewed poll**. On a
mismatch, use plain text such as “Viewing Round 1 · Closed; participant session
remains Round 2 · Open.” The poll-history item has a **Viewed** marker and an
independent **Active session** marker; status color is secondary to these
labels. Context browsing, history selection, Polls/Candidates navigation,
mock-link copy, QR, and mock previews cannot alter active-session identity,
status, or links. Preview copy explicitly names the active poll and says
“MOCK”; it must not silently preview the viewed historical poll. If no session
exists, show “No active participant session”—never infer one from the viewed
poll or a draft.

No mutation affordance is rendered, including disabled or placeholder
controls. Recorded decisions and responses are plain text/status labels, not
editable fields. The mock share/preview actions are the only action-like
affordances in the composition; they do not represent election changes.

## Screen and component map

| Area | Purpose and content | Read-only treatment |
| --- | --- | --- |
| M1 application shell | Full-label Elections and Settings destinations; Church settings and Term management remain the only Settings links. | No workspace hierarchy or new destination in the sidebar. |
| Content context | Four labeled values, in order: Church, Term, Department, Position. | Viewed context only; no new hierarchy controls or routes are implied by this reference. |
| Position summary | Position name; openings, elected, accepted/filled, and remaining-to-fill counts; opening assignment, decision and latest response. | Text and status badges only. “Filled” counts Accepted responses, not Elected decisions. |
| Session/share toolbar | Active position/poll/status, separate viewed-poll cue, and compact MOCK link/QR/preview affordances. | No real bearer token, destination, QR payload, viewer, publication, or activation control. |
| Polls/Candidates navigation | Two full-label destinations under the position; retain view context across the switch. | Tab/route navigation only; no session changes. |
| Poll history | Typed nomination/voting poll labels, status, Viewed and Active markers. | Selecting a poll only selects administrator viewing state. Do not label every closed poll “immutable.” |
| Selected poll | Nomination roster/traceability, or voting snapshot; closed Results and recorded Decisions together; Audit separate. | Static recorded values. No edit, save, response, reveal, lifecycle or outcome controls. |
| Candidates | Position-wide candidate names with current effective status and separate candidate response where applicable. | Does not rewrite or imply a poll snapshot. |

Use the existing shadcn visual language and only the primitives needed for this
surface: `Sidebar`/`SidebarMenu`, `Breadcrumb` or labeled context group,
`Card`, `Badge`, `Tabs`, `ScrollArea` only if a bounded history list is needed,
`Separator`, `Progress` for aggregate vote share, and `Skeleton` for loading.
Use semantic links for navigation, never disabled buttons as scope teasers.
Prefer compact labeled sections to nested, oversized cards. Status chips use
muted neutral/teal with explicit text; keep the approved restrained slate/gray
surface palette. Do not add a component library or destination.

### Closed poll: results and recorded decisions

At desktop, show a compact history column beside one detail panel. In each
candidate row, make the source-snapshot name, votes and rounded percent, and
recorded decision scannable together. The panel heading states “8 ballots
cast”; the denominator is ballots cast. Percentages are rounded independently
(so they may total 101%). Never display individual ballots, ballot choices,
identifiers, or voter identities. State plainly that these are aggregate
counts. Elaine's recorded decision is **Elected**; her latest response is
**Awaiting response**. Do not conflate the two or present response controls.
Audit is a separate destination/view, not another field or mutation control in
the results-and-decisions panel.

### Open poll: administrator live aggregate view

When viewing the open Round 2 poll, present aggregate results to the
authenticated administrator as the existing product behavior requires. Keep
the view read-only and use the poll snapshot's two candidates: four ballots
cast, Marcus Hill 3 votes (75%), Priya Nair 1 vote (25%). Explicitly label the
static gallery values **MOCK admin snapshot · not live backend data**. These
are aggregate counts only, with no individual ballot or voter data. Do not
hide admin totals based on C1/C2; those holds concern audience/publication
visibility. Do not add a participant/presentation publication affordance,
published indicator, or viewer design.

### Approved nomination poll

Show **Nomination Poll 1 · Approved**, its five-candidate approved roster, and
an initially collapsed “Original nomination traceability” disclosure. The
disclosure preserves the seven original submissions (including “Elain Brooks”
and “Priya N.”) without suggesting M2 editing/consolidation capability. The
active Round 2 session remains visible in the toolbar.

### Open, draft, and active states

- The supplied fixture's Round 2 Open state may be selected and marked both
  **Viewed** and **Active session**. Keep the same session toolbar and label the
  state. Its source-snapshot candidates are Marcus Hill and Priya Nair. The
  authenticated administrator view includes the poll's live aggregate totals
  while voting is open, as already specified in Prototype V2, PD-019 and the
  API contract. In static UX artwork these values must be labeled as a MOCK
  snapshot—not a live backend feed. The requested illustration shows 4 ballots
  cast: Marcus Hill 3 (75%), Priya Nair 1 (25%). Percentages use ballots cast.
- Live aggregates here are admin-only and read-only; no individual ballots,
  voter identity, or choices are shown. C1/C2 concern audience/publication
  visibility, not this authenticated-admin result view. Do not infer or design
  participant or presentation publication from admin access; their existing
  visibility controls and policy remain outside this UX scope.
- A draft is not present in the initial Riverside Elder fixture. The gallery
  includes a clearly labeled **state treatment only** for a draft snapshot; it
  does not add a poll count, candidate list, or real Round 3. A draft is not an
  active session, and no create/open/advance controls are shown.
- If a selected draft, closed poll, or another position does not match the
  active session, retain the active-session identity and make the mismatch
  explicit. Do not change toolbar contents to match the viewed item.

### Empty, loading, and error states

- **No active session:** retain the toolbar location and state “No active
  participant session.” Keep this separate from “no poll selected” and from a
  draft. No activation prompt or substitute poll.
- **No polls / no candidates:** preserve position and context; use “No polls in
  this position” / “No candidates in this position.” Do not imply setup actions
  or add an empty-state call to create.
- **Loading:** preserve context and stable toolbar geometry; use labeled
  skeletons for summary, history, and detail. Do not briefly show another
  position, poll, tenant, fixture, or prior session as if current.
- **Recoverable error:** keep context visible, state which read failed, and
  provide a retry only if a future approved implementation has a safe read
  retry. Never imply retry changes election state. No silent fixture fallback.
- **Missing or mismatched context:** identify the unavailable Church/Term/
  Department/Position/poll by its available scope; do not render another
  tenant's or session's data.

## Responsive layout

The reference gallery is local, static HTML/CSS with system fonts, no remote
assets, and no scripts. Its screen panels are laid out at a 1440px desktop
viewport and 390px/320px mobile viewport widths; the browser's vertical
scrollbar gutter reduces available content width, as in the accepted M1
captures. The panels scale to the available page width without changing fixture
data.
The approved M1 screenshot comparison and validation are linked below as visual
provenance, not copied or altered.

| Viewport | Geometry and behavior |
| --- | --- |
| 1440px | 246px full-label sidebar; content column uses remaining width. Four context values share a row. Summary and session toolbar remain compact. Poll history and selected detail use two columns. Candidate rows align into labeled columns. |
| 390px | Mobile shell and full-label destinations. Context values wrap as Church; Term/Department; Position. Summary uses two columns. Toolbar wraps its four MOCK actions without a giant stacked card. Poll history precedes the selected detail; candidate rows become labeled vertical records. |
| 320px | All context values stack, full text wraps, and toolbar actions use a compact two-column wrap. History and details stack; no horizontal page overflow or clipped content. No horizontal scroller for poll/candidate content. |

Below the desktop workspace breakpoint, remove the sidebar from the content
column and use the accepted M1 mobile navigation pattern; do not repeat context
inside it. Wrap long church, position, and candidate names. Keep Polls,
Candidates, Viewed, Active session, status, counts, and decisions fully
understandable at every width. The gallery's supplemental 390px open-sheet
reference shows all application destinations without repeating hierarchy
context. Do not alter fixture values between states or viewports.

## Source provenance and fixture

The accepted source is `docs/prototype-v2/src/model.ts` (Riverside, 2027
Church Board, Ministry, Church Elder, its three typed polls, nomination source
submissions and Round 1 decisions) and
`docs/prototype-v2/src/features/admin/AdminView.tsx` (aggregate display and
ballots-cast percentage behavior). The workflow and navigation boundary come
from the [Prototype V2 README](../../prototype-v2/README.md) and Code Map in
the root `README.md`. Existing open-poll authenticated-admin live-result
behavior is also documented in the [API contract](../../technical/api-contract.md),
[product decisions](../../product/product-decisions.md) (PD-019), and
[architecture](../../technical/architecture.md). C1/C2 in M0
[dependencies](../WEB-NEXT-M0/dependencies.md) address audience/publication,
not admin result access. The
accepted shell is grounded in M0
[`ux-refinement.md`](../WEB-NEXT-M0/ux-refinement.md), the M1
[screenshot comparison](../WEB-NEXT-M1/screenshot-comparison.html), and M1
[UX validation](../WEB-NEXT-M1/ux-validation.md). Prior M0 artwork includes
decision and response edit controls; this M2 proposal intentionally removes
them.

The same initial Riverside Elder values appear at all widths and in its
supplementary poll/candidate views:

| Item | Display value |
| --- | --- |
| Context | Riverside Seventh-day Adventist Church → 2027 Church Board → Ministry → Church Elder |
| Position summary | 2 openings · 1 elected · 0 accepted · 2 remaining to fill |
| Openings | Opening 1: Elaine Brooks · Elected · Awaiting response. Opening 2: Vacant. |
| Poll history | Nomination Poll 1 · Approved; Round 1 · Closed; Round 2 · Open. |
| Active participant session | Church Elder · Round 2 · Open. |
| Viewed historical poll | Church Elder · Round 1 · Closed. This selected history view does not change the active session. |
| Round 2 admin live aggregate | MOCK admin snapshot · not live backend data · 4 ballots cast; Marcus Hill 3 (75%), Priya Nair 1 (25%). No individual ballot or voter details. |
| Round 1 aggregate | 8 ballots cast; Elaine Brooks 3 (38%), Marcus Hill 2 (25%), Priya Nair 2 (25%), Robert James 1 (13%), Sofia Martinez 0 (0%). Percentages use ballots cast, not total selections; individual ballot selections and voter identities are not shown. |
| Round 1 recorded decisions | Elaine Brooks · Elected; Marcus Hill · Advanced; Priya Nair · Advanced; Robert James · Eliminated; Sofia Martinez · Declined (legacy recorded decision value). |
| Position-wide current effective status | Elaine · Elected; Marcus · Advanced; Priya · Advanced; Robert · Eliminated; Sofia · Declined (legacy recorded decision value). Elaine's response remains Awaiting response. |
| Approved nomination roster | Elaine Brooks, Marcus Hill, Priya Nair, Robert James, Sofia Martinez. Seven original submissions; Elaine's “Elain Brooks” and Priya's “Priya N.” remain in collapsed source traceability. |

Sofia's “Declined” is a legacy **recorded decision** in the prototype fixture,
not a candidate response and not a newly endorsed decision choice. This design
does not reinterpret it. The initial fixture has no response event for Elaine,
so “Awaiting response” is shown distinctly from her Elected decision. The
fixture has no replacement events; M0's reduced model cannot represent
replacement-bearing lifecycles, so do not project a replacement-aware final
status or imply that “remaining to fill” is a lifecycle/finalization rule.
“Remaining to fill” here is the requested opening summary count, not an
automated outcome.

**Open-round fixture note:** the four-ballot Round 2 MOCK aggregate snapshot
matches the authoritative `docs/prototype-v2/src/model.ts` fixture: Marcus
Hill 3 (75%), Priya Nair 1 (25%). The static snapshot is not a live backend
feed.

## Mock/share boundary and exclusions

- Toolbar art is explicitly **MOCK**: copy mock voter link, mock QR preview,
  mock participant preview, mock presentation preview. These affordances are
  proposals for non-election-mutating local development previews only. No
  bearer token, link destination, functional QR, actual copy operation,
  participant/presentation viewer, audience, or integration is represented.
- No nomination, poll, decision, response, result publication, visibility,
  activation, setup, save, open/close/start, add, advance, finalize, reopen,
  reveal, or replacement mutation controls; not even disabled controls.
- No ballot-level or voter-identifying information. No majority, tie-break,
  recommendation, automation, replacement inference, or outcome policy.
- C1–C4 remain held. C1/C2 concern audience/publication; they do not suspend
  authenticated-admin live aggregate results. No viewer-publication design and
  no resolution of legacy Declined semantics. Historical inspection is a
  read-only M2 presentation scope, not a change to the immutability or revision
  policy.
- No new Dashboard, destination, route, backend, authentication simulation,
  real API claim, dependency, production-data claim, or app/prototype changes.

## Accessibility and interaction requirements

Accessibility target for a future approved implementation: **WCAG 2.2 AA**.
These hand-authored references were not browser- or assistive-technology-tested;
no accessibility conformance or real-user testing is claimed.

- Use landmarks, one descriptive `h1`, ordered headings, skip link, semantic
  navigation and visible full labels. Give context values programmatic labels.
- Keep keyboard order aligned with the visual flow: application navigation →
  context → position summary → active session/share → Polls/Candidates →
  history → selected poll or Candidates. Keep visible focus and no keyboard
  trap; support zoom and reflow at 320 CSS px.
- Expose the selected poll as the current viewed item (for example
  `aria-current="page"`), independently expose active-session status, and make
  the viewed/active distinction understandable without color. Do not move
  focus or change session on selection.
- Use semantic table headers on wide result views; on narrow views retain
  explicit labels for votes, percentage, election decision, and response.
  Accessible names describe percentages as of ballots cast. Do not expose
  ballot-level data in accessible text.
- Use text labels and icons/color only as secondary cues. Validate text and
  non-text contrast, visible focus, target size, screen-reader announcements,
  disclosure keyboard support, and 200% zoom in implementation QA.
- Label the original-submission disclosure with its purpose and keep it closed
  by default. Do not announce a static viewed poll as a live update.
- Future asynchronous read errors, missing context, and session state changes
  need truthful status announcements without exposing identity or falling back
  to another scope.

## Objective design acceptance criteria

These are UX review checks for PO approval, not completed app tests:

1. The desktop reference has a 246px full-label sidebar; the mobile open-sheet
   reference shows all existing destination labels. At all three viewport
   widths, context labels are ordered and the rendered reference has no
   horizontal overflow/clipping.
2. All Riverside Elder widths show the same 2 / 1 / 0 / 2 opening figures,
   same Opening 1 and 2 states, same five result counts/percentages, and same
   poll/session identities.
3. A viewer can identify Round 1 as Viewed and Round 2 as Active without color
   alone; choosing Polls/Candidates or a historical poll is explicitly
   non-activating.
4. Closed Round 1 shows aggregate results and recorded decisions together,
   Audit apart; no individual ballots or identity information appears.
5. The Elected decision and Awaiting response remain separate. Only Accepted
   counts as filled; no response control is present.
6. Candidates distinguish the current effective status from poll-snapshot
   decisions and candidate response. Sofia's legacy recorded Declined label is
   not a response.
7. Nomination displays the approved roster and a collapsed original-submission
   traceability disclosure. The open Round 2 admin view shows four MOCK ballots
   (Marcus 3 / Priya 1; 75% / 25%), labeled as non-live-backend artwork; a draft
   is not treated as an active session.
8. No mutation control listed in the story appears, even disabled. All mock
   share/preview labels explicitly say MOCK and claim no integration.
9. Loading, error, no-active, empty, missing/mismatch states retain context and
   never silently substitute another poll, session, tenant, or fixture.
10. PO approval of both story scope and this UX is recorded before any M2 app
    work begins.

## Product Owner approval record

On 2026-11-09, the Product Owner approved the M2 scope and UX references and
authorized Phase 2 implementation, subject to these explicit constraints:

- Keep implementation within the approved read-only scope.
- All share/preview affordances remain explicitly **MOCK**; add no real access
  links, QR tokens, or credentials.
- “Persistent session/share module” means the toolbar remains available during
  workspace navigation, not backend persistence.
- Approve the four proposed treatments without exception: MOCK-only
  share/preview, collapsed nomination traceability, Sofia’s legacy “Declined”
  recorded-decision label, and schematic draft/no-active/empty states.
- Final acceptance remains subject to T007 verification and T008 review.
  Merge and deployment are not authorized.
