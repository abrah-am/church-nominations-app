# E6.9 Implementation Plan

**Status:** Draft for Product Owner approval; Product Owner scope choices recorded 2026-10-23
**Date:** 2026-10-23
**Priority:** P1 (high)
**Complexity:** Large (cross-tier workflow, privacy gating, persistence changes, and live presentation updates)

## Goal

Replace the raw-submission/consolidation view with one shared admin list available after closure. Keep names hidden during open intake and in the presentation until explicit reveal opens/publishes the list in a separate tab. After reveal, the authenticated admin can correct spellings, remove duplicates, record declines, remove/restore entries, and see every confirmed change reflected live in the read-only presentation alongside an append-only change log. Adding names and reordering remain prohibited.

## Current Behavior and Gap

- `NominationIntakeService.adminResponse` currently returns submitted names for both open and closed intakes; it alphabetically sorts them, and includes the device-profile token in persisted raw submission rows.
- Closing intake currently causes the admin UI to show raw submissions and a consolidation editor. Saving consolidation deletes/replaces a candidate-name snapshot.
- There is no complete separate-tab presentation workflow or live nomination change-log projection. Existing removal audit events do not capture correction history or selected removal reasons.
- Existing E2.1 semantics define `currentContributorCount` as profiles with a current non-empty submission and distinguish it from proposed-name-entry count.

## Proposed Work

### API and Persistence

1. Add a server-owned list-created state at intake close and a separate presentation-publication state/command. Close creates the admin shared list but does not publish it. The publish action is valid after closure; repeating it must be idempotent or reject cleanly without duplicating rows.
2. Make admin responses state-sensitive: while intake is open return state, name limit, and current contributor-profile count only. After closure, return the shared list to the authenticated admin whether or not it has been published. Presentation responses remain neutral until explicit publication.
3. On close, materialize shared rows once, alphabetized case-insensitively by full name with deterministic tie ordering. Preserve duplicate entries as separate row IDs; do not automatically deduplicate. Row order remains fixed in this story.
4. Remove/clear profile-device tokens from raw submissions when close creates the shared list, while retaining anonymous source names with the election subject to PD-005/E8.2 retention duration. Freeze the contributor count and perform close, list creation, and token removal transactionally.
5. Model active rows with stable IDs and fixed sequence. Add authorized operations for correct, remove, and restore only. Removal deletes the row from the active list and exposes it in the admin Removed section. Record append-only events for correction (before/after), removal (selected reason such as duplicate or declined), and restoration, including entry identity, actor display label, and timestamp. Do not implement add or reorder operations.
6. Add revision/version checking to writes so stale edits return a conflict rather than overwriting newer confirmed state. Publish only after successful commit.
7. Expose a read-only presentation projection of confirmed shared-list state and its change log through an authenticated, tenant-scoped presentation session opened in a separate tab. It returns neutral content until explicitly published. After publication, stream confirmed list and change-log updates live. Participant links remain separate. Presentation is independently shown/hidden/ended under E6.10.

### Frontend

1. Replace the open-intake name list and proposed-entry count with profile count, name limit, and state only. Ensure no accessible labels, announcements, stale cache, or previews disclose names.
2. After close, show the submitted list to the admin and provide an explicit `Reveal results` action that opens/publishes the list in a separate presentation tab; do not conflate this with admin list access.
3. Show a legible alphabetic active list after close. Provide correction and removal actions per entry, removal reasons for duplicate/declined/other, and a separate Removed section with restore actions. Do not show add or reorder controls.
4. Preserve draft edits on network failure. Show success only after server confirmation; reconcile/reload on revision conflict.
5. Keep the presentation neutral until explicitly revealed. After reveal, mirror confirmed corrections/removals/restorations and append visible change events in real time. The active presentation list omits removed names; the admin-only Removed section remains separate. Presentation controls are available only in the admin workspace.
6. Keep the workflow keyboard/screen-reader accessible and responsive at 320 CSS px. Do not introduce a participant-facing view or a candidate-selection workflow here.

## Dependencies and Open Policy

- US-008 intake behavior and E6.10 participant/presentation separation are approved dependencies.
- PD-005/E8.2: retain anonymous original names with the election and discard profile tokens when close creates the list; the initial shared list is alphabetical. Retain correction before/after and removal/restoration reason events for the approved retention period. Resolve duration, access, and deletion obligations before production use.
- API contract and authorization review must define concrete endpoints, optimistic concurrency representation, presentation session handling, and cache invalidation before implementation.
- E6.8 consumes the presentation projection and is not implemented by E6.9. E6.11 stable participant session routing is out of scope.

## Tasks

1. Confirm PD-005/E8.2 retention constraints and approve this plan.
2. Define admin list and presentation-publication API schemas and authorization behavior; update `docs/technical/api-contract.md` before coding.
3. Add migration and backend service/controller changes for list-created and presentation-publication states, shared rows/order, transactional token removal at close, revision checks, and separate Removed/audit representation.
4. Add PostgreSQL integration tests for names hidden during open intake; admin-visible closed list; presentation redaction before publication; exact alphabetical ordering and duplicate preservation; transactional token deletion; tenant isolation; unauthorized reveal/edit/restore; conflict handling; audited correction before/after and removal reason/restoration; and no add/reorder capability.
5. Update frontend API types/client and admin workflow with count-only states, explicit reveal, shared-list editing, recovery/conflict states, and accessible inactive rows.
6. Add frontend tests for privacy gating, reveal flow, each edit action, failed save/retry, conflicts, and no name leakage in open/closed-unrevealed states.
7. Add/extend presentation tests for separate-tab authorization, live confirmed list/change-log updates, no mutation capability, and reset/hide clearing content.
8. Run focused API integration tests, focused web tests, full relevant checks, then independent security/code and UX review.

## Acceptance Evidence

- API tests prove no nomination names or proposed-entry count are available to admins before close and no participant path can read the admin shared list; after close names are returned only to authenticated admins until presentation reveal.
- Database/API tests prove device tokens are removed atomically when close creates the list while anonymous names remain according to the approved retention period.
- UI tests prove only server-confirmed corrections/removals/restorations are shown as saved/broadcast, removed names are excluded from the active list and available to restore in Removed, and failures/conflicts do not silently lose or overwrite changes.
- Presentation tests prove it is read-only, admin-controlled separately from the participant link, and updates only from confirmed server state.
- Keyboard and responsive checks cover the primary open, closed-unrevealed, revealed/editing, error/conflict, and presentation states.

## Risks

- Keeping raw submitted names after close increases retained personal-data exposure; decide retention/deletion policy before production use.
- Removing profile tokens at close is irreversible for subsequent profile-local editing; verify no nomination edit flow still depends on those tokens after intake closes.
- The public change log exposes correction before/after values and removal reasons to the meeting audience after reveal; minimize actor identity and enforce PD-005/E8.2 retention, tenant, and presentation-session boundaries.
- Existing `consolidatedNames` is consumed by round configuration and election progress logic; migrate or maintain a compatible read projection until dependent round setup is updated.