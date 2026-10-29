# E9.1: Establish Bootstrap 5 Design Foundation and Shared Components

- **Epic:** E9 Bootstrap UI Modernization
- **Priority:** P1 (proposed)
- **Workflow status:** First admin slice accepted by Product Owner; Annual Boards visual migration implemented on `feature/e9.1-admin-foundation`, with the next UX review pending
- **User story:** As an administrator or election participant, I want a consistent, responsive interface so I can understand and complete election tasks confidently across devices.

## Product Owner Approval

The Product Owner approved the UX redesign initiative and the recommended Bootstrap 5 CSS integration with existing React-controlled components on 2026-10-26. This approval authorizes planning/refinement, not implementation, dependency installation, merge, or deployment. Implementation requires approval of the refined implementation plan. The UX assessment recommended retaining a restrained visual identity while improving hierarchy, spacing, typography, and consistency.

## Product Owner Decision: NAD Theme (2026-10-29)

The Product Owner approved updating the application and E9.1 HTML prototypes to use the North American Division (NAD) brand colors and typography. This approval is limited to colors and font styling; preserve all existing layout, spacing, markup, React components, and behavior.

- Use NAD Denim (`#003B5C`) as the primary color and Nile (`#007681`) as the secondary/focus accent.
- Use Vine (`#4A7729`) for completion/success states, with other NAD digital palette colors used selectively for warnings and status accents.
- Use Noto Sans for electronic UI text. Keep monospace styling for URLs/code values.
- Update the app's shared styles and both E9.1 standalone prototype HTML files consistently.
- Do not infer accessibility conformance from brand adoption; E7.1/PD-009 contrast target and validation requirements remain open.

## Acceptance Criteria

- Bootstrap 5 CSS is the shared layout and component-style foundation; existing React components remain responsible for application behavior and state.
- A small, documented theme layer defines the approved brand colors, typography, spacing, focus treatment, and status colors without creating a competing custom grid system.
- Reusable accessible React primitives are established for the application shell, section headings, status/alert messages, empty/loading states, labeled fields, action groups, responsive list rows, disclosures, and confirmation dialogs.
- The authenticated admin shell, participant surfaces, and read-only presentation remain distinct, with navigation and controls appropriate to each capability.
- Existing routes, API contracts, election workflows, privacy boundaries, and business rules remain unchanged.
- **Visual fidelity is an acceptance requirement:** each migrated surface must be rendered and compared directly with its approved prototype/reference at 1280px desktop and 390px mobile. Match layout, typography, palette, spacing, navigation, visual hierarchy, and responsive reflow; automated tests, lint, and build alone do not establish UX acceptance.
- Record paired desktop/mobile screenshots for the prototype/reference and implementation. Document significant differences, whether caused by API/domain constraints or implementation choices, and resolve them or obtain explicit Product Owner acceptance before marking the UX slice done.
- Apply the same rendered-reference comparison and evidence requirement to subsequent UX implementation slices; each feature story retains its own behavior acceptance criteria.
- The foundation is introduced incrementally; workflow-specific layouts are migrated within their existing stories rather than rewritten in one pass.
- Core forms, buttons, tables/lists, alerts, dialogs, and status indicators use consistent shared patterns and reflow at the supported mobile widths.
- No horizontal scrolling, clipped content, overlapping controls, or hover-dependent actions occur in the approved core viewport matrix; long candidate and nominee names remain readable.
- Keyboard focus remains visible and logical; semantic labels, headings, status announcements, and dialog behavior continue to meet the accessibility target approved under E7.1.
- The frontend test suite and build pass, and focused regression checks cover migrated states and protected privacy behavior.

## Scope

- Establish Bootstrap 5 CSS integration and a restrained application theme.
- Define shared UI primitives and migration conventions for existing React feature components.
- Migrate the top-level authenticated shell and one representative admin flow plus one public participant flow as the foundation validation slice.
- Document how existing feature stories adopt the design foundation and how responsive/accessibility regression evidence is recorded.

## Out of Scope

- React-Bootstrap or another component framework.
- Backend changes, API contract changes, or changes to election rules, authorization, link lifecycle, ballot confidentiality, or tenant isolation.
- Rewriting the whole frontend or replacing existing domain components wholesale.
- Adding a new router or changing participant/presentation access behavior.
- Resolving open accessibility, browser/device, language, privacy, or retention policy decisions by assumption.
- Duplicating existing feature stories for nominations, voting, results, history, accessibility, or responsive repairs.

## Existing Story Overlap and Ownership

E9.1 owns the shared design foundation and migration conventions. Existing stories remain authoritative for feature behavior and their acceptance criteria:

- E2.1-E2.4: nomination intake states, consolidation recovery, roster-lock messaging, and unresolved correction policy.
- E3.4: candidate roster readability.
- E4.1-E4.6: round-start/cutoff explanation, ballot operation, mobile/recovery states, and next actions.
- E5.1-E5.4: results scanning, candidate-decision feedback, next-round handoff, and undo policy.
- E6.8-E6.12: presentation, nomination reveal, participant session-link access, and future QR work.
- E7.1-E7.3: accessibility target, keyboard/semantic audit, and responsive validation.

Do not treat E9.1 as acceptance of unfinished feature stories. Incorporate shared Bootstrap patterns within those stories when they are scheduled.

## Dependencies and Decisions

- Product Owner approval of the Bootstrap 5 CSS approach and overall incremental direction is recorded; no code or dependency work is authorized by that approval alone.
- E7.1 and PD-009 must establish the accessibility conformance target and test approach, supported browsers/devices/viewports, and touch-target expectation before accessibility sign-off. WCAG 2.2 AA is a proposal only, not an approved requirement.
- The NAD palette and Noto Sans theme are approved for this theme-only change. The broader E9.1 implementation plan and remaining design/accessibility decisions retain their existing approval gates.
- Existing frontend tests and current workflow behavior are the regression baseline. Confirm representative flows and viewport matrix in the implementation plan.

## Risks and Regression Constraints

- Bootstrap resets and global styles may conflict with legacy selectors in `apps/web/src/styles.css`; migrate by surface and remove legacy rules only when their replacement is verified.
- Styling changes can accidentally obscure private active-ballot states or expose controls across admin, participant, and presentation surfaces. Preserve route separation and test capability boundaries.
- Preserve visible focus, focus restoration, unsaved-draft warnings, keyboard flows, live announcements, and error/retry states while extracting shared primitives.
- Keep active ballot totals hidden; never expose named attendance as ballot participation or present device/profile counts as verified people.

## Validation Strategy

- Run frontend lint, unit/component tests, and production build after each migration slice.
- Add focused React Testing Library coverage for affected loading, empty, error, success, dialog, and keyboard-relevant states.
- Validate at the approved viewport/browser matrix for overflow, long names, dialog sizing, action availability, and responsive control layout.
- Capture and compare equivalent approved-reference and implemented screens at 1280px and 390px for each migrated UX slice. Review sign-in, dashboard/overview, and position navigation where included in scope. Log significant visual variance and close it or obtain Product Owner acceptance; passing component tests/lint/build is necessary but not sufficient.
- Perform keyboard and screen-reader checks and measure contrast against the E7.1-approved target.
- Verify privacy-sensitive states: no active-round totals, attendance remains separate from ballot activity, and presentation/participant views disclose only their approved content.
- Do not claim conformance until the approved manual and automated checks have evidence.
