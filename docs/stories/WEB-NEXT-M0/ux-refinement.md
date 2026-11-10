# WEB-NEXT-M0 · Refined position workspace reference

**Status:** One refined static visual direction prepared at the Product Owner's request. It combines A's clear neutral application navigation, B's wider workspace, and C's restrained teal status accent. This is design exploration only: no M1 implementation or final theme approval is authorized.

## Static references

Open the [responsive refinement gallery](visual-refinement/index.html):

| Reference | Canvas | Purpose |
| --- | ---: | --- |
| [Desktop workspace](visual-refinement/position-workspace-1440.svg) | 1440 × 1280 | Full application nav, content-header context selectors, position summary, permanent share/preview toolbar, poll history, and closed Round 1 result/decision rows. |
| [Mobile workspace](visual-refinement/position-workspace-390.svg) | 390 × 2440 | Complete vertically scrolling workspace with stacked controls and all five candidate rows. The long canvas represents ordinary page scrolling, not an unusually tall device. |
| [Compact workspace](visual-refinement/position-workspace-320.svg) | 320 × 2580 | Same content at the narrowest requested width; all four context selectors stack, no horizontal page scroll is intended, and the complete list remains below the fold. |
| [Mobile navigation open](visual-refinement/mobile-navigation-sheet-390.svg) | 390 × 844 | Supplemental Sheet-style application menu showing only approved navigation destinations, with no church/term/department/position context. |

These are hand-authored static SVG references and an HTML gallery. They use local system fonts, do not load remote assets, and have no runtime React/dependency requirement. Selects, tabs, links, actions, and the mobile Sheet are drawn only; none is interactive. The references are not installed shadcn components, rendered app screenshots, UX research, or validated UI.

## Refined direction

- **Professional neutral base:** soft gray page, white work surfaces, dark slate text, modest borders, restrained shadows/radii. The visual system gives the election work area most of the available width.
- **Navigation distinct from context:** a persistent 246px desktop application sidebar lists full-label **Elections** and a **Settings** group with **Church settings** and **Term management**. No selected Church, Term, Department, or Position appears in the sidebar. The full wordmark is “Church nominations”; there is no lettermark/avatar stand-in. Icons are secondary to text labels.
- **Context in the content header only:** Church → Term → Department → Position appear as compact, labeled selectors in that order. At 390px they wrap into church, term/department, and position rows; at 320px all four stack vertically. Context is visually separate from app-level destinations.
- **Wider workspace:** the sidebar is slimmer than Direction A; the content area has room for a compact poll navigator beside dense result/decision rows at desktop. At narrow widths, navigator and detail become stacked, not a squeezed table or horizontal scroller.
- **Restrained status accents:** one muted teal dot/bar supplements explicit “Open”, “Active session”, “Closed”, and “Viewing” text. The selected application destination is a soft neutral fill with a small edge cue, not a saturated nav panel.
- **No feature changes:** the position summary, poll/candidate tabs, compact poll history, existing result/decision controls, and share/preview toolbar reflect approved prototype behavior. No dashboard, reports, new settings page, poll control, publication control, automatic draft, or replacement path is introduced.

## Navigation and destination mapping

The approved source evidence is [Prototype V2 README](../../prototype-v2/README.md): `/admin/setup` is the administrator term workspace, `/admin/setup/churches` is church settings, `/admin/setup/terms` is term management, and `/admin` is the position poll workspace.

| Visible destination | Existing destination mapping | Treatment in reference |
| --- | --- | --- |
| **Elections** | `/admin/setup` — existing term workspace | Selected application-level navigation item. |
| **Settings** | Group heading, not a new route | Contains only the two existing settings destinations below. |
| **Church settings** | `/admin/setup/churches` | Full text label under Settings. |
| **Term management** | `/admin/setup/terms` | Full text label under Settings. |
| Position workspace | `/admin` | Main content for the selected position, not a duplicate sidebar hierarchy item. |

No separate Dashboard destination is approved in the reviewed source. **Dashboard is omitted pending Product Owner approval.** Do not add a generic Settings page or add Elections/Settings sub-destinations beyond those mapped above.

## Workspace content and fixture provenance

The reference deliberately selects closed **Church Elder · Round 1** for viewing while the separate **Church Elder · Round 2 · Open** participant session remains active. Viewing the closed poll is not participant activation and does not change the active poll. The closed poll is labeled “Viewing”, not “immutable” or “read-only”; this is the non-historical 2027 fixture (source term status: Preparing), and its existing decision-revision permissions remain in effect.

The visual content mirrors the 2027 Elder fixture in `docs/prototype-v2/src/model.ts` and the existing composition in `docs/prototype-v2/src/features/admin/AdminView.tsx`. Approved workflow references consulted include the [roster desktop](../../prototype-v2/screenshots/approved-roster-desktop-1440x900.png), [roster mobile](../../prototype-v2/screenshots/approved-roster-mobile-390x844.png), and [ready-to-finalize desktop](../../prototype-v2/screenshots/ready-to-finalize-desktop.png):

