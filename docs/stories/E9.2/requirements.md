# E9.2: Consolidate Election Access Cards into Reusable Components

- **Epic:** E9 Bootstrap UI Modernization
- **Type:** Technical debt / component reuse
- **Priority:** P2 (proposed)
- **Workflow status:** Backlog; explicitly deferred to a future implementation session
- **User story:** As a frontend maintainer, I want the participant session-link and audience-presentation cards to use shared presentational components so the election overview and position workflow remain visually consistent without coupling their distinct data or behavior.

## Context and Current Implementation

Two admin surfaces render cards with the same concepts but separate markup and styles:

- The selected-term election overview renders static, inactive demonstration cards inline in `apps/web/src/App.tsx`, under `.demo-link-panels` and `.demo-link-panel`. The examples use `sample://` values, are explicitly marked `DEMO LINK · NOT ACTIVE`, and have no app actions.
- The position workflow renders production-capability-aware cards inline in `apps/web/src/features/nominations/NominationAdminPanel.tsx`, under `.workflow-access-cards` and `.workflow-access-card`. This surface reads real nomination/round/presentation state, conditionally displays real links, and owns copy/open/hide/end event handlers.
- Both patterns have card, title, descriptive-copy, URL, and responsive-layout styling in `apps/web/src/styles.css`, but currently use distinct selectors and slightly different dimensions.

PR #21, **Refine position workflow access layout**, establishes the latest position-workflow composition and is the source baseline for this follow-up. This story is separate, deferred work; it does not authorize implementation as part of PR #21.

## Product Owner Decision (2026-11-01)

- The Participant session link and Audience presentation cards must appear in both the selected election-term overview and the position workflow's current-task view.
- Both surfaces must use the same card structure and visible elements: Participant session link has a code-styled URL and Copy session link button; Audience presentation has the Show audience presentation switch and Open presentation button, with no displayed URL. Open presentation launches the presentation URL. Keep desktop dimensions, padding, border, heading and description typography, switch label, and state consistent. Overview participant sample links stay inactive, so their copy buttons are visible but disabled; the presentation switch and disabled Open presentation button are prototype-only. Keep demo-only status out of the card itself so the shared cards remain visually consistent.
- E9.2 covers administrator pages. Do not invest in designing or optimizing these admin surfaces specifically for mobile; desktop is the design and visual-review target for this story.
- Mobile-first design effort remains focused on voter and read-only presentation experiences, as required by the owning stories.
- Preserve reasonable layout resilience at narrow widths and avoid introducing horizontal overflow, but this is a regression safeguard, not a mobile-admin acceptance or sign-off requirement.

## Problem / Technical Debt

The two independently-authored card layouts duplicate structure and styling. Future visual changes can drift between pages, while extracting the components naively could conflate static mock data with real, capability-gated links and controls. The refactor should share only stable presentation structure and accessible semantics; feature owners must continue to control data, permissions, availability, and actions.

## Scope

- Inventory and document the duplicated card structures and current responsive rules before editing.
- Introduce focused, reusable React presentation components for the shared access-card shell and, where useful, a shared two-card group/layout.
- Migrate the selected-term overview's static participant and presentation examples to the shared presentation primitive(s).
- Migrate the position workflow's real participant/voting and audience-presentation cards to the same primitive(s), retaining caller-owned content slots/rendering as needed.
- Consolidate only the styles genuinely shared by these cards. Preserve distinct feature-level styles where their layout or interaction differs.
- Keep components in an appropriate existing frontend component/shared location. Do not add a component library or dependency.
- Update focused tests and desktop visual-review evidence for both consuming screens.
- Do not add mobile-specific design work for the administrator overview or position workflow; preserve only basic narrow-width resilience.

## Out of Scope

