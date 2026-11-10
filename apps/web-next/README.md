# `web-next` admin shell

An isolated React/TypeScript application for incrementally implementing the
approved Prototype V2 experience. The current milestone implements only the
responsive Admin application shell, approved navigation destinations, and
development-only viewing-context selectors. Destinations intentionally remain
shell-only placeholders; this is not a functional election workflow.

## Runtime and commands

- Supported runtime: Node.js `24.22.2` (see `.nvmrc`).
- Install dependencies: `npm install`
- Start Vite: `npm run dev`
- Lint: `npm run lint`
- Run the test suite: `npm test`
- Build (includes TypeScript project checks): `npm run build`
- Run all local quality checks: `npm run check`

The application uses Vite, React, TypeScript, Tailwind CSS' Vite plugin,
React Router, Vitest, Testing Library, and official shadcn/ui `base-nova`
Button, Sheet, and Select primitives. `components.json` retains the configured
`base-nova` primitive family and `@/` aliases. The `cn` helper is available at
`@/lib/utils`.

## Routes and M1 boundaries

| Route | Shell-only destination |
| --- | --- |
| `/admin` | Position workspace |
| `/admin/setup` | Elections |
| `/admin/setup/churches` | Church settings |
| `/admin/setup/terms` | Term management |

The Elections destination is the active application navigation item for the
Position workspace and `/admin/setup`. Settings contains only Church settings
and Term management. There is no Dashboard destination. The church, term,
department, and position selectors appear only in the content header and use
explicit synthetic fixtures from `src/data/mock-admin-context.ts`. Selecting a
parent clears its downstream viewing selections; context changes do not activate
or mutate an election session.

There are no backend requests, API contracts, authentication simulation, forms,
or election/session operations in this milestone. Position metrics, session and
sharing controls, poll history, candidate rows, results, and decisions are
intentionally not implemented. Existing M0 domain/data modules and tests remain
separate and unchanged.

The lockfile pins transitive `minimatch` to `11.0.1` because the current ESLint
10 and typescript-eslint dependencies request `^10.2.x`, for which npm's
GHSA-g3hv-75wg-m249 advisory reports no fixed release; its affected range is
`>=7.0.0 <11.0.1`. This is a dev-tool-only major override at the advisory's
first fixed version, not an application runtime dependency. Keep it only while
the advisory and dependency ranges remain applicable; validate lint/build after
tooling updates because the override crosses the consumers' declared major
range.

## Boundaries

- `src/app`: application composition and Admin route setup.
- `src/features/admin-shell`: modular navigation, responsive Sheet, and
  viewing-context selectors.
- `src/domain`: pure domain types and source-derived candidate, opening,
  lifecycle, and position-condition summaries.
- `src/data`: application-facing read port, explicit errors, isolated
  in-memory snapshots, reusable adapter contract tests, and the separate
  shell-only mock context fixture.
- `src/features/workspace`: reserved for future focused workspace modules.
  Add nomination, voting, results, decisions, and history modules as approved;
  do not build a monolithic workspace component or create empty feature files.

No query/global-state library, backend adapter, or shared cross-app package is
introduced.

## Prototype source and port boundaries

The pure derivations are narrowly ported from
`docs/prototype-v2/src/model.ts` (`getCurrentCandidateStatus`,
`getPollCandidateStatus`, `getPositionLifecycle`, `getOpeningSummaries`, and
`getPositionCondition`) with relevant expectations from
`docs/prototype-v2/src/model.test.ts`. Their source-linked tests cover decision
revision versus poll history, opening/response separation, open-poll readiness
gating, append-only response history, and retained finalized lifecycle.

The application model is a minimal aggregate/admin summary, not a backend wire
schema and not a public viewer DTO. It has no ballot property, voter identity,
credentials, ballot counts, or election-policy rules. The read-only asynchronous
`PositionReader` scopes reads by church, term, and position and rejects missing
or out-of-scope data with a typed error. Its in-memory implementation returns
independently cloned snapshots and is only an explicit local substitute. A
future HTTP adapter must map verified backend DTOs and reuse the reader contract
tests; no endpoint or exact backend parity is claimed, and a failed real API
request must never fall back to fixtures.

The port preserves prototype decision statuses (`Pending`, `Advanced`,
`Elected`, `Eliminated`, and legacy `Declined`) as read-only data. It does not
convert these into policies or actions. Browser storage/migration, fixture
initialization from the prototype, UI state, ballot/presentation privacy
simulations, invitation-based opening reassignment, replacement selection,
transitions, poll creation, result publication, and decision/response writing
are excluded.

## Integration dependencies and policy holds

Before real workspace integration, verify persisted term/department context,
unified poll history and roster snapshots, session and audience capabilities,
candidate response and position lifecycle persistence, decision history/audit
projection, auth/church ownership, and authorization mapping. Existing API
contracts and POC behavior are not assumed to be finalized production wire
schemas.

Prototype/product conflicts remain unresolved and are excluded from this
foundation: aggregate participation on Presentation versus API restrictions;
closed-only explicit result reveal versus live audience totals; legacy
`Declined` decision values versus separate response events; and prototype
explicit later polls versus policy describing an Advanced-only draft. These
are clarification gates for dependent viewer, result-publication, decision, and
poll-transition features. M0 does not implement any of them.
