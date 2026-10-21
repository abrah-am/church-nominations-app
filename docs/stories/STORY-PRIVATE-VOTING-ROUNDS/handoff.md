# Handoff: Private Voting Rounds

**Story key:** `STORY-PRIVATE-VOTING-ROUNDS` (descriptive key; no story ID was assigned in the repository)  
**Branch:** `feature/sprint-1-foundation-followup`  
**Status:** Work in progress; do not merge or deploy.

## Completed work

- Implemented private voting-round lifecycle and ballot submission/replacement, candidate decisions, result reveal, audit events, expected-voter cutoff, and round reset/reopen behavior.
- Added frontend round and voting API clients, public voting UI, and admin round-management UI.
- Extended election/nomination behavior and local development guidance. The current dirty tree includes broader election work beyond this story; treat all listed changes as uncommitted and preserve them.
- Product decisions reflected in the current implementation: Spring Boot + PostgreSQL; ballot-choice records omit voter identity while participation status is separate; admin can close/reveal; even-sized two-candidate rounds close at `N - 1` submissions. This is application-level confidentiality, not operator-proof anonymity.

## Uncommitted files

`git status --short --branch` reported the following changes; none are committed:

- Modified: `.github/agents/tech-lead.agent.md`, `.vscode/settings.json`, `.vscode/tasks.json`, `README.md`, `apps/api/src/main/java/org/churchnominations/api/config/SecurityConfiguration.java`, `apps/api/src/main/java/org/churchnominations/api/config/WebConfiguration.java`, `apps/api/src/main/java/org/churchnominations/api/election/ApiExceptionHandler.java`, `apps/api/src/main/java/org/churchnominations/api/election/Election.java`, `apps/api/src/main/java/org/churchnominations/api/election/ElectionController.java`, `apps/api/src/main/java/org/churchnominations/api/election/ElectionPositionDetails.java`, `apps/api/src/main/java/org/churchnominations/api/election/ElectionService.java`, `apps/api/src/main/java/org/churchnominations/api/nominations/NominationIntakeController.java`, `apps/api/src/main/java/org/churchnominations/api/nominations/NominationIntakeService.java`, `apps/api/src/test/java/org/churchnominations/api/election/NonDevElectionSecurityTest.java`, `apps/api/src/test/java/org/churchnominations/api/election/PostgresElectionIntegrationTest.java`, `apps/web/src/App.test.tsx`, `apps/web/src/App.tsx`, `apps/web/src/api/elections.ts`, `apps/web/src/api/nominations.ts`, `apps/web/src/styles.css`, `docs/product/backlog.md`, `docs/product/requirements.md`.
- Untracked: `.github/agents/ux-designer.agent.md`, `apps/api/.vscode/tasks.json`, `apps/api/src/main/java/org/churchnominations/api/election/voting/CandidateDecision.java`, `CandidateDecisionRequest.java`, `ConfigureVotingRoundRequest.java`, `InvalidVotingRoundRequestException.java`, `PublicVotingPollController.java`, `PublicVotingPollResponse.java`, `ReplaceBallotRequest.java`, `StartVotingRoundRequest.java`, `SubmittedBallotResponse.java`, `VotingRound.java`, `VotingRoundCandidate.java`, `VotingRoundCandidateRepository.java`, `VotingRoundCandidateResponse.java`, `VotingRoundCloseReason.java`, `VotingRoundConflictException.java`, `VotingRoundController.java`, `VotingRoundNotFoundException.java`, `VotingRoundProgressResponse.java`, `VotingRoundRepository.java`, `VotingRoundResponse.java`, `VotingRoundResultsResponse.java`, `VotingRoundService.java`, `VotingRoundStatus.java`, `apps/api/src/main/java/org/churchnominations/api/nominations/NominationIntakeEventRegistry.java`, migrations `V5__create_voting_rounds.sql` through `V11__reset_closed_voting_rounds.sql`, `apps/api/src/test/java/org/churchnominations/api/election/voting/VotingRoundTest.java`, `apps/web/src/api/rounds.test.ts`, `apps/web/src/api/rounds.ts`, `apps/web/src/api/voting.test.ts`, `apps/web/src/api/voting.ts`, `apps/web/src/features/auth/AccessGate.tsx`, `apps/web/src/features/boards/BoardsWorkspace.tsx`, `apps/web/src/features/elections/ElectionForm.tsx`, `apps/web/src/features/elections/candidateRecommendations.ts`, `apps/web/src/features/nominations/NominationAdminPanel.tsx`, `apps/web/src/features/nominations/PublicNominationPage.tsx`, `apps/web/src/features/voting/PublicVotingPage.tsx`.
- This handoff is newly added at `docs/stories/STORY-PRIVATE-VOTING-ROUNDS/handoff.md`.

## Tests and checks actually run

- Passed: focused integration test `org.churchnominations.api.election.PostgresElectionIntegrationTest.privateBallotsEnforceLifecycleRosterIsolationAndCutoffRules`, with JDK 25 configured via `JAVA_HOME` and `org.gradle.java.installations.paths`; Gradle reported `BUILD SUCCESSFUL` (17s).
- Failed attempt: same focused integration test without explicit JDK 25 configuration exited `1`. No failure detail was captured in the handoff context; the configured JDK 25 rerun passed.
- Passed per QA execution: `npm test -- --run src/api/health.test.ts` (2 tests); `npm test -- --reporter=dot` (48 tests, 5 files); `npm run build`; `./gradlew test --tests org.churchnominations.api.health.HealthControllerTest --rerun-tasks --console=plain`; `./gradlew bootJar --console=plain`; `git diff --check`.
- Lint: `npm run lint` completed with 0 errors and 1 warning (non-null assertion in `src/main.tsx`; TypeScript parser version compatibility warning also reported by QA).
- Failed command attempt: `npm run start` exited `254`; diagnostic output/reason was not captured.
- Not run: full backend test suite; browser end-to-end test for this story.

## Review findings and unresolved issues

- QA and independent code review executed. Both found that README's quick-start API command does not source `apps/api/.env`; the required env-loading command exists in the configuration section but must also be explicit in the run steps.
- Both reviewers found the health client is tested but not called by the frontend and there is no visible API connection status indicator. Decide whether to implement this as part of the current story or defer it.
- Candidate withdrawal policy remains conflicting in product notes. The two-candidate even-group cutoff override/reopen behavior and attendance changes after round open need confirmation.
- Nomination-link identity/expiry/edit policy, result reveal timing, report audience/content, retention, and production identity remain open product decisions.
- Full backend suite has not been run; do not infer it passes from the focused test.

## Decisions to preserve

- Do not add authentication features beyond the existing local POC or unrelated product scope in this story.
- Do not associate voter identity with stored ballot choices; participation tracking remains separate.
- Keep live totals hidden until authorized reveal.
- Keep all uncommitted work intact; no commit, merge, branch deletion, or deployment without approval.

## Exact next steps

1. Inspect `git diff` and the untracked voting files as one coherent change set; verify all changes belong to the intended story before staging anything.
2. Fix the README startup instruction so it sources `apps/api/.env` before `devBootRun`.
3. Decide whether the API health status indicator belongs in this story; if yes, connect `checkApiHealth` to the frontend and test loading, connected, and unavailable states.
4. Run frontend lint, all frontend tests, and production build; run the focused voting integration test with JDK 25; then run the full backend suite if the local PostgreSQL/Testcontainers prerequisites are available.
5. Re-run independent review after fixes, record remaining findings, and update this handoff. Stop before commit, merge, or deployment pending approval.