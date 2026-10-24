# E6.9 Handoff

**Date:** 2026-10-23
**Branch:** `feature/story-e6.9-shared-nomination-list`
**Status:** Requirements revised 2026-10-23 to live, transparent presentation editing workflow. Existing implementation does not yet fulfill separate-tab presentation or visible change-history requirements; plan/API updates are pending approval and implementation.

## Implemented So Far

- Added explicit list creation at close. Admin responses after close include the alphabetic, duplicate-preserving shared list; open intake remains count-only.
- Added a separate presentation reveal state and action. Presentation projection remains neutral until explicit reveal; participant session links remain separate.
- Profile/device tokens are cleared when close materializes the list; profile count is frozen then.
- Current admin controls support correction, removal, and restoration only. Add and reorder remain out of scope. Current backend audits removal/restoration, but does not yet preserve correction before/after or a public change event/reason for declines.
- UX wireframe Option 1 selected for the admin list: scan-first active names with a separate Removed disclosure and per-row Edit/Remove actions. The revised requirement adds a separate read-only presentation tab with live list updates and visible change history; the existing E6.8 design must be revised to match.
- The admin nomination stream remains an admin API and carries admin state. Presentation data must use its own redacted, reveal-gated channel; do not use the admin stream for audience display.
- Superseded earlier policy: correction before/after history was not retained and decline workflow was out of scope. Revised E6.9 requires append-only correction/removal/restoration events, duplicate/decline removal reasons, and presentation-visible live history after reveal.
- Removed name-bearing open-intake SSE announcements; announcements now report profile-count changes only.

## Files Changed

- `apps/api/src/main/resources/db/migration/V12__add_nomination_reveal_state.sql`
- `apps/api/src/main/resources/db/migration/V13__shared_nomination_list_rows.sql`
- `apps/api/src/main/resources/db/migration/V14__audit_nomination_removals.sql`
- `apps/api/src/main/java/org/churchnominations/api/nominations/`
- `apps/api/src/main/java/org/churchnominations/api/election/voting/VotingRoundService.java`
- `apps/api/src/test/java/org/churchnominations/api/election/PostgresElectionIntegrationTest.java`
- `apps/web/src/api/nominations.ts`
- `apps/web/src/features/nominations/NominationAdminPanel.tsx`
- `apps/web/src/App.test.tsx`
- `docs/stories/E6.9/requirements.md`
- `docs/stories/E6.9/implementation-plan.md`
- `docs/product/backlog.md`
- `docs/product/product-decisions.md`
- `docs/stories/E6.8/requirements.md`
- `docs/stories/E6.10/requirements.md`
- `docs/stories/E6.10/handoff.md`
- `docs/technical/api-contract.md`

## Validation So Far

- Full frontend suite passed: 69/69 tests.
- Frontend production build passed.
- Frontend lint passed with no errors; one existing non-null assertion warning remains in `apps/web/src/main.tsx`.
- Focused PostgreSQL integration test passed for close-time admin visibility, presentation redaction/publication state, removal audit, Removed section, stale revision rejection, token clearing, and restore.
- `git diff --check` passed.
- Full API suite has not been rerun after the latest changes. The earlier full run had one reset-round test failure involving a directly seeded later-round fixture.
- Responsive/browser and screen-reader UX validation remains outstanding.
- The current implementation does not yet open a separate presentation tab or show a public live change log; do not represent the revised story as implemented.

## Open Risks / Follow-up

- PD-005/E8.2 retention duration and deletion obligations remain open for anonymous names and the newly required correction/removal/restoration event history.
- Presentation delivery must remain distinct from the admin nomination stream; the dedicated E6.8 presentation authorization/session channel is still required.
- Verify reveal idempotency/error semantics, legacy consolidation behavior, active shared-list row limits, and mobile/screen-reader behavior.

## Next Steps

1. Approve the revised E6.9 requirements, E6.8 presentation changes, and PD-005 event-history/retention policy.
2. Implement the separate authorized presentation tab and reveal-gated live list/change-event channel; keep all mutations in admin workspace.
3. Extend backend and UI for correction before/after events, duplicate/declined/other removal reasons, visible chronology, retries/conflicts, and restore events.
4. Add tests for presentation authorization, real-time confirmed updates, audit/change-event persistence, tenant isolation, and no mutation from presentation.
5. Run the full API/web suites and independent security/UX review.
5. Complete E6.8 presentation-specific show/hide/end and audience workflow; do not conflate it with the participant session link.
6. Obtain Product Owner acceptance and resolve PD-005/E8.2 before treating nomination data retention as production-ready.