- No API or backend changes; no new API calls, persistence, route, or domain state.
- No changes to participant/session link lifecycle, nomination link behavior, voting tokens, authorization, privacy, ballot confidentiality, reveal gating, presentation lifecycle, or tenant boundaries.
- No change to election terms being demo-only or to the inactive sample links on the selected-term overview.
- No redesign or unrelated cleanup of `App.tsx`, `NominationAdminPanel.tsx`, the application shell, or other UI cards.
- No React-Bootstrap or additional UI dependency.
- Do not move business state, async operations, clipboard behavior, popup handling, API mutations, or capability decisions into a generic card component.

## Technical Design Constraints

1. Prefer a small semantic primitive such as an `AccessCard`/`AccessCardGroup` only if inspection confirms it removes meaningful duplication. Avoid a generic card framework.
2. The reusable card should support accessible heading association and optional description/content regions, without taking ownership of domain state. Suitable composition may use children/slots rather than a large configuration object.
3. Keep the two feature integrations explicit:
   - Overview cards: fixed participant-link sample value; show the same card elements as the workflow, with the participant copy button and presentation open button disabled. The presentation card includes the same prototype-only visibility switch as the position workflow; it does not display a URL. Do not add a demo badge inside either app card.
   - Position participant card: real voting URL only when an active-round token exists; nomination URL is separately labeled; each copy action continues to use its existing handler and feedback.
   - Position presentation card: existing neutral/reveal gating, open behavior, visible-state controls, end behavior, and error reporting remain unchanged.
4. Use collision-resistant shared class names and keep feature-specific modifiers local. Remove old selectors only after both call sites are migrated and checked.
5. Keep URL/code values monospace and overflow-safe. Preserve status text, disabled states, focus behavior, semantic article/heading structure, and mobile single-column behavior.
6. Do not claim accessibility conformance beyond the currently approved E7.1/PD-009 criteria. Preserve existing semantics and include focused automated checks; E7.1 retains ownership of conformance targets and manual accessibility sign-off.

## Acceptance Criteria

- Both the selected-term overview and position workflow render their participant-session and audience-presentation surfaces through the shared React presentation component(s); no parallel duplicated card-shell markup remains for these surfaces.
- The shared card shell has consistent desktop sizing and visual treatment across both consuming surfaces, while allowing different content and feature-owned controls.
- The overview presents its static participant-link `sample://` value without a demo badge inside the card. Both surfaces' participant cards show a URL and copy button; both presentation cards omit a displayed URL and show the same visibility switch and open button. Overview actions are disabled; the switch only changes prototype presentation state.
- The position participant card shows a voting URL only when an actual active-round token exists; otherwise it preserves the truthful unavailable/prerequisite state. Any nomination URL remains explicitly labeled as a nomination link and does not masquerade as voting access.
- Existing clipboard actions and feedback remain in their current feature/domain owners; presentation open/hide/end behavior, async errors, reveal gating, and visible state remain unchanged.
- The refactor causes no API, route, payload, persistence, authorization, or election-workflow changes.
- Shared and feature-level styles preserve the approved NAD theme, card separation, URL readability, visible focus, and disabled presentation on desktop. Narrow layouts remain usable without horizontal overflow, but admin mobile design is not a sign-off target.
- Focused tests cover the overview's inactive sample cards and the position workflow's active/unavailable link and presentation states. Tests assert the two cards remain distinct and that no URL/control appears outside its existing capability/state.
- Frontend lint, complete frontend test suite, and production build are run. Any pre-existing failures are identified and compared with the recorded baseline rather than silently attributed to this work.
- 1280px desktop screenshots are captured for both consuming surfaces without overwriting existing review artifacts; significant differences are resolved or documented in the owning visual-review report. No dedicated 390px admin screenshots or mobile-admin design sign-off are required.

## Proposed Implementation Slices

1. **Shared structure:** Add the smallest reusable access-card shell/group primitive and focused component-level tests. No feature behavior changes.
2. **Static overview migration:** Replace the two inline demo-card shells in `App.tsx`; verify sample labels, sample URLs, no actions, and visual fidelity.
3. **Position workflow migration:** Replace the card shells in `NominationAdminPanel.tsx` while keeping each handler/state decision at its current owner; verify link/reveal/presentation states.
4. **Style consolidation and verification:** Remove duplicated CSS after both call sites use the primitive; run tests/lint/build and capture desktop/mobile evidence.

