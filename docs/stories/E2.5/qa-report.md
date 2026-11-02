# E2.5 QA Report

**Date:** 2026-11-01  
**Scope:** Current position workflow restoration, open-intake presentation placement, and reveal-gated broadcast behavior.

| Check | Expected behavior | Result | Evidence |
| --- | --- | --- | --- |
| Focused intake/revisit tests | Restore count and names; keep open names read-only; keep Audience presentation visible and place Broadcast list/status inside it | Pass | `cd apps/web && PATH="$HOME/.nvm/versions/node/v20.9.0/bin:$PATH" npm test -- --run src/App.test.tsx -t 'does not report zero profile submissions|restores current intake names|creates an intake' --reporter=dot` (2 passed; 72 skipped). A prior targeted selection for open intake, empty count, revisit, intake creation, and event stream also passed (4 passed; 70 skipped). |
| Production build/typecheck | TypeScript check and Vite production build succeed | Pass | `cd apps/web && PATH="$HOME/.nvm/versions/node/v20.9.0/bin:$PATH" npm run build` |
| Lint | No lint errors | Pass with existing warning | `cd apps/web && PATH="$HOME/.nvm/versions/node/v20.9.0/bin:$PATH" npm run lint`; zero errors, existing non-null assertion warning in `src/main.tsx:7` and TypeScript-eslint support-range warning for TS 5.4.5. |
| Full frontend suite | No frontend regressions | Partial / known failures | `cd apps/web && PATH="$HOME/.nvm/versions/node/v20.9.0/bin:$PATH" npm test -- --run --reporter=dot`; 84 passed, 3 failed of 87. Failures are annual-board workspace tests unable to locate the `Annual Boards` control; they do not mount the position panel and are unrelated to E2.5. |
| Diff hygiene | No whitespace errors | Pass | `git diff --check` |
| Authenticated browser screenshot | Rendered React UI can be visually inspected in a browser | Not verified | Prior capture attempt did not mount the sign-in region in a fresh headless page. No React screenshot is claimed. |

## QA Conclusion

E2.5-specific behavior is covered by passing focused component tests and a successful production build. The full suite remains partially blocked by three unrelated annual-board workspace failures. No backend changes were in scope. The Product Owner accepted the story on 2026-11-01. Merge authorization is separate and remains pending.
