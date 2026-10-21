# Handoff: Next Story E1.2 Position Progress and Next Action

**Recommended next story:** E1.2, Show position progress and next action
**Current branch:** `feature/sprint-1-foundation-followup`
**Current HEAD:** `70e41be feat: implement E1.1 election lifecycle status` (pushed to matching `origin` branch)
**Working tree:** README.md has an existing uncommitted JDK 25/toolchain startup documentation update. Preserve it; do not stage it with E1.2 unless explicitly requested.

## Goal

An administrator wants position navigation to show each position's progress so they can move through the election without opening every position to discover its state.

## Acceptance criteria from backlog

- Each position shows its name, opening count, current state, and a concise next action or completed label.
- Previous/Next continues to respect configured sequence and disabled boundaries.
- Changing position does not silently reset any persisted position data.
- The selected position and its state are programmatically announced and keyboard operable.

## Starting point and evidence

- E1.1 is committed and pushed. Election-level API status is derived as `SETUP`, `IN_PROGRESS`, or `COMPLETE`; do not conflate these aggregate states with per-position states.
- Election detail currently selects one position at a time with sequential Previous/Next controls and mounts `NominationAdminPanel` keyed by election and position IDs. Inspect the current branch before changes to confirm this remains true.
- Workflow evidence already exists in separate resources: nomination intake status (`OPEN`/`CLOSED`), round status (`DRAFT`/`ACTIVE`/`CLOSED`), reveal timestamp/results, candidate decisions (`ADVANCED`/`ELIMINATED`/`ELECTED`), and configured opening count.
- E1.2 requires a UX-defined concise per-position state/next-action vocabulary. Do not infer or implement a new vocabulary until UX has reviewed the actual workflow states and product has approved any significant design choices.
- E1.3 is a separate adjacent story for replacing generic guidance with state-specific notices. Keep E1.2 focused on position navigation unless Product Owner requests a combined scope.

## Suggested next-session sequence

1. Read this handoff, the E1.2 section in `docs/product/backlog.md`, and current architecture/API behavior relevant to election positions, nomination intake, and voting rounds.
2. Delegate Phase 1 UX to `ux-designer`: status vocabulary, next-action mapping, placement in position navigation, loading/error behavior, responsive design, keyboard and screen-reader interaction. Present significant decisions for approval before implementation.
3. Once approved, define whether status/next-action can be derived from existing API data or needs a tenant-scoped API contract addition. Keep frontend and backend aligned before delegation.
4. Delegate implementation to `backend-developer` and `frontend-developer` in non-overlapping file scopes, then `qa-engineer` for focused and full relevant tests.
5. Request independent `code-reviewer` and post-implementation `ux-designer` reviews; fix material findings and rerun affected tests.
6. Update this handoff with actual files, test outcomes, review results, and outstanding decisions. Do not commit, merge, or deploy without explicit authorization.

## Environment notes

- Backend requires JDK 25 and PostgreSQL on local port 5433. This machine has JDK 25 at `$HOME/.jdk/jdk-25.0.2/jdk-25.0.2+10/Contents/Home`; Gradle may need `-Dorg.gradle.java.installations.paths="$JAVA_HOME"`.
- API startup requires `apps/api/.env` loaded into the environment (`set -a; . ./.env; set +a`). Never read or expose secret values in chat.
- The web dev server was running at `http://localhost:5173/` in the prior session; check whether it remains active before starting another.
- On the previous full API suite run, 31/32 tests passed and `PostgresElectionIntegrationTest.resettingClosedRoundClearsBallotsAndCurrentDecisionsButPreservesRosterAndAudit` failed at line 1410. The Product Owner subsequently confirmed the reset works as expected in manual use. Treat as an existing automated-test discrepancy; investigate only if it intersects E1.2.
- The prior E1.1 focused frontend suite passed (40 App tests); full web suite passed (53 tests across 5 files); web build passed; lint had one pre-existing non-null assertion warning in `apps/web/src/main.tsx` and a TypeScript parser compatibility notice.

## Decision boundary

The next session should begin with E1.2 UX discovery, not implementation. If the UX review exposes a materially broader state model or policy question, pause for Product Owner approval before coding.
