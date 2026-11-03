# E3.1 QA Report: Prepare Round 1

**Status:** Accepted by Product Owner 2026-11-03.

## Acceptance Results

| Criterion | Result | Evidence |
| --- | --- | --- |
| Confirmed list and Prepare action remain visible before setup | Pass | App workflow test reaches confirmed-list state before preparation. |
| Setup replaces consolidated-list review content | Pass | Focused workflow asserts Round 1 setup heading and absence of confirmed list. |
| Read-only poll roster, candidate count, and order | Pass | Component renders ordered confirmed candidates; workflow test verifies displayed roster and saved request payload. |
| Selection count is bounded from 1 through roster size | Pass | Number input min/max and stepper disabled state are defined in RoundPollSetup; save validation remains server workflow-owned. |
| Start remains visible and gated on valid saved draft | Pass | Workflow test verifies availability after save and disabled state before configuration in reset scenario. |
| Expected-voter confirmation and cutoff warning retained | Pass | Existing workflow test verifies 16 expected voters and 15-ballot cutoff. |
| Save/start failures preserve state and permit retry | Pass | Workflow test exercises save failure/retry and start failure/retry while preserving selection/count. |
| Cancel/rebuild returns to confirmed list and preserves focus | Pass | Draft reload/cancel test verifies DELETE, confirmed list restoration, and focus on Prepare action. Reset drafts disable rebuild cancellation to preserve reset history. |
| No nomination data is changed by entering/leaving setup | Pass | Transition changes local round-setup state; cancellation only deletes an eligible first-round draft. |
| Keyboard/accessibility feedback | Pass with limitation | Component heading receives focus; start dialog traps Tab, restores trigger focus on cancel, and routes successful-start focus to its status. Progress, success and error messages use status/alert semantics. Screen-reader verification was not performed. |
| Narrow viewport without horizontal scrolling | Not verified at runtime | CSS allows candidate name and action wrapping; browser was only available at sign-in state, so the authenticated setup was not inspected at 320 CSS px. |

## Visual Comparison Follow-up

After the initial implementation, the Product Owner noted that the view did not visually match the prototype and requested: full workflow-width setup and roster cards immediately after election progress, a compact Bootstrap number input, **Start Voting** as the primary save-and-continue action, and **Cancel and rebuild draft** as the secondary action. The workflow grid is one column during first-round setup; the two stacked sections occupy its full width. The primary action saves changed settings, then opens the existing expected-voter confirmation; a valid saved draft opens confirmation directly. The large stepper and separate **Save round setup** button are removed. Tests cover roster presence, save retry, save-before-confirm, expected-count dialog, cancellation, and reset behavior. Browser inspection confirmed the app starts at administrator sign-in; no credentials were supplied, so authenticated desktop/mobile rendering was not verified.

A subsequent screenshot review found the configuration label and setup still looked detached from the workflow card. The generic configuration summary/description is now hidden during Round 1 setup, and the setup itself has a full-width bordered card inside the position-workflow region. The focused test asserts that card class and visible setup region.

The final screenshot review identified a missing lower edge on the election-progress card: the closed-intake style removes its bottom border because it normally joins the consolidation panel. When Round 1 setup replaces that panel, a setup-specific state now restores the bottom border, lower padding, and rounded lower corners. The focused workflow test asserts this state. Bootstrap is used for the number field through `form-control`; the cards themselves use the application's existing CSS rather than a React-Bootstrap `Card` component.

Follow-up confirmed that the progress and setup should read as one card. In the primary Round 1 state, the progress card omits its bottom edge and the setup section continues the side borders, with one shared bottom edge and lower corners. The focused test asserts both state classes.

## Checks Executed

- Focused E3.1 and reset tests: `npm test -- --run src/App.test.tsx -t "keeps nominations hidden until reveal, then saves one shared list|resets a closed round separately from reopen|reloads a round 1 draft into focused setup and cancels back to the confirmed list"` with Node 20: **3 passed, 73 skipped**.
- Full frontend suite with Node 20: **86 passed, 3 failed**. The failures are `creates an annual board with a named roster only after selecting that workspace`, `creates a dated session and saves the selected member attendance`, and `preserves separate unsaved attendance drafts when switching sessions`. Their failures show the expected Annual Boards control is absent on the rendered election overview; these are unrelated to E3.1.
- `npm run lint`: passed with one existing warning at `src/main.tsx` for a non-null assertion, plus the existing TypeScript/tooling compatibility notice.
- `npm run build`: passed; TypeScript check and Vite production build succeeded.
- `git diff --check`: passed.
- After the final card containment update, focused E3.1 and reset tests: **3 passed, 73 skipped**; frontend build and `git diff --check` passed. Lint remains passed with the same existing warning in `src/main.tsx`.
- After the lower-edge fix, the focused Round 1 workflow test passed (**1 passed, 75 skipped**); production build and diff check passed.
- After joining the progress and setup card borders, the focused Round 1 workflow test passed (**1 passed, 75 skipped**); production build and diff check passed.

## Reviews

- Code review: initial findings (reset-history deletion risk, hidden load error) were fixed. Final review confirmed both resolved; no outstanding code findings.
- UX review: setup, error/status feedback, focus and narrow-layout rules inspected. Runtime viewport and assistive-technology checks remain unverified.
- QA review: focused story behavior passed; full-suite failures and viewport limitation recorded above.
