# WEB-NEXT-M0 · Static visual directions for M1

**Status:** Three static alternatives prepared after M0 validation, as requested by the Product Owner. This is design exploration only. No theme is approved, no Admin shell is implemented, and no application source was changed.

## Deliverables

Open the [responsive comparison gallery](visual-options/index.html) or select a direct reference:

| Direction | Desktop 1440 | Mobile 390 | Compact 320 |
| --- | --- | --- | --- |
| **A · Quiet neutral grouped navigation** | [SVG](visual-options/direction-a-desktop-1440.svg) | [SVG](visual-options/direction-a-mobile-390.svg) | [SVG](visual-options/direction-a-compact-320.svg) |
| **B · Cool blue compact inset** | [SVG](visual-options/direction-b-desktop-1440.svg) | [SVG](visual-options/direction-b-mobile-390.svg) | [SVG](visual-options/direction-b-compact-320.svg) |
| **C · Teal site header, context first** | [SVG](visual-options/direction-c-desktop-1440.svg) | [SVG](visual-options/direction-c-mobile-390.svg) | [SVG](visual-options/direction-c-compact-320.svg) |

These are hand-authored, self-contained SVG illustrations with local system fonts and sample color tokens. They are inspired by official shadcn layout patterns; they are not installed/copied registry blocks, rendered React, functional prototypes, or accessibility-tested interfaces. Their “future position workspace” panels are explicitly read-only outlines, not implemented screens or additional product scope.

## Product and workflow anchors

- **Users and goal:** an administrator needs to locate a church term, department and position, then understand which context is being viewed without confusing it with the participant session. The shell should make location and session state legible, not introduce new work.
- **Navigation order:** **Church → Term → Department → Position**. The full path remains visible in every reference, including at 320px.
- **Viewing is not activation:** moving among hierarchy contexts or selecting a historical poll changes the viewing context only. It must not activate, replace, or clear the participant session. Historical poll selection remains read-only. Each option shows a distinct active-session panel and “Viewing history · session unchanged” state.
- **Approved workflow reference:** Prototype V2 remains authoritative for workflow and interaction behavior. The [approved roster desktop](../../prototype-v2/screenshots/approved-roster-desktop-1440x900.png) and [mobile](../../prototype-v2/screenshots/approved-roster-mobile-390x844.png) show the persistent participant-session context, poll history, historical-view label, and approved candidate roster. The [finalized vacancy desktop](../../prototype-v2/screenshots/finalized-vacancy-desktop.png) and [mobile](../../prototype-v2/screenshots/finalized-vacancy-mobile.png) reinforce that historical content remains visible and distinct from session controls. Prototype V2 is a browser-local simulation, not production behavior.
- **Future scope only:** the outline lists position summary, poll history, candidates, and results/decisions solely to show placement. No dashboard, reports, new feature, or workflow action is proposed.
- **Dependencies:** persisted terms/departments, a unified poll/history source, and verified session resolution are separate integration dependencies in [dependencies.md](dependencies.md). These drawings do not imply those APIs or integration have been implemented.
- **Policy conflicts:** the known presentation participation, result-publication, legacy “Declined” decision, and automatic/follow-on poll differences in [dependencies.md](dependencies.md) remain excluded and unresolved. Do not infer a viewer, audience, ballot, results, or decision policy from the shell examples.

## Three alternatives

### A · Quiet neutral grouped navigation — recommended

Follows the simple grouped-navigation structure of official `sidebar-01`. The hierarchy is explicit and scannable in the sidebar; the content header repeats the full breadcrumb. White surfaces, quiet neutral backgrounds, and one dark-blue primary accent preserve hierarchy without making the shell itself feel like a dashboard.

**Why recommend it:** best fit for a context-heavy admin tool; predictable labels make the four-level hierarchy discoverable; subdued color keeps focus on election content and historical/current distinctions. It has the lowest navigation-learning risk.

**Tradeoffs:** widest desktop navigation footprint; at mobile widths navigation is behind a labeled menu/sheet entry, so opening the hierarchy takes an extra step. Repeating the full context in both sidebar and breadcrumb uses space intentionally for orientation.

### B · Cool blue compact inset

Uses an icon rail and a spacious inset workspace, inspired by the collapsible-icon behavior of official `sidebar-07`. The breadcrumb always gives the complete hierarchy in text; the icons are an additional compact navigation affordance, not the sole representation of context.

**Why consider it:** more room for future workspace content at desktop; the blue accent provides a clear active-position cue; compact rail reduces persistent navigation width.

**Tradeoffs:** icon-only navigation is less discoverable and raises tooltip/accessible-name requirements; it should not be selected unless a usability review confirms the hierarchy remains easy to navigate. The inset surface adds framing and visual weight compared with A.

### C · Teal site header, context first

