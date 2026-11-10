# WEB-NEXT-M1 implementation plan

## Approved scope and design

Use the [approved refined specification](../WEB-NEXT-M0/ux-refinement.md) and
[1440/390/320 references](../WEB-NEXT-M0/visual-refinement/index.html), but implement
only application navigation and content-header context. Workspace artwork is
future scope, not a requirement to build its content now.

Follow the existing independent npm app and feature/domain/data boundaries.
No backend endpoints are required for M1. Local typed context fixtures are
explicit development data, not a fallback from failed HTTP calls.

## Tasks

- [x] T001 (REQ-001, REQ-003) Frontend Developer: use official shadcn tools to add
  only required primitives under `apps/web-next/src/components/ui`; apply approved
  semantic theme tokens and typography. Avoid installing whole dashboard blocks.
- [x] T002 (REQ-002, REQ-003, REQ-005) Frontend Developer: compose modular Admin
  shell, approved application navigation and compact dependent context selectors.
  Implement only shell routes/views with clear not-yet-built content. Preserve
  full navigation labels and separate viewing state from session behavior.
- [x] T003 (REQ-004, REQ-005) Frontend Developer: add focused interaction tests for
  navigation, context cascading, mobile dialog focus/Escape/return, skip link,
  and absence of participant mutations. Use properly owned shadcn primitives.
- [x] T004 (REQ-006, REQ-007) Frontend Developer and Tech Lead: run app checks,
  browser keyboard/overflow checks and capture durable screenshots at all three
  widths plus mobile navigation open. Compare only implemented shell regions
  against the approved design; do not treat omitted M2 content as a defect.
- [x] T005 (REQ-006) UX Designer, QA and Code Reviewer: independently assess visual
  fidelity, acceptance criteria, keyboard behavior and correctness. Record
  `ux-validation.md`, `qa-report.md` and `review.md`; resolve material findings.
- [x] T006 (REQ-007) Tech Lead: update Code Map/backlog/handoff, report exact
  executed checks, limitations, changed files and screenshots for Product Owner
  acceptance. Stop before M2. No commit, merge or deployment implied.

Dependencies: T002 depends on T001; T003 follows T002; T004 follows T003;
T005 follows implementation/checks; T006 follows validation and corrections.

## Requirement mapping

| Requirement | Tasks | Evidence |
| --- | --- | --- |
| REQ-001 | T001, T002, T004, T005 | tokens/shell source; screenshots and UX comparison |
| REQ-002 | T002, T003 | nav/context components and focused tests |
| REQ-003 | T001, T002 | owned shadcn primitives and typed fixtures |
| REQ-004 | T003, T004, T005 | keyboard tests and browser viewport evidence |
| REQ-005 | T002, T003, T005 | viewing-only state and absence of workspace operations |
| REQ-006 | T003, T004, T005 | check commands, screenshots and review reports |
| REQ-007 | T004, T006 | protected-path checks, handoff and acceptance gate |