| Displayed item | Fixture value |
| --- | --- |
| Context | Riverside Seventh-day Adventist Church → 2027 Church Board → Ministry → Church Elder |
| Position summary | 2 openings · 1 elected · 0 accepted · 2 unfilled |
| Opening summary | Opening 1: Elaine Brooks, election decision Elected, candidate response Awaiting response. Opening 2: Vacant, no election decision. |
| Participant session | Round 2, Open; shown separately from the viewed Round 1. |
| Poll history | Nomination 1 · Approved; Round 1 · Closed · Viewing; Round 2 · Open · Active session. |
| Round 1 aggregate | 8 ballots cast; Elaine Brooks 3 (38%), Marcus Hill 2 (25%), Priya Nair 2 (25%), Robert James 1 (13%), Sofia Martinez 0 (0%). Percentages are rounded from ballots cast. No ballot IDs, individual choices, or voter identities are shown. |
| Round 1 decisions | Elaine Brooks · Elected; Marcus Hill · Advanced; Priya Nair · Advanced; Robert James · Eliminated; Sofia Martinez · Declined (legacy prototype fixture value). |
| Elected candidate response | “Awaiting response” is a separate response state from Elaine's Elected poll decision; existing Record acceptance / Record decline controls are depicted as static examples. |
| Decision note | “Committee reviewed the first poll and selected candidates for the next round.” Existing prototype fixture note. |

All data is explicitly illustrative, copied only as representative approved-prototype fixture content. This does not imply live data, an API contract, storage behavior, or a new dynamic application experience. The Round 1 “Declined” decision is shown to match that source fixture, not to resolve its discrepancy with the separate candidate-response policy.

The permanent toolbar shows existing safe link/preview affordances: copy voter link, show QR, preview voter, open Presentation, and copy Presentation link. These do not activate or switch the participant session. The reference intentionally excludes the prototype's aggregate participation/presentation visibility controls and any result publication change, pending policy conflict resolution.

## Responsive behavior

- **1440px:** full-label 246px application sidebar; content-header selectors stay in one ordered row; a position summary and permanent session/share strip precede Polls/Candidates; poll history and the main closed-poll workspace sit side by side. Dense result/decision rows provide separate columns for candidate/result, election decision, and elected-candidate response.
- **390px:** sidebar is closed behind a visible, text-labeled Menu trigger; context selectors occupy the content header in a compact stacked/wrapped arrangement; position opening metrics/details, active-session/share actions, Polls/Candidates, history, then selected-poll content stack vertically. Candidate results and decision controls form labeled rows; Elaine's separate response state/actions have their own sub-panel.
- **320px:** keep full navigation labels in the Sheet and full context names in the selectors; stack each context selector and each candidate's controls; allow long vertical scrolling. Do not truncate essential labels or create page-level horizontal scroll.
- **Mobile nav open:** the supplemental 390 × 844 capture shows app navigation only: Elections, Settings, Church settings, Term management. It does not duplicate current church/term/department/position selection.

The 390/320 SVG heights are complete content canvases, not claimed browser screenshots at those viewport heights. At actual viewports the page scrolls normally. No content at the bottom is intentionally clipped.

## shadcn pattern and component map

