# WEB-NEXT-M1 independent code review

Review scope: M1 requirements and implementation plan; `apps/web-next` source,
configuration, tests, current diff, and targeted fixes. Reviewed 2026-11-09.
No source files were changed.

## Critical issues

None found.

## Major issues

None found.

## Minor issues

- **[WEB-NEXT-M1/src/App.test.tsx:131-150] Automated Sheet focus test does not cover the wrapping boundary.** The committed jsdom test tabs once and asserts focus remains in the dialog, rather than tabbing past both ends. This is a coverage limitation, not a confirmed runtime defect: standalone headless Chrome 152 at 390×844 with trusted CDP input confirmed forward and reverse wrapping, focus containment, Escape close, and focus return. Consider retaining a boundary-cycle test when practical.

## Targeted fixes verified

- `application-navigation.tsx:12-13` now limits Elections' current state to `/admin` and `/admin/setup`; settings destinations each have their own exact-path active state.
- Added route assertions verify exactly one `aria-current="page"` link for direct settings loads and client navigation/back navigation.
- Removed document-level 320px minimum width from `html` and `body`; standalone browser measurements confirmed no horizontal document overflow at the requested widths.

## Scope and architecture

- Route views are explicit shell-only placeholders. The shell uses local mock viewing context; no API/auth integration is claimed.
- The shell/context contains no implicit participant/session operations or persistence/network calls. Future-work domain/data modules are not rendered or invoked by these routes.
- No Dashboard route or sidebar destination is present; Church → Term → Department → Position is confined to the context panel.
- `apps/web`, `apps/api`, and `docs/prototype-v2` have no working-tree changes. No M2 workspace UI or session workflow was found in the reviewed shell.

## Final recommendation

**Approve.** The active-navigation defect is fixed and covered by route regression assertions. The remaining focus-boundary issue is a minor test-coverage suggestion; runtime behavior passed standalone Chrome verification.