## Dependencies and Risks

- Depends on the merged/reviewed position-workflow layout in PR #21 and the current selected-term overview pattern.
- Most important risk is behavioral coupling: the production position workflow has real tokens, copy/open controls, and reveal-dependent presentation behavior, while overview cards are inert samples. The shared primitive must not erase that difference.
- CSS selector consolidation can change card dimensions or wrapping. Compare both screens at 1280px; use narrow-width checks only to catch horizontal overflow or blocking regressions, not to drive mobile-admin redesign.
- E7.1/PD-009 accessibility target and supported browser/device matrix remain unresolved; preserve semantic/accessibility behavior and do not claim formal conformance.

## Validation Plan

- Add or adapt focused React Testing Library tests for both card consumers before/alongside extraction.
- Verify exact accessible names for the Participant session link and Audience presentation cards and their headings.
- Verify the participant sample link remains non-operational and its overview copy action is disabled; presentation cards in both surfaces have no displayed URL, have matching switch/open controls, and the overview switch synchronizes prototype visibility state with the workflow switch. Confirm app cards have no demo badges.
- Verify real voting URL gating, nomination/voting label distinction, existing copy feedback, presentation reveal gating, open/hide/end controls, and errors.
- Run frontend lint, all frontend tests, and `npm run build` in `apps/web`.
- Compare screenshots at 1280px for each admin page. Write new evidence to distinct filenames or a dedicated follow-up folder; do not overwrite existing approved screenshots. A narrow-width overflow smoke check may be run, but 390px visual sign-off is out of scope for admin pages.

## Handoff for Future Session

Begin by reading this requirements file, `docs/stories/E9.1/handoff.md`, and the then-current PR/branch state. Confirm PR #21 has merged or otherwise establish the correct baseline before starting this follow-up. Inspect the two call sites and styles once, agree the smallest component contract, and implement this story only. Do not change election behavior or access policy. Obtain approval of an implementation plan if the repository workflow requires it before code changes.

## Implementation Handoff (2026-11-02)

- **Implemented:** Added reusable `ParticipantSessionLinkCard` and `AudiencePresentationCard` components in `apps/web/src/components/ParticipantSessionLinkCard.tsx` and `apps/web/src/components/AudiencePresentationCard.tsx`. Both overview and position-workflow consumers use both components. The components own their respective headings, description, participant URL/copy action, and presentation status/switch/open action; consumers supply data, availability, state handlers, and workflow-only content.
- **Visual fixes:** Removed the extra `DEMO LINK · NOT ACTIVE` badges from the app overview cards; sample actions remain disabled. Added card-scoped Bootstrap switch sizing to override the app-wide full-width input rule. No presentation URL is displayed.
- **Behavior boundary:** The overview switch is local demonstration state only. The position workflow owns real link gating and clipboard behavior; the presentation switch calls the existing show/hide API operations. Open, reveal gating, errors, and end behavior remain in the feature owner.
- **Tests:** Added assertions for overview sample controls/switch state and verified workflow hide behavior against the hide API in the reveal flow.
- **Validation:** Focused card/presentation tests passed. `npm run lint` passed with the existing `src/main.tsx` non-null assertion warning and TypeScript-eslint support notice. `npm run build` passed. Full frontend suite: 84 passed, 3 failed; remaining failures are the known Annual Boards navigation tests on the selected-term view documented in E9.1 handoff. `git diff --check` passed.
- **Visual evidence:** Browser reload has no Vite compile error, but the available shared browser is unauthenticated and remains on sign-in, so it cannot render the admin cards for a visual measurement/screenshot. A separate local Playwright measurement was unavailable because Playwright is not installed in `apps/web`. The switch CSS specifically resets width, min-width, height, and min-height after the global input rule. Authenticated 1280px screenshots remain pending before visual sign-off.
- **Git state:** Work remains uncommitted on `feature/e2.5-position-workflow-restore`. Preserve the existing prototype and story-requirement edits. No merge or deployment.