The references use familiar patterns from the official [shadcn Blocks](https://ui.shadcn.com/blocks) and component library. This is a concept map, not a commitment to install every component or copy a registry block.

| Visual pattern | Potential component |
| --- | --- |
| Separate grouped application navigation, full-label items, desktop inset, mobile trigger | [`Sidebar`](https://ui.shadcn.com/docs/components/sidebar), `SidebarProvider`, `SidebarGroup`, `SidebarMenu`, `SidebarInset`, `SidebarTrigger` |
| Labeled mobile navigation overlay | [`Sheet`](https://ui.shadcn.com/docs/components/sheet), `SheetContent`, `SheetTitle`, `SheetTrigger` |
| Ordered selectors for Church → Term → Department → Position | [`Breadcrumb`](https://ui.shadcn.com/docs/components/breadcrumb) paired with `Select` controls; selectors in the content header, never in the app sidebar |
| Compact position/session actions | [`Button`](https://ui.shadcn.com/docs/components/button) |
| Open/Closed/Active/viewed status labels | [`Badge`](https://ui.shadcn.com/docs/components/badge) or inline text+dot; status never color-only |
| Polls/Candidates and Results & decisions/Audit distinctions | [`Tabs`](https://ui.shadcn.com/docs/components/tabs) |
| Dense desktop candidate/result/decision rows | [`Table`](https://ui.shadcn.com/docs/components/table); at narrow widths render equivalent labeled stacked rows, not forced horizontal table scrolling |
| Section boundaries and metric grouping | [`Separator`](https://ui.shadcn.com/docs/components/separator) |

Use the currently configured `base-nova` primitive family consistently if implementation is later authorized. The old `new-york` sidebar examples were previously consulted as layout references only; this design does not ask to mix their components into the current family. Official [shadcn theming guidance](https://ui.shadcn.com/docs/theming) recommends semantic CSS variables; [shadcn/create](https://ui.shadcn.com/create) is the official theme builder. No app tokens were changed and no theme was selected here.

## Proposed visual tokens (illustrative, not final)

The current M0 theme values remain provisional. These neutral examples describe the refinement only:

| Semantic token | Sample |
| --- | --- |
| `background` | `#F3F5F6` |
| `foreground` | `#263B47` |
| `card` | `#FFFFFF` |
| `primary` | `#304E5B` |
| `primary-foreground` | `#FFFFFF` |
| `muted` | `#EEF2F3` |
| `muted-foreground` | `#657780` |
| `border` | `#D5DEE2` |
| `accent` / selected context | `#F0F3F4` |
| restrained status accent | `#739B98` / `#378276` |
| `ring` | `#246A70` (candidate value; contrast review still required) |

Typography: local system sans-serif; page heading 23–26px; candidate names 14–15px; body/control labels 12–14px; low-emphasis annotation in the SVG is not a production text-size recommendation. Use a modest 4/8/12/16/24/32px spacing scale and 40–44px minimum control height on touch screens. Validate all semantic token pairs and focus treatments before implementation.

## Workflow and policy constraints preserved

- Changing the church, term, department, position, or viewed poll changes viewing context only.
- Current active participant session remains separately visible; opening/switching it is a separate, explicit workflow and is not triggered by browsing, poll selection, copy, QR, or preview.
- Round 1 result totals and decision statuses appear together; the Audit destination remains separate.
- Election decision **Elected** and candidate response **Awaiting response** remain explicitly separate. Response controls are shown only for the elected candidate.
- Polls and the position-wide Candidates view remain distinct.
- Current-term revision semantics are not turned into an “immutable historical poll” claim. The sample closed Round 1 decision controls indicate current source behavior; all displayed controls remain noninteractive artwork.
- No publication/audience visibility control or policy is proposed. Known C1 (participation visibility), C2 (result visibility), C3 (legacy Declined semantics), and C4 (later-poll behavior) in [dependencies.md](dependencies.md) stay unresolved. The visual does not resolve them, add next-round automation, invent replacement behavior, or alter ballot confidentiality.
- No Dashboard, reports, new settings destination, or workflow is introduced.

## Accessibility and state requirements for future implementation

These are design requirements only. No keyboard, screen-reader, axe, contrast, browser, or usability testing was performed for these static references.

- Use semantic navigation, a skip link, clear page/section headings, and form labels programmatically associated with each hierarchy selector. Preserve full text names in accessible names and programmatic breadcrumb order.
- Every app-nav entry must have its full visible text label; icons are supplemental. The mobile menu trigger must be named “Open navigation” (or equivalent), and the Sheet needs a labeled title, focus containment on open, Escape/close behavior, and focus return to its trigger.
- Keep keyboard order coherent: app navigation → content-header context selectors → position summary → active session/share actions → Polls/Candidates → poll history → selected poll details. Do not treat selecting/viewing a historical poll as activation.
- Mark the selected poll for assistive technology as the current viewed item; independently announce active-session status. Do not label the viewed Round 1 as immutable/read-only. Keep current-term authorization and decision-revision semantics intact.
- Closed-poll result and decision information remains perceivable as a logical candidate group/table row. A table must have associated column headers; mobile stacked rows must preserve labels such as “Election decision” and “Candidate response”.
- Statuses use text with color as a secondary cue; chosen/focus states have a visible non-color-only outline and sufficient contrast. Validate text and non-text contrast to WCAG 2.2 AA before implementation. Keep touch targets approximately 44×44 CSS px where feasible.
- Provide loading, recoverable error, and empty states without swapping tenant or silently falling back to fixtures. Announce real asynchronous updates appropriately; static context labels should not be repeatedly announced.

## M1 approval gate / acceptance checklist

This refinement is not a final visual approval or implementation authorization. Before an M1 shell is built, the Product Owner must approve or revise this single direction and authorize a separate implementation scope. Preserve the earlier [three-option comparison](ux-directions.md) and [gallery](visual-options/index.html) unchanged.

For any separately authorized M1 implementation:

1. Keep application navigation separate from context selectors; retain the full-label Elections destination and the Settings group with only the mapped destinations above. Dashboard remains omitted unless explicitly approved.
2. Keep Church → Term → Department → Position selectors in the content header and preserve their full names at 1440, 390, and 320px.
3. Keep active Round 2 participant session distinct from viewed Round 1; selection, browsing, link copying, QR, and preview do not activate or switch sessions.
4. Preserve prototype fixture values and distinctions shown here; do not turn illustration into API/security claims or add source ballot/identity information.
5. On closed polls keep results and decisions together and Audit separate; preserve Elected vs candidate response as distinct state. Follow existing allowed current-term edit semantics.
6. Preserve existing status/action policy; C1–C4 remain blockers to the respective audience/result/decision/next-poll behavior until resolved outside this design scope.
7. Test responsive behavior at 1440/390/320, keyboard and screen-reader operation, contrast, and accessibility to WCAG 2.2 AA; record actual evidence. No such testing is claimed by this design artifact.
8. Use semantic CSS variables and one coherent selected shadcn primitive family only after explicit Product Owner visual approval. Do not modify `apps/web-next` before that approval.
