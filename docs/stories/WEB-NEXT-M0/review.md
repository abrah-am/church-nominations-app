# WEB-NEXT-M0 independent review

Date: 2026-11-09

## Summary

Reviewed the M0 requirements and implementation plan, all `apps/web-next`
source/config/tests, dependency lockfile, and the relevant pure derivations in
`docs/prototype-v2/src/model.ts`. The changes stay within the new app and the
M0 story; protected `apps/web`, `apps/api`, and `docs/prototype-v2` paths are
unchanged. No Bootstrap dependency or cross-app source import was found.

### Critical issues

None.

### Major issues

None.

### Minor issues

1. **The reusable reader contract does not detect voter-identity fields**
   (`apps/web-next/src/data/position-reader.contract.ts:52-59`, especially
   lines 56-59). It rejects `ballot(s)` and `credential(s)` keys, but would
   still accept a returned snapshot containing a runtime-only key such as
   `voterId` or `voterName`. The current `PositionSnapshot` interface and
   in-memory fixture contain no such field, so no current identity exposure
   was found. This is a test-coverage gap for the contract intended to be reused
   by future adapters.

   **Reproduction:** add a runtime-only `voterId` property to a returned
   snapshot (for example, in an adapter response or an unsafe test fixture)
   and run `npm --prefix apps/web-next test`; the current contract does not
   fail on that field. **Suggested fix:** extend the contract to reject
   voter-identity fields or validate a strict allowlisted public shape,
   retaining permitted candidate identifiers and names.

## Deliberately limited replacement behavior (not an M0 blocker)

`apps/web-next/src/domain/types.ts:58-70` (the `PositionSnapshot` shape) has no
invitation/replacement event collection. In
`apps/web-next/src/domain/position-summary.ts:59-107`, opening assignment is
derived only from elected candidates and response events, and
`electedCandidate` is returned as the assigned `candidate` (lines 99-105).
`getPositionCondition` (lines 110-125) therefore has no replacement-pending
condition branch.

This is a deliberate narrowing documented in `apps/web-next/README.md` and is
consistent with the plan's T003 exclusion of conflicted replacement/outcome
behavior. It differs from the prototype source: `docs/prototype-v2/src/model.ts`
lines 233-245 applies invitation events and exposes a separate
`electedCandidate`, while lines 253 and 258 make an unresolved replacement a
vacancy. The plan's source-anchored condition list also names unresolved
replacement as a Vacancy condition. Treat this as a contract/scope boundary:
the M0 model cannot distinguish original and replacement candidates and must
not be consumed as a replacement-aware lifecycle summary. Before a replacement
feature uses it, reconcile the source-spec wording and either add verified
replacement events plus parity tests or explicitly keep that derivation out of
scope. No replacement policy is recommended here.

## Dependency note

`apps/web-next/package.json:39-41` overrides `minimatch` to `^11.0.5`; the lock
resolves `11.0.5`, while some consumers in the lock declare `^10.2.x`. The
current dependency tree builds/tests successfully and `npm audit` reports zero
vulnerabilities. The current audit result does not establish whether the
override is necessary absent it; no runtime incompatibility was observed. This
is not a finding requiring a change, but its security-remediation rationale
should remain traceable if the override is retained.

## Recommendation

**Approve** the M0 foundation, with the minor identity-contract test gap noted
above and the explicit restriction that these derivations are not suitable for
replacement-aware workflows. Validation evidence and browser scope limits are
recorded in `qa-report.md`.

## Follow-up resolution (Tech Lead, 2026-11-09)

- Added recursive voter/submitter identity-key checks to the reusable contract.
  Corrected the initial negated `arrayContaining` assertion (which would reject
  only the entire forbidden set) to check each prohibited key individually.
- Clarified the implementation plan's source-port boundary: invitation-based
  reassignment and replacement-dependent condition branches are excluded from
  the reduced M0 model, not changed as product policy.
- Frontend Developer investigated the minimatch override: removing it resolved
  vulnerable 10.2.6 (GHSA-g3hv-75wg-m249); current consumers request 10.x with no
  fixed 10.x release. Retained the documented dev-tool-only override to first
  fixed 11.0.1, with cross-major caveat in the application README.
- Tech Lead reran `npm --prefix apps/web-next run check`: lint, 13 tests,
  TypeScript and production build passed. `git diff --check` passed.

The minor finding is addressed; the reduced-model limitation remains explicit.
This follow-up was verified by the Tech Lead, not a second independent review.
