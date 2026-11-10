# WEB-NEXT-M0 implementation plan

Approved direction: Product Owner request of 2026-11-09, including the five
adjustments recorded in [requirements.md](requirements.md).

## Architecture and constraints

Use an independent npm application. Vite compiles React/TypeScript with Tailwind's
Vite integration; configure shadcn aliases and CSS variables without installing
blocks or deciding a visual theme. Use an owned `cn` helper and only a minimal
primitive if needed to verify shadcn integration. No router, query cache, global
state library, forms library, backend adapter, or shared cross-app package in M0.
Use current compatible tooling and record resolved versions in the lockfile.
Use the installed Node 24 runtime explicitly; the default shell Node is obsolete.

`app` composes dependencies; pure `domain` modules own derivations; `data` owns
application-facing ports, explicit errors and mock fixtures. Later HTTP adapters
map actual backend DTOs to these ports and must pass the same contract tests.
Future `features/workspace` composes smaller nomination, voting, results,
decisions and history modules. Do not create empty feature files just for layout.

Repository workflow and approved requirements are the governing principles.
No framework migration guidelines apply: this is a new isolated client, not a
Bootstrap component conversion.

## Plan and task breakdown

### 1. Tooling (REQ-001, REQ-002, REQ-005)

- [x] T001 Create `apps/web-next` using Vite's React/TypeScript scaffold; configure
  Tailwind, shadcn aliases/variables, strict types, ESLint, Vitest, Testing Library
  and build/test scripts. Keep the entry screen a neutral foundation placeholder.
- [x] T002 Document runtime, commands, module boundaries and provisional theme
  status in `apps/web-next/README.md`. Do not modify the existing applications.

### 2. Domain and data (REQ-002, REQ-003, REQ-004, REQ-006)

- [x] T003 Port narrowly scoped pure derivations and corresponding tests into
  `apps/web-next/src/domain`, preserving source branches and recording exclusions.
  Source: `docs/prototype-v2/src/model.ts` candidate status, opening summaries,
  lifecycle/condition derivations; `model.test.ts` relevant cases. Exclude browser
  migration/storage, fixture initialization, presentation/ballot policy, and any
  conflicted replacement/outcome behavior until clarified.
- [x] T004 Add a minimal read-only application data port, fixture-backed adapter
  and contract tests in `apps/web-next/src/data`. Prove async return shape, error
  behavior, snapshot isolation and absence of ballot-level data. Keep all rule
  derivations in domain. Do not represent this as an existing backend endpoint.
- [x] T005 Track verified integration dependencies and policy discrepancies in
  `dependencies.md`; no backend implementation.

### 3. Validation and handoff (REQ-001 through REQ-006)

- [x] T006 Run `npm run lint`, `npm test`, `npm run build`, dependency/isolation
  checks and `git diff --check`. Request QA and independent review, resolve
  findings, and record executed versus unexecuted checks and remaining limits.
  Update `qa-report.md`, `review.md` and `handoff.md`.

### 4. M1 design exploration only (REQ-007)

- [x] T007 After M0 validation, have the UX Designer prepare 2-3 desktop/mobile
  shell references grounded in official shadcn blocks and themes, including
  responsive behavior down to 320px. Save references/specs outside application
  source. No M1 shell code or final token choice; await Product Owner review.

Dependencies: T003/T004 require T001; T006 requires T001-T005; T007 follows T006.
Documentation work may proceed independently of tooling implementation.

## Source-anchored domain port specification

Source: `docs/prototype-v2/src/model.ts`, pure functions below. None performs
I/O or writes state. Source fixtures, `migrateState`, storage keys, clocks and
ID generation are deliberately not ported as domain logic.

- Current candidate status: filter candidate events, exclude superseded IDs,
  order by decision timestamp, take latest; default Pending. Poll-specific status
  uses only that poll's candidate events and retains historical outcomes.
- Lifecycle: latest appended lifecycle event; default In Progress.
- Opening summaries: stable opening IDs; consider historical Elected events in
  election order; assign candidates using response opening IDs before remaining
  elections; ignore unknown openings/candidates; retain append-only response
  history and latest matching response. M0 deliberately omits invitation-based
  reassignment: the reduced model must not be used for replacement-aware
  lifecycle summaries until that feature is separately approved and integrated.
- Condition precedence: finalized and insufficient accepted openings => Vacancy;
  any open poll => In Progress; assigned
  candidate without response => Awaiting Acceptance; empty opening => Vacancy;
  all openings accepted => Ready to Finalize; insufficient acceptance => Vacancy;
  remaining fallback => In Progress.
- Count accepted responses separately from election decisions. A later decline
  does not alter Elected or automatically reopen a finalized position.

The port preserves applicable source derivation branches within this reduced
model rather than introducing new election policy. Invitation-dependent
condition branches, conflicted transition rules, replacement selection,
audience publication and browser uniqueness are excluded (see dependency
register). This exclusion is a model boundary, not a change to approved policy.

## Requirement Mapping

| Requirement | Plan items | Evidence |
| --- | --- | --- |
| REQ-001 | T001, T002, T006 | package/config/lock files; QA commands |
| REQ-002 | T001, T003, T004 | app/domain/data boundaries; app README |
| REQ-003 | T003, T006 | domain source and focused parity tests |
| REQ-004 | T004, T006 | data port and adapter contract tests |
| REQ-005 | T001, T002, T006 | dependency tree and protected-path diff |
| REQ-006 | T003, T005 | separate dependency/conflict register |
| REQ-007 | T007 | visual references/specification; M1 approval gate |
