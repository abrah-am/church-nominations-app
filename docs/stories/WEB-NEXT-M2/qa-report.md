# WEB-NEXT-M2 QA report

## Verdict

**Accepted by the Product Owner.** No known acceptance defects remain after
fixing the independent QA finding described below. Merge and deployment are
not authorized.

## Automated checks

- Node.js 24.22.2:
  `npm --prefix apps/web-next run check` — passed.
- ESLint, TypeScript project checks, and Vite production build — passed.
- Vitest: 6 files, 37 tests passed.
- `git diff --check` — passed.

## Browser and interaction checks

Headless Chromium exercised the final implementation at 1440x900, 390x844 and
320x568:

- Polls/results and Candidates views had no document or element-level
  horizontal overflow at any target viewport.
- Candidate table retained desktop headers and displayed explicit field labels
  at mobile widths. Results retained semantic table headers and mobile labels.
- Opening summary, active-session toolbar, poll history and selected-poll content
  remained readable and within the viewport.
- Selecting a historical poll and switching Polls/Candidates did not change
  the active session. Keyboard Enter on a history item selected that poll while
  retaining the Round 2 · Open active session.
- Tab focused the skip link with a visible outline; Enter focused `main-content`.
- Selecting Secretary (whose position snapshot is unavailable) retained the
  same-church/term active-session toolbar and identified the viewed position as
  unavailable instead of substituting a poll or session.
- MOCK previews and mock-reference copy did not create an access link, QR
  payload, viewer, publication, or capability.

Rendered captures are in [visual-validation](visual-validation/).

## Independent QA finding and disposition

The QA Engineer initially reported **D1 (Medium)**: a failed position read also
hid the separately scoped active-session toolbar. Position and active-session
reads were separated; the toolbar now remains available when the selected
position is unavailable, and reports its own loading/error state without
claiming a failed session read means no active session. A regression test covers
successful active-session data alongside a failed position read. The
Secretary/error path was re-exercised in Chromium after the fix; the toolbar
remained present with Church Elder · Round 2 · Open.

The independent QA Engineer's focused run before the fix passed 25 tests and
reported the defect. The final complete 37-test result and post-fix browser
reproduction were run by the Tech Lead.

## Limitations

No screen-reader/assistive-technology test, axe audit, formal WCAG conformance
claim, 200% zoom test, or cross-browser matrix is claimed. These limitations
were disclosed for Product Owner acceptance.
