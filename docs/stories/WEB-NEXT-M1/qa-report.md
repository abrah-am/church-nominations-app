# WEB-NEXT-M1 QA report

QA scope: required automated checks plus targeted standalone real-browser
verification of responsive document width, active navigation, and Sheet
keyboard behavior. No source files were changed.

## Automated check

Command:

```text
PATH=/Users/abraham/.nvm/versions/node/v24.22.2/bin:$PATH npm --prefix apps/web-next run check
```

Runtime confirmed: Node `v24.22.2`; npm `12.2.2`.

Result: **PASS (exit code 0)**.

- ESLint completed without reported errors.
- Vitest: 5 test files passed; 22 tests passed.
- TypeScript project check and Vite production build passed.
- `git diff --check` passed.
- Protected paths `apps/web`, `apps/api`, and `docs/prototype-v2` have no working-tree changes.

## Standalone Chrome checks

Used installed headless Google Chrome `152.0.7977.66`, a temporary profile, and
the app at `http://127.0.0.1:5187/admin`. No browser packages were installed.
Viewport sizing, trusted mouse/keyboard input, and DOM measurements used Chrome
DevTools Protocol (CDP).

| Viewport | `innerWidth` | `documentElement.scrollWidth` | `body.scrollWidth` | Horizontal overflow |
| --- | ---: | ---: | ---: | --- |
| 1440×900 | 1440 | 1440 | 1440 | None |
| 390×844 | 390 | 390 | 390 | None |
| 320×568 | 320 | 320 | 320 | None |

At 320×568 the document height was 592px, resulting in vertical scrolling only.

Active navigation was checked on `/admin`, `/admin/setup`,
`/admin/setup/churches`, and `/admin/setup/terms`: each route exposed exactly
one current link, respectively Elections, Elections, Church settings, and Term
management.

At 390×844 the Sheet opened with focus on Elections. Repeated Tab and
Shift+Tab traversed and wrapped through its links and Close control without
leaving the Sheet. Escape closed it and returned focus to Open navigation.

## Test coverage and limitations

The committed route tests now cover the active item on direct settings routes,
client navigation, and back navigation. The committed jsdom Sheet test does
not test wrapping at the focus boundary (it checks one Tab only); the boundary
cycle and return behavior were verified in standalone Chrome above.

No separate visual comparison or screenshot capture was performed in this
review. Parent-reported screenshots and UX review are outside this QA run.
No real assistive-technology testing was performed.

## QA disposition

**Pass.** Automated checks and targeted browser checks passed. The previous
active-navigation issue is resolved. No confirmed critical or major issues
remain; the focus-wrap test-coverage suggestion is documented in `review.md`.
