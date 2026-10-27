# E6.9 QA Report

**Date:** 2026-10-26
**Branch:** `feature/story-e6.9-live-nomination-presentation`
**Verdict:** Accepted by the Product Owner as a single-instance POC on 2026-10-26. Production deployment remains blocked by retention and multi-instance presentation policy.

## Acceptance Evidence

| Criterion | Result | Evidence |
| --- | --- | --- |
| Open-intake admin view remains count-only; names are private until close | Pass | API and frontend tests; `PostgresElectionIntegrationTest.adminCannotReadNominationNamesBeforeExplicitReveal`; open-intake response/projection checks |
| Close materializes alphabetized list with duplicates preserved and clears device tokens | Pass | `PostgresElectionIntegrationTest.revealingNominationsAlphabetizesNamesAndPreservesDuplicates`; token assertions in nomination integration coverage |
| Admin can correct, remove with reason, and restore; changes are append-only and revision checked | Pass | API integration coverage for correction/removal/restore and stale revisions; web tests for selected removal reason, revision-aware restore, retry, and edit-after-removal sequence |
| Presentation remains neutral until reveal, then shows active list and confirmed change history only | Pass | API integration coverage and `read-only nomination presentation` frontend tests |
| Presentation is a separate read-only capability with hide/end revocation and no admin credentials | Pass | API authorization/projection tests and frontend checks that viewer requests omit Authorization and have no mutation controls |
| Live updates/reconnects use server-confirmed snapshots; hide/end and publishers are serialized per process | Pass for single-instance POC | Focused API integration tests; lock-protected registration, publication, and clear paths in `NominationIntakeService` |
| Popup-blocked reveal does not publish | Pass | `does not reveal nominations when the browser blocks the presentation tab` |
| Draft list may be edited; stale first-round draft cannot start; active poll locks list | Pass | `nominationChangesAreAllowedDuringDraftButInvalidateItsStart`; frontend revision guard |
| Failures/conflicts preserve confirmed state and provide recovery | Pass | Shared-list retry/reload and conflict tests; removal/restore paths expose latest-list reload |
| Keyboard access and narrow viewport | Partial pass | Focus test covers Reason, Cancel, Confirm, Other Details, Tab/Shift+Tab, Escape, and return focus; browser check at 320px reports no horizontal overflow |

## Executed Checks

- API full suite: `./apps/api/gradlew -p apps/api -Dorg.gradle.java.installations.paths=$JAVA_HOME test --console=plain` — Passed, `BUILD SUCCESSFUL`.
- Web full suite: `npm test -- --run --reporter=dot` — Passed, 76/76 tests.
- Web production build: `npm run build` — Passed.
- Web lint: `npm run lint` — Zero errors; one pre-existing warning at `apps/web/src/main.tsx` for a non-null assertion.
- Patch hygiene: `git diff --check` — Passed.
- Browser QA: neutral presentation route at 320px — document/body widths 320px, no horizontal overflow. API was not running, so network reconnect and successful revealed-content rendering were not exercised in this browser check.
- Independent code review: initial review found a major privacy issue in legacy audit actor projection. The issue was fixed and independently re-reviewed with no remaining blocking findings.
- Independent QA review: recommends POC acceptance with the limitations below.
- Independent code review follow-up: identified that legacy audit actor values could contain administrator emails in viewer event projections. The presentation DTO now preserves only generated pseudonymous `Administrator XXXXXXXX` labels and maps other legacy values to `Administrator`; `adminCannotReadNominationNamesBeforeExplicitReveal` seeds an email-shaped legacy value and verifies it is absent from the viewer response. Focused API integration test passed after the fix.
- Patch hygiene: `git diff --check` and `git diff --cached --check` passed after removing report whitespace.

## Known Limitations and Production Gates

- SSE subscriber state and synchronization are process-local. Multi-instance deployment needs shared revocation/broadcast coordination and cross-instance tests.
- PD-005/E8.2 retention duration and deletion obligations for anonymous submissions and nomination audit events remain unresolved.
- Full screen-reader/assistive-technology validation and contrast audit were not performed.
- Successful `OTHER` reason detail persistence/projection has less direct integration coverage than other reasons.
- Deployment-origin CORS and real API-backed browser reconnect should be validated in the eventual hosted environment.

Product Owner acceptance recorded 2026-10-26. Push is authorized by the Product Owner; merge and deployment remain unauthorized.
