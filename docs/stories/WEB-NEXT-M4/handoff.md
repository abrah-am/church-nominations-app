# WEB-NEXT-M4 Handoff

## Status

**Product Owner accepted M4 on 2026-11-11** after reviewing the final focused
nomination publication verification. M4 is closed. No M5 implementation,
merge, or deployment is authorized.

## Commit references

The M4 implementation and acceptance record are committed on
`feat/web-next-m0-foundation`. Implementation commit:
`b43bc71` (`feat(web-next): complete M4 essential mock interactions`).
The backlog and this commit reference were recorded in the follow-up
documentation commit.

## Current state

- M4 interactions across Admin, Voter, and Presentation use a shared,
  in-memory mock store; refresh resets it.
- The mock position retains the complete M2 Riverside history and adds M4
  polls without changing historical poll snapshots, decisions, or lifecycle
  events.
- Active participant sessions are independent of the selected Admin position
  and scoped to the current church and term; closing an M4 poll clears that
  active session rather than falling back to M2 Round 2.
- Nomination publication follows PD-017: open-intake names are room-only;
  closure preserves publication when enabled; saved corrections/removals
  update a published list; Show republishes the latest saved review state;
  voting start clears nomination content.
- A review finding about stale published names was resolved. The M4 store,
  workspace routing, Admin panel, and focused tests include the fixes.

## Validation

- `PATH=/Users/abraham/.nvm/versions/node/v24.22.2/bin:$PATH npm --prefix apps/web-next run check`
  passed: lint, 66 tests across 10 files, TypeScript, and production build.
- `git diff --check` passed.
- Browser route checks at 1440, 390, and 320 px found no horizontal overflow on
  Admin, Voter, or Presentation.
- Browser interaction checks confirmed the M4 nomination session remains
  active when viewing another position in the same term and is cleared after
  intake closes.
- Focused browser verification exercised open intake, duplicate removal,
  correction/save, publish, hide, a second correction/save, and republish.
  Presentation showed the latest saved name (`Aaron Revised`) and omitted the
  prior published value (`Aaron Updated`). Locator-based Playwright clicks
  repeated the known stability timeout; the same browser flow was completed
  using native button click events without further harness debugging.
- The focused store regression test verifies the republished list matches the
  latest saved review state and that raw historical submissions remain
  unchanged after duplicate removal and both corrections.
- Final focused command passed: `npm --prefix apps/web-next test -- --run
  src/data/mock-election-store.test.ts` (6 tests); `git diff --check` passed.

## Remaining

- Mock state remains synthetic and ephemeral; there is no authentication,
  backend integration, or persistence.

## Fresh Tech Lead handoff — M5

Next milestone: **M5 — Progressive Admin Completion**. Product Owner approved
M5a/M5b scope and policy clarifications on 2026-11-11. M5a implementation is
complete and pending Product Owner acceptance; M5b has not started.
See the [M5 handoff](../WEB-NEXT-M5/handoff.md),
[requirements](../WEB-NEXT-M5/requirements.md), and
[implementation plan](../WEB-NEXT-M5/implementation-plan.md).

Key clarified policies: calculate majority as guidance but require explicit
Admin confirmation before recording Elected; track responses separately and
finalize only after every opening is Accepted; direct replacement
recommendations use Advanced candidates from the associated completed round;
manual replacement polls may use any historical names from the same position
election with an audited reason and no automatic ranking/filtering. See the M5
requirements and product decision updates for full rules.

Remaining out-of-scope decisions: response correction/reversal and contact
details; committee/quorum process; automatic nomination; a candidate source
when no historical names exist; and additional majority recommendations
beyond the approved qualification indicator. M4's known browser tooling
limitation remains: Playwright locator clicks may time out waiting for
stability. The accepted nomination publish/hide/edit/republish flow was
verified in-browser using native button click events; this is a harness
limitation, not a known application defect.
