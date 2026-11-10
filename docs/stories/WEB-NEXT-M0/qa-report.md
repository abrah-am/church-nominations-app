# WEB-NEXT-M0 focused QA report

Date: 2026-11-09

## Scope and result

Reviewed `apps/web-next` against `requirements.md` and `implementation-plan.md`.
This is foundation-only QA; no source or other documentation was changed.

**Result: PASS for the M0 foundation checks executed below.** No Admin shell,
workflow, backend integration, or production-readiness claim was assessed.

## Checks run directly

Environment: Node `v24.22.2` (matches `apps/web-next/.nvmrc`), npm `12.2.2`.

| Check | Command / evidence | Result |
| --- | --- | --- |
| Lint, tests, TypeScript and production build | `export PATH=/Users/abraham/.nvm/versions/node/v24.22.2/bin:$PATH; npm --prefix apps/web-next run check` | PASS: ESLint clean; 3 test files and 12 tests passed; `tsc -b` passed; Vite 8.3.7 production build passed. |
| Diff whitespace | `git diff --check` | PASS; no output. |
| Protected paths | `git diff --quiet -- apps/web apps/api docs/prototype-v2` and `git status --short -- apps/web apps/api docs/prototype-v2` | PASS: no tracked changes or untracked files in those paths. |
| Bootstrap / protected-source references | `rg` across `apps/web-next/src`, package manifests/lockfile and Vite/TS configs for `bootstrap`, protected app imports, and `docs/prototype-v2` imports | PASS: no Bootstrap dependency or source imports found. Documentation mentions the prototype as derivation provenance only. |
| Port data shape | Inspected `src/domain/types.ts`, `src/data/position-reader.ts`, fixtures and reader contract | PASS for current implementation: no ballot, voter, or credential fields in the typed snapshot or synthetic fixture. |
| Dependency audit | `npm --prefix apps/web-next audit --json` | PASS: 0 reported vulnerabilities (0 info, low, moderate, high, or critical). |

An initial `npm run check` from the repository root failed because that root has
no `check` script. The correct app-scoped command above then completed
successfully; this is not an application failure.

## Runtime and viewport evidence (parent-observed)

The following runtime checks were run by the parent independently and are
recorded as supplied evidence, not as checks I personally reproduced:

- Vite started on loopback port `5187`; `curl` GET `/` succeeded.
- Browser opened the page and found the `Frontend foundation` heading.
- At viewport sizes `1440x900`, `390x844`, and `320x568`, `document.scrollWidth`
  equaled the viewport width (`1440`, `390`, and `320` respectively);
  `horizontalOverflow=false` at each size.
- The temporary server was stopped with `stop_bash`.

These are basic placeholder/rendering and horizontal-overflow checks only. No
keyboard, axe, screen-reader, or broader accessibility conformance check is
claimed.

## Scope and contract limits

- The current mock reader is a church/term/position-scoped in-memory substitute,
  not an HTTP adapter. Missing or out-of-scope data rejects with
  `POSITION_NOT_FOUND`; snapshots are cloned. The adapter contract tests report
  the async scope, isolation, and current ballot/credential checks passing.
- Replacement/invitation assignment is deliberately not represented in the
  M0 `PositionSnapshot`. Consequently these derivations are not a complete
  replacement-aware lifecycle projection; see `review.md` for the precise
  source/plan boundary. Do not use this model as replacement-workflow truth.
- No production authentication, API parity, screen behavior, or persisted-data
  behavior was tested or is implied.

## Final follow-up validation (Tech Lead)

After review, the reader contract gained per-key voter/submitter identity checks.
`npm --prefix apps/web-next run check` was rerun on Node 24.22.2:
ESLint passed; **3 test files / 13 tests passed**; TypeScript and Vite production
build passed. `git diff --check` passed; protected-path diff remained empty.
These results supersede the earlier 12-test count.

The static UX gallery was opened successfully in the integrated browser and
visually inspected. Its nine SVG references are design exploration, not
implemented React screens or proof of responsive/accessibility conformance.
