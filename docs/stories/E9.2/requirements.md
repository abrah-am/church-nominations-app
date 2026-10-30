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

## Problem / Technical Debt

The two independently-authored card layouts duplicate structure and styling. Future visual changes can drift between pages, while extracting the components naively could conflate static mock data with real, capability-gated links and controls. The refactor should share only stable presentation structure and accessible semantics; feature owners must continue to control data, permissions, availability, and actions.

## Scope

- Inventory and document the duplicated card structures and current responsive rules before editing.
- Introduce focused, reusable React presentation components for the shared access-card shell and, where useful, a shared two-card group/layout.
- Migrate the selected-term overview's static participant and presentation examples to the shared presentation primitive(s).
- Migrate the position workflow's real participant/voting and audience-presentation cards to the same primitive(s), retaining caller-owned content slots/rendering as needed.
- Consolidate only the styles genuinely shared by these cards. Preserve distinct feature-level styles where their layout or interaction differs.
- Keep components in an appropriate existing frontend component/shared location. Do not add a component library or dependency.
- Update focused tests and the E9.1 visual-review evidence for both consuming screens.

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
   - Overview cards: fixed sample values, clear inactive-demo indicator, no copy/open actions.
   - Position participant card: real voting URL only when an active-round token exists; nomination URL is separately labeled; each copy action continues to use its existing handler and feedback.
   - Position presentation card: existing neutral/reveal gating, open behavior, visible-state controls, end behavior, and error reporting remain unchanged.
4. Use collision-resistant shared class names and keep feature-specific modifiers local. Remove old selectors only after both call sites are migrated and checked.
5. Keep URL/code values monospace and overflow-safe. Preserve status text, disabled states, focus behavior, semantic article/heading structure, and mobile single-column behavior.
6. Do not claim accessibility conformance beyond the currently approved E7.1/PD-009 criteria. Preserve existing semantics and include focused automated checks; E7.1 retains ownership of conformance targets and manual accessibility sign-off.

## Acceptance Criteria

- Both the selected-term overview and position workflow render their participant-session and audience-presentation surfaces through the shared React presentation component(s); no parallel duplicated card-shell markup remains for these surfaces.
- The overview still presents only its static `sample://` examples with visible `DEMO LINK · NOT ACTIVE` status and no actionable controls.
- The position participant card shows a voting URL only when an actual active-round token exists; otherwise it preserves the truthful unavailable/prerequisite state. Any nomination URL remains explicitly labeled as a nomination link and does not masquerade as voting access.
- Existing clipboard actions and feedback remain in their current feature/domain owners; presentation open/hide/end behavior, async errors, reveal gating, and visible state remain unchanged.
- The refactor causes no API, route, payload, persistence, authorization, or election-workflow changes.
- Shared and feature-level styles preserve the approved NAD theme, card separation, URL readability, visible focus, disabled presentation, and desktop/mobile reflow without horizontal overflow or overlapping content.
- Focused tests cover the overview's inactive sample cards and the position workflow's active/unavailable link and presentation states. Tests assert the two cards remain distinct and that no URL/control appears outside its existing capability/state.
- Frontend lint, complete frontend test suite, and production build are run. Any pre-existing failures are identified and compared with the recorded baseline rather than silently attributed to this work.
- Paired 1280px desktop and 390px mobile screenshots are captured for both consuming surfaces without overwriting existing review artifacts; significant differences are resolved or documented in the owning visual-review report.

## Proposed Implementation Slices

1. **Shared structure:** Add the smallest reusable access-card shell/group primitive and focused component-level tests. No feature behavior changes.
2. **Static overview migration:** Replace the two inline demo-card shells in `App.tsx`; verify sample labels, sample URLs, no actions, and visual fidelity.
3. **Position workflow migration:** Replace the card shells in `NominationAdminPanel.tsx` while keeping each handler/state decision at its current owner; verify link/reveal/presentation states.
4. **Style consolidation and verification:** Remove duplicated CSS after both call sites use the primitive; run tests/lint/build and capture desktop/mobile evidence.

## Dependencies and Risks

- Depends on the merged/reviewed position-workflow layout in PR #21 and the current selected-term overview pattern.
- Most important risk is behavioral coupling: the production position workflow has real tokens, copy/open controls, and reveal-dependent presentation behavior, while overview cards are inert samples. The shared primitive must not erase that difference.
- CSS selector consolidation can change card dimensions, wrapping, or mobile stacking. Compare both screens at 1280px and 390px.
- E7.1/PD-009 accessibility target and supported browser/device matrix remain unresolved; preserve semantic/accessibility behavior and do not claim formal conformance.

## Validation Plan

- Add or adapt focused React Testing Library tests for both card consumers before/alongside extraction.
- Verify exact accessible names for the Participant session link and Audience presentation cards and their headings.
- Verify sample links are visibly inactive and have no operational controls.
- Verify real voting URL gating, nomination/voting label distinction, existing copy feedback, presentation reveal gating, open/hide/end controls, and errors.
- Run frontend lint, all frontend tests, and `npm run build` in `apps/web`.
- Compare screenshots at 1280px and 390px for each page. Write new evidence to distinct filenames or a dedicated follow-up folder; do not overwrite existing approved screenshots.

## Handoff for Future Session

Begin by reading this requirements file, `docs/stories/E9.1/handoff.md`, and the then-current PR/branch state. Confirm PR #21 has merged or otherwise establish the correct baseline before starting this follow-up. Inspect the two call sites and styles once, agree the smallest component contract, and implement this story only. Do not change election behavior or access policy. Obtain approval of an implementation plan if the repository workflow requires it before code changes.
