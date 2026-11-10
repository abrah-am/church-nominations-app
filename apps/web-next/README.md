# `web-next` admin shell

An isolated React/TypeScript application for incrementally implementing the
approved Prototype V2 experience. M1 established the responsive Admin shell;
M2 adds the approved read-only Position Workspace with typed synthetic
snapshots, poll history, aggregate results, candidate views, and a separate
MOCK-only active-session toolbar. It is not a production election workflow.

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

| Route | Destination |
| --- | --- |
| `/admin` | Read-only position workspace |
| `/admin/setup` | Elections |
| `/admin/setup/churches` | Church settings |
| `/admin/setup/terms` | Term management |

The Elections destination is the active application navigation item for the
Position Workspace and `/admin/setup`. Settings contains only Church settings
and Term management. There is no Dashboard destination. Church, term,
department, and position selectors use explicit synthetic fixtures from
`src/data/mock-admin-context.ts`. Selecting a parent clears downstream viewing
selections; viewing-context changes do not activate or mutate a session.

M2 renders a position summary and opening assignments, Polls/Candidates
navigation, typed poll history, approved nomination roster with collapsed
original-name traceability, read-only voting aggregates and recorded decisions,
and current candidate statuses. Round 2 open-poll totals are explicitly labeled
as a **MOCK admin snapshot · not live backend data**. Aggregate percentages use
ballots cast, with deterministic vote-descending/name-ascending ordering and a
zero-ballot guard. Sofia's `Declined` is shown as a legacy recorded decision,
separate from responses. No individual ballots, choices, voter identities,
credentials, or submitter identity fields are modeled.

The active-session summary is a separate read snapshot from the viewed
position/poll. History selection, Polls/Candidates navigation, and every
toolbar affordance leave it unchanged. Copy, QR, participant, and presentation
affordances are visibly MOCK-only; they do not produce a usable link, QR
payload, viewer, publication, or capability. Clipboard failure is reported.
The toolbar's presence during navigation is in-memory UI behavior, not browser
or backend persistence.

No backend requests, API adapter, authentication simulation, or election/session
mutations are implemented. The read port is an application contract, not a
backend wire schema. Loading, empty, missing-context, and recoverable error
states preserve requested context and never substitute another fixture.

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
  shell viewing-context fixture.
- `src/features/workspace`: focused summary, session toolbar, poll history,
  selected-poll details, candidate view, and route composition. Keep future
  approved capabilities modular; do not add mutation controls or create a
  monolithic workspace component.

No query/global-state library, backend adapter, or shared cross-app package is
introduced.

## Prototype source and port boundaries

The pure derivations are narrowly ported from
`docs/prototype-v2/src/model.ts` (`getCurrentCandidateStatus`,
`getPollCandidateStatus`, `getPositionLifecycle`, `getOpeningSummaries`, and
`getPositionCondition`) and aggregate sorting/ballots-cast percentages from
`docs/prototype-v2/src/features/admin/AdminView.tsx`, with relevant expectations
from `docs/prototype-v2/src/model.test.ts`. Their source-linked tests cover decision
revision versus poll history, opening/response separation, open-poll readiness
gating, append-only response history, and retained finalized lifecycle.

The application model is a minimal aggregate/admin read contract, not a backend
wire schema and not a public viewer DTO. Position and active-session snapshots
are separate reads; active-session reads are scoped by church and term so a
position lookup cannot substitute another church's session. It has no ballot property, individual
ballot choices, voter or submitter identity, credentials, or election-policy
rules. Poll-level aggregate totals and ballots-cast values are permitted
administrator snapshots only. The read-only asynchronous
`PositionReader` scopes position reads by church, term, and position and
active-session reads by church and term, rejecting missing or out-of-scope
position data with a typed error. Its in-memory implementation returns
independently cloned snapshots and is only an explicit local substitute. A
future HTTP adapter must map verified backend DTOs and reuse the reader contract
tests; no endpoint or exact backend parity is claimed, and a failed real API
request must never fall back to fixtures.

Fixtures are deterministic snapshots grounded in the approved Riverside 2027
Prototype V2 position. Domain functions own current/poll status derivation,
opening acceptance, and aggregate result ordering/percentages; fixtures supply
source values. Replacement-aware opening assignment remains unsupported.

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
