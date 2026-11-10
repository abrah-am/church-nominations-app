# WEB-NEXT-M1 UX validation

**Disposition: Approve the implemented M1 shell for UX acceptance.**

Revalidated 2026-11-09 against the approved [M0 refinement](../WEB-NEXT-M0/ux-refinement.md), the [M1 requirements](requirements.md), and [implementation plan](implementation-plan.md). The [comparison gallery](screenshot-comparison.html) uses local files. Only shell, application navigation, and viewing-context presentation are scored; the Position Workspace illustration in the approved references is later-milestone artwork.

## Findings

No material UX defects remain in the final review.

- **Navigation selection:** verified in the running app at `/admin`, `/admin/setup`, `/admin/setup/churches`, and `/admin/setup/terms`. Each route now has exactly one selected item: Elections for the first two, Church settings and Term management for their respective routes. This resolves the prior REQ-002 finding.
- **Compact overflow:** at a 320×568 CSS viewport, the running page reports `documentElement.clientWidth = 305` and `scrollWidth = 305`. The 15px difference from the CSS viewport is the vertical scrollbar gutter; there is no horizontal document overflow. This resolves the prior REQ-004 finding.
- **Capture geometry:** final images show the intended layouts. At 1440, the desktop sidebar measures 246px and context selectors occupy the wide content header. At 390, the mobile header and two-column selector rows (Church; Term/Department; Position) are visible. At the 320 CSS viewport, all selectors stack and the full church name wraps without clipping. That screenshot's bitmap is 305×612, reflecting the available viewport content width and captured page height; runtime geometry above is the overflow check. The open-navigation image is settled, with opaque sheet, full destination labels, and no duplicated hierarchy context.

## Overall comparison

The visible shell matches the approved restrained slate/gray palette, 246px desktop sidebar, full Church/Term/Department/Position labels, and separation of context from application destinations. The compact church name wraps rather than clipping. Mobile navigation contains only Elections and the two approved Settings destinations. The authorized shell-only Position Workspace placeholder is correct for M1; absence of the reference's position summary, polls, candidates, and other workspace artwork is **not a defect**.

Standalone Chrome keyboard QA confirmed the mobile Sheet keyboard behavior; no keyboard behavior was independently retested in the integrated browser. No real-user usability testing is claimed.

## Recommendation

**Approve the M1 shell from a UX perspective.** Updated screenshots now support visual review at desktop, 390px mobile, compact mobile, and navigation-open states. The M1 shell follows the approved direction; M2 workspace artwork remains explicitly out of scope.