Uses a persistent site header and a highly visible, four-level context band, inspired by official `sidebar-16`'s sticky header pattern. The hierarchy is the first major content cue, with a calm teal palette.

**Why consider it:** strongest sense of place; full context stays easy to scan; a sticky brand/header can keep orientation when a future workspace is long.

**Tradeoffs:** context band and header consume more vertical space, especially on mobile; repeated context can crowd a narrow viewport; the saturated teal establishes the strongest brand feel and therefore is the least neutral option.

### Recommendation and approval boundary

I recommend **Direction A as the starting point for Product Owner review**, not as a final theme choice. Direction B is the compact-space alternative if workspace width becomes the priority; Direction C is the context-first alternative if stronger location cues are preferred. The Product Owner must select or reject a direction before visual tokens are finalized or an Admin shell is implemented. No alternative is approved by this document.

## Component map and official references

| Proposed pattern | Likely component mapping (for future authorized implementation) | Reference |
| --- | --- | --- |
| Grouped or collapsible navigation, inset, trigger | `Sidebar`, `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `SidebarGroup`, `SidebarMenu`; `Sheet` for a narrow-screen navigation drawer | [shadcn Blocks](https://ui.shadcn.com/blocks), [Sidebar](https://ui.shadcn.com/docs/components/sidebar), [Sheet](https://ui.shadcn.com/docs/components/sheet) |
| Ordered church/term/department/position location | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbSeparator`, `BreadcrumbPage` | [Breadcrumb](https://ui.shadcn.com/docs/components/breadcrumb) |
| Nonfunctional menu/trigger and future shell actions | `Button` variants; only if authorized and needed | [Button](https://ui.shadcn.com/docs/components/button) |
| Active/open and historical/read-only labels | `Badge` or inline status with visible text; do not rely on color alone | [Badge](https://ui.shadcn.com/docs/components/badge) |
| Session context and future workspace outline | `Card` and `Separator` where useful; no card for every row by default | [Card](https://ui.shadcn.com/docs/components/card) |

Official layout examples consulted: [`sidebar-01` registry JSON](https://ui.shadcn.com/r/styles/new-york/sidebar-01.json) (simple grouped navigation), [`sidebar-07` registry JSON](https://ui.shadcn.com/r/styles/new-york/sidebar-07.json) (collapsible icon sidebar), and [`sidebar-16` registry JSON](https://ui.shadcn.com/r/styles/new-york/sidebar-16.json) (sticky site header). Their `new-york` paths identify the source examples only; they are layout inspirations, **not** an instruction to mix primitive/style families. The current `apps/web-next` `base-nova` setting remains provisional per M0; use one consistent primitive family if implementation is later authorized.

Official [theming guidance](https://ui.shadcn.com/docs/theming) recommends semantic CSS variables (`background`, `foreground`, `primary`, `muted`, `border`, `ring`, and related pairs) so a direction can be applied without rewriting component classes. The [shadcn/create theme builder](https://ui.shadcn.com/create) is the official visual theme tool; it does not need repository source or a third-party theme service. Current options/styles shown there are exploration choices, not a selection made here.

## Proposed token samples (not approved)

The SVGs show direction-specific samples. These values are visual starting points only; verify contrast before implementation and adjust using the official semantic CSS-variable approach.

| Semantic token | A · Quiet neutral | B · Cool blue | C · Context teal |
| --- | --- | --- | --- |
| `background` | `#F4F6F7` | `#F1F5FA` | `#F2F7F6` |
| `foreground` | `#183D51` | `#1A3B5A` | `#173E40` |
| `card` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| `primary` | `#174A68` | `#1D5CA6` | `#11766F` |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| `muted` / `muted-foreground` | `#EAF1F3` / `#586B75` | `#E7EFF9` / `#526A82` | `#E5F3EF` / `#607874` |
| `border` | `#D7E0E3` | `#D8E2ED` | `#D3E2DF` |
| `ring` | `#007C91` | `#2D70C2` | `#087C71` |

Shared typographic and spacing proposal: local system sans-serif stack (no remote fonts); title 24–28px, section heading 16–18px, body 14–16px, supporting text at least 12px, and a 4/8/12/16/24/32px spacing scale. The wireframe's tiny eyebrow labels are diagram annotations only; final essential labels and controls should be at least 12px. Keep status text visible, with color as a supplementary cue. Use modest 8–12px radii, visible borders, and avoid using shadows/color alone to communicate selected or historical state.

## Responsive behavior

| Width | Direction A | Direction B | Direction C |
| --- | --- | --- | --- |
| **1440px** | 284px grouped sidebar; full breadcrumb; content cards in one column. | 76px rail; full text breadcrumb; inset main canvas. Icon labels must be available by tooltip and accessible name. | Sticky site header, 248px context/navigation column, context-first band and single-column content. |
| **390px** | Sidebar becomes a labeled menu/sheet entry; show complete context across lines; stack session, history, and outline panels. | Rail collapses to a labeled navigation entry; full hierarchy remains in text; inset framing becomes one-column cards. | Header stays compact; stack all four context levels with labels; sidebar is hidden behind labeled navigation entry. |
| **320px** | Preserve all four levels with wrapping; reduce padding, not essential labels; stack panels. | Wrap breadcrumb across lines; keep a visible menu label and full session/history states; avoid shrinking to icon-only. | Stack the four context levels; avoid a horizontal chip row; keep session and historical labels unambiguous. |

At all widths: vertical scrolling is acceptable; avoid page-level horizontal scrolling, clipped labels, hover-only actions, and controls narrower than a comfortable touch target. A narrow `Sheet` is a proposed interaction, not shown open in these static captures. Do not hide or visually merge the active participant session with a selected historical poll to save space.

## User flow and states

1. The administrator identifies or chooses a **Church**, then a **Term**, **Department**, and **Position**, with the current location repeated in the breadcrumb/context band.
2. The shell separately indicates the participant session currently active (or no active session, if that is the verified system state). Merely viewing a context never activates a session.
3. If the administrator views a historical poll, show it as `Historical · Read-only` and keep the participant-session identity/status unchanged. This selection is not a participant activation control.
4. Future position content may occupy the outlined area only after its own approved M1 scope and integration dependencies are resolved.

Future-state presentation requirements:

- **Loading:** preserve the selected hierarchy and show a restrained skeleton or “Loading position context…” status; never silently substitute another church/term/position or claim a session was activated.
- **Error:** show a plain-language, recoverable error with a retry affordance and retained viewing context. Never fall back to another tenant or mock data silently.
- **Empty:** use a neutral state such as “Select a position to view its workspace” or “No position is selected.” Do not invent dashboards, report links, or setup actions.
- **Success/context change:** update the visible breadcrumb and current viewing label. A poll-history change updates only the historical panel; participant-session state remains unchanged.

## Accessibility and interaction requirements for M1

Accessibility target from the UX charter: WCAG 2.2 AA. These are acceptance requirements for future implementation, not evidence that the references or any screen were tested.

- Use semantic landmarks, one clear page heading, a skip link, and a labeled navigation landmark. Breadcrumb items expose the full hierarchy as text and identify the current page; do not encode context in abbreviations or color alone.
- Every icon-only rail item must have an accessible name and visible tooltip on pointer hover/focus. At mobile, expose a text-labeled menu trigger; if implemented as a `Sheet`, give it a name, manage focus on open/close, close with Escape, and return focus to its trigger.
- Keep keyboard order logical (navigation, context, active-session status, historical selection, future workspace). Provide a clearly visible `ring` focus treatment that is not clipped or obscured; never make hover the only way to discover an action.
- Meet WCAG text/non-text contrast requirements for final token combinations; status must have text labels as well as color. Keep body/control text comfortably readable at 320px and maintain touch targets (prefer 44×44 CSS px where space permits).
- Announce an actual asynchronous status/error update with an appropriately scoped live region. Do not repeatedly announce static shell labels or confuse changing the viewed historical poll with participant-session activation.
- Preserve the separation of viewing and participation in keyboard and screen-reader interaction; any eventual session activation control must be distinct, explicit, authorized, and separately specified.

## M1 acceptance criteria and approval gate

**Existing, exact M0 criteria (REQ-007 and constraints):**

> After M0 checks, prepare 2-3 actual visual references for M1 using official shadcn blocks/components/themes. Product Owner selection is required before visual tokens and Admin shell implementation are authorized.

> Future screens require references and validation at 1440px, 390px and 320px, keyboard and screen-reader checks, and accessibility testing.

**M1 design handoff checklist based on the Product Owner's current request** (not a substitute for a separately approved M1 implementation story):

1. Product Owner selects/rejects one direction (or requests a revision) before implementation; no direction or token set is final-approved here.
2. The shell preserves **Church → Term → Department → Position**, and viewing any part of that hierarchy does not activate or change participant activity.
3. A historical poll selection is visibly read-only and never activates, replaces, or clears the participant session; active-session state and viewing state remain separate.
4. Any future workspace content shown in the approved design is identified as future scope and constrained to already approved workflows; no dashboard/reports or new capability is added by shell design.
5. Implementation (if separately authorized) is reviewed at 1440px, 390px, and 320px; no clipped hierarchy or horizontal page scroll; loading/error/empty states are included.
6. Keyboard, screen-reader, and accessibility checks are performed against WCAG 2.2 AA, with results recorded. No such checks are claimed for this design-only deliverable.
7. Visual tokens use semantic CSS variables and one coherent selected shadcn primitive/style family; the provisional M0 setting and these sample palettes are not treated as approval.

No application code, final theme decision, backend work, or implementation authorization is included. This deliverable contains no usability-test evidence, screen-reader evidence, or automated accessibility results.
