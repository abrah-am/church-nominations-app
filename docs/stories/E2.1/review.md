# E2.1 Independent Code Review

## Review Scope

- Branch: `feature/story-e2.1-intake-states`.
- Baseline: complete current tracked diff against `main`, including uncommitted implementation and tests. Also reviewed the current E2.1 requirements and QA/UX artifacts as context; no docs other than this review were edited.
- Reviewed intake API and SSE behavior, response consistency, withdrawal/closure lifecycle, privacy and authorization, UI states, sorting, confirmations, live announcements, accessibility handling, error recovery, and test evidence.
- No code changes, merge, or deployment were performed.

## Findings

### Resolved: Closed-intake subscription regression coverage

The previous Major implementation finding is resolved by the current registry design. `NominationIntakeService.stream` supplies a fresh-response callback to `events.subscribe` in [NominationIntakeService.java](../../apps/api/src/main/java/org/churchnominations/api/nominations/NominationIntakeService.java#L67). In [NominationIntakeEventRegistry.java](../../apps/api/src/main/java/org/churchnominations/api/nominations/NominationIntakeEventRegistry.java#L20), subscription registration and initial snapshot retrieval/send execute under the registry monitor; `publish` uses that same monitor. This closes both interleavings: a close published before subscription is reflected in the fresh initial snapshot, while a close committed after the snapshot is delivered by the waiting publisher. A closed initial snapshot also completes the emitter.

The integration test now subscribes after intake is already closed, asserts the initial snapshot is `CLOSED`, and verifies the emitter completes after exactly one event. This protects the missed-publish window where closure commits before subscriber registration. The focused Postgres integration test passed after this assertion was added. The test does not pause inside the synchronized registration/snapshot operation; lock-level ordering is verified by implementation review.

## Prior Finding Disposition

- **SSE missed-close race (previously Major): Resolved.** Shared synchronization covers subscriber registration, fresh initial snapshot, and publication; closed snapshots terminate the emitter. The integration test verifies the closed-before-subscribe snapshot and stream completion.
- **Submissions/count snapshot inconsistency (previously Minor): Resolved.** `adminResponse` now obtains submission rows once, derives `currentContributorCount` from those rows, and maps/sorts the same collection for `submissions` in [NominationIntakeService.java](../../apps/api/src/main/java/org/churchnominations/api/nominations/NominationIntakeService.java#L153). GET and SSE therefore derive both fields from the same query result, rather than separate reads that can observe different committed states.

## Areas Rechecked With No Findings

- **Withdrawal and count semantics:** Empty `names` is valid for explicit withdrawal; the service locks the intake, checks it remains open, replaces that profile's rows, and publishes only after commit. The count is distinct profiles with remaining rows, independent of name-entry count; replacing a list does not inflate it and withdrawing the list removes the profile from it.
- **Privacy, tenant isolation, and API compatibility:** Admin submissions contain IDs/names but no device token or actor identity. Public GET/PUT retain their limited response contracts; public routes remain unauthenticated by design but require the device-token header where applicable. Integration coverage checks tenant access denial, identity omission, closed-intake rejection, and event privacy.
- **Ordering and duplicate suggestions:** Server order is deterministic and case-insensitive, then exact name and submission ID. UI renders an ordered list while preserving repeated names and stable ties; UI and API tests cover case-only duplicates.
- **Confirmation, unsaved edits, and error paths:** Closure and withdrawal require confirmation. Withdrawal cancel/failure preserve edits, success clears them; save/withdraw failures do not claim success. Closed public intake returns 410 and the UI switches to its read-only closed state. Admin SSE errors and normal stream termination trigger GET polling; successful closure updates the admin state.
- **Accessibility and live status:** The UI exposes separate profile/name-entry measures, visible explanatory copy, status and alert regions, semantic ordered lists, labeled dialogs, safer initial focus, keyboard containment, Escape cancellation, and focus restoration. Tests assert these key interactions and announcements. No submitter attribution is announced.

## Verification and Residual Risks

- Passed: focused API integration test `PostgresElectionIntegrationTest.nominationIntakeSupportsAnonymousDeviceEditsClosureAndConsolidation` with Java 25 (`BUILD SUCCESSFUL`). It covers replacement, multiple profiles, withdrawal, closure, event snapshots, privacy, and tenant isolation.
- Passed: web test suite, 5 files and 67 tests (`67 passed`).
- Passed: web production build (`tsc --noEmit` and Vite build).
- Passed: `git diff --check main`.
- Full API suite: not clean. A run reported `resettingClosedRoundClearsBallotsAndCurrentDecisionsButPreservesRosterAndAudit()` failing at `PostgresElectionIntegrationTest.java:1464`; Gradle also reported XML result-file write errors for several test classes. This is outside E2.1's touched behavior and is not attributed to this change, but should be triaged separately before relying on a full-suite green signal.
- Residual: no real-browser responsive/accessibility review, and no screen-reader or rendered contrast verification. Current submission rows intentionally represent current state, not historical submit/withdraw events.

## Recommendation

**No blocking code-review findings; ready for Product Owner acceptance.** The SSE race and snapshot consistency findings are resolved. No critical/high issue or observed E2.1 functional/security defect remains. The full API suite has an unrelated reset-round failure that should be triaged separately. No merge or deployment was performed.