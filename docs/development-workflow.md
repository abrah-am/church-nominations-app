
# AI Development Team — Standard Workflow

## 1. Purpose

This document defines the standard development
lifecycle for every user story in this project.

The development team is coordinated by an AI
Tech Lead and includes specialized agents.

The Product Owner is the human user.

The objectives are to:
- Deliver working software incrementally.
- Maintain high standards for UX and code quality.
- Minimize unnecessary human intervention.
- Preserve context between AI chat sessions.
- Ensure requirements and decisions are documented.
- Maintain traceability from requirements to testing.

The Tech Lead is responsible for following
this workflow and coordinating all agents.

---

## 2. Team Roles

### Product Owner (Human)

Responsibilities:
- Define product goals and priorities.
- Clarify business requirements.
- Approve significant UX decisions.
- Approve implementation plans.
- Accept or reject completed stories.
- Authorize merges and deployments.

### Tech Lead

Responsibilities:
- Own the development lifecycle.
- Review requirements and architecture.
- Break stories into actionable tasks.
- Coordinate specialized agents.
- Manage dependencies and API contracts.
- Review agent deliverables.
- Track progress and blockers.
- Maintain documentation and handoffs.
- Report decisions requiring Product Owner approval.

### UX Designer (`ux-designer`)

Responsibilities:
- Understand user goals and workflows.
- Define navigation and user journeys.
- Produce wireframe and interaction specifications.
- Define responsive behavior.
- Specify accessibility requirements.
- Review the implemented user experience.

### Frontend Developer (`frontend-developer`)

Responsibilities:
- Implement approved UI designs.
- Build React and TypeScript components.
- Integrate with backend APIs.
- Implement client-side validation.
- Handle loading, error, and empty states.
- Write frontend tests.

### Backend Developer (`backend-developer`)

Responsibilities:
- Implement REST APIs and business logic.
- Maintain API contracts.
- Implement persistence when needed.
- Validate input and handle errors.
- Implement security controls.
- Write backend tests.

### QA Engineer (`qa-engineer`)

Responsibilities:
- Derive tests from acceptance criteria.
- Validate functional requirements.
- Execute relevant automated tests.
- Identify defects and regressions.
- Verify fixes.
- Report test coverage and limitations.

### Code Reviewer (`code-reviewer`)

Responsibilities:
- Review maintainability and code quality.
- Identify security and correctness risks.
- Verify architectural consistency.
- Review error handling and test adequacy.
- Recommend necessary corrections.

---

## 3. Source of Truth

The repository is the source of truth.

Do not rely on previous chat conversations
for important project decisions.

### Product Documents

- `docs/product/requirements.md`
- `docs/product/backlog.md`

### Technical Documents

- `docs/technical/architecture.md`
- `docs/technical/api-contract.md`
- `docs/technical/decisions/`

### Story Documents

Each story has its own directory:

`docs/stories/US-XXX/`

Expected documents:

- `requirements.md`
- `implementation-plan.md`
- `ux-design.md`
- `qa-report.md`
- `review.md`
- `handoff.md`

Create documents when the relevant phase begins.

For backend-only stories, UX design may be marked
Not Applicable.

Do not create empty documents solely to satisfy
the directory structure.

---

## 4. Standard Story Lifecycle


## Phase 0 — Story Intake and Backlog Refinement

Owner: Tech Lead
Approver: Product Owner

Purpose:
Convert product ideas, feature requests, and
reported problems into actionable user stories.

Inputs:
- Product Owner's feature request
- Product requirements
- Existing backlog
- Relevant architecture

Actions:
1. Understand the problem and desired outcome.
2. Identify the intended users.
3. Check for duplicate or overlapping stories.
4. Ask focused clarification questions if needed.
5. Define the user story:
   "As a [user], I want [capability],
   so that [benefit]."
6. Define scope and exclusions.
7. Write testable acceptance criteria.
8. Identify dependencies and risks.
9. Recommend priority and story size.
10. Split oversized stories when appropriate.
11. Present the proposal for Product Owner approval.

After approval:
1. Assign a unique story ID.
2. Create:
   docs/stories/US-XXX/requirements.md
3. Update:
   docs/product/backlog.md
4. Mark the story as Backlog or Ready,
   depending on refinement completeness.

Rules:
- Do not begin implementation.
- Do not create a feature branch.
- Do not invoke development agents.
- Do not change existing story priorities
  without Product Owner approval.
- Do not assume backlog approval means
  implementation approval.

Exit Criteria:
- Product Owner approves the story.
- Story documentation exists.
- Backlog is updated.
- Dependencies and priority are recorded.


### Phase 1 — Story Discovery and Planning

Owner: Tech Lead

Inputs:
- Product requirements
- Product backlog
- Architecture
- Existing story documentation
- Current Git state

Actions:
1. Read relevant project instructions.
2. Review the story and its business objective.
3. Clarify missing requirements.
4. Define measurable acceptance criteria.
5. Identify dependencies and risks.
6. Determine which agents are needed.
7. Break work into implementation tasks.
8. Estimate complexity qualitatively.
9. Identify decisions requiring approval.

Deliverables:
- `requirements.md`
- `implementation-plan.md`

Exit Criteria:
- Requirements are clear.
- Acceptance criteria are testable.
- Dependencies are identified.
- The Product Owner approves the plan.

Do not begin implementation before approval.

---

### Phase 2 — UX Discovery and Design

Owner: UX Designer

Coordinator: Tech Lead

Inputs:
- Story requirements
- Product requirements
- Existing design conventions
- Related user flows

Actions:
1. Identify user goals.
2. Define the primary user journey.
3. Propose information architecture.
4. Specify screen layouts and navigation.
5. Define interaction behavior.
6. Define loading, empty, error, and success states.
7. Define responsive behavior.
8. Specify accessibility requirements.
9. Identify usability risks and assumptions.

Deliverable:
- `ux-design.md`

The Tech Lead reviews the UX proposal.

Exit Criteria:
- Primary user flows are documented.
- Important interaction states are defined.
- Accessibility requirements are identified.
- Significant design decisions are approved
  by the Product Owner.

For stories without user-facing changes,
this phase may be skipped with justification.

---

### Phase 3 — Implementation Preparation

Owner: Tech Lead

Inputs:
- Approved requirements
- Approved UX specifications
- Architecture
- API contract

Actions:
1. Confirm the implementation approach.
2. Inspect the current Git branch.
3. Create or select the story feature branch.
4. Verify the working tree before changes.
5. Identify frontend/backend dependencies.
6. Define or update API contracts.
7. Assign tasks to specialized agents.
8. Establish task boundaries to avoid
   conflicting file edits.

Deliverables:
- Updated `implementation-plan.md`
- Updated `api-contract.md` when applicable

Exit Criteria:
- Work is ready for implementation.
- Agent responsibilities are clear.
- Required contracts are agreed upon.

---

### Phase 4 — Implementation

Owners:
- Frontend Developer
- Backend Developer

Coordinator: Tech Lead

Actions:
1. Delegate implementation tasks.
2. Follow approved architecture and UX design.
3. Implement the smallest complete feature.
4. Write relevant automated tests.
5. Handle errors and edge cases.
6. Maintain API compatibility.
7. Update documentation for material changes.
8. Report blockers and dependencies.

Rules:
- Do not introduce unapproved major dependencies.
- Do not invent API contracts.
- Do not hardcode credentials or secrets.
- Do not modify unrelated features.
- Do not perform destructive data operations
  without explicit approval.
- Do not merge or deploy.

Exit Criteria:
- Required functionality is implemented.
- Relevant unit tests have been executed.
- Known limitations are documented.
- The Tech Lead has reviewed the results.

---

### Phase 5 — Quality Assurance

Owner: QA Engineer

Coordinator: Tech Lead

Inputs:
- Story acceptance criteria
- Implementation
- UX specifications
- API contracts

Actions:
1. Build a test checklist from acceptance criteria.
2. Run relevant automated tests.
3. Verify frontend/backend integration.
4. Test validation and error handling.
5. Evaluate important edge cases.
6. Check for regressions.
7. Document defects and limitations.

Deliverable:
- `qa-report.md`

Each test result must indicate:
- Test or acceptance criterion
- Expected behavior
- Actual behavior
- Pass, Fail, Blocked, or Not Run
- Evidence or command used, when applicable

Exit Criteria:
- Required tests have been executed.
- No unresolved critical defects remain.
- Outstanding issues are documented.

Do not claim tests passed unless executed.

---

### Phase 6 — Independent Review

Owners:
- Code Reviewer
- UX Designer, when applicable

Coordinator: Tech Lead

Actions:
1. Delegate independent code review.
2. Check architectural consistency.
3. Review correctness and maintainability.
4. Review security and data handling.
5. Review test adequacy.
6. Compare the implemented UI against UX specs.
7. Identify usability and accessibility issues.
8. Classify findings by severity.

Deliverable:
- `review.md`

Severity:
- Critical: Security, data loss, or major failure.
- High: Significant correctness or usability issue.
- Medium: Important quality improvement.
- Low: Minor improvement or polish.

Exit Criteria:
- Critical and high-severity issues are resolved
  or explicitly accepted by the Product Owner.
- Required fixes are verified.
- Relevant tests are rerun.

If issues are found, return work to the
appropriate developer, then repeat affected
QA and review activities.

---

### Phase 7 — Product Owner Acceptance

Owner: Product Owner

Coordinator: Tech Lead

The Tech Lead presents:
1. Story objective.
2. Implemented functionality.
3. Acceptance criteria and status.
4. Test results.
5. Review findings.
6. Known limitations.
7. Instructions to run and verify the feature.
8. Outstanding decisions.

The Product Owner may:
- Accept the story.
- Request changes.
- Reject the implementation.

If changes are requested, return to the
appropriate phase.

Exit Criteria:
- Product Owner explicitly accepts the story.

---

### Phase 8 — Merge and Closure

Owner: Tech Lead

Prerequisite:
- Product Owner acceptance.
- Explicit authorization to merge.

Actions:
1. Verify final test status.
2. Review Git diff and working tree.
3. Confirm no unrelated changes are included.
4. Create or update the pull request if applicable.
5. Merge only when authorized.
6. Update backlog status.
7. Update handoff documentation.
8. Record final commit or PR reference.

Deliverables:
- Updated `backlog.md`
- Final `handoff.md`

Exit Criteria:
- Story status is Completed.
- Changes are merged if authorized.
- Documentation reflects final state.

Deployment requires separate approval.

---

## 5. Session Management

### Starting a New Story

Prefer a new Copilot Chat session for each story.

The Tech Lead must:
1. Read relevant project documentation.
2. Read story requirements.
3. Read the story handoff if one exists.
4. Verify current Git state.
5. Identify the current development phase.
6. Propose the next action.

Do not assume previous conversation history.

### Continuing a Story

Stay in the same session while the conversation
remains focused and relevant.

If context becomes large or confusing,
prepare a handoff and start a new session.

### Ending a Session

Update `handoff.md` with:

- Story ID and title
- Current lifecycle phase
- Current status
- Completed work
- Files changed
- Agent tasks actually executed
- Tests executed and results
- Decisions made
- Known blockers
- Pending tasks
- Current Git branch and working tree status
- Exact recommended next action

A new session must be able to resume using
the handoff without previous chat history.

---

## 6. Agent Delegation Rules

The Tech Lead is the primary orchestrator.

Delegation principles:
1. Delegate only when specialized work is needed.
2. Give agents clear scope and acceptance criteria.
3. Provide relevant file references.
4. Avoid unnecessary context loading.
5. Avoid concurrent edits to shared files.
6. Review deliverables before proceeding.
7. Request corrections when necessary.
8. Record significant outcomes.

Do not invoke every agent for every story.

Examples:
- Backend-only change: Backend + QA + Reviewer.
- UI-only change: UX + Frontend + QA + Reviewer.
- Full-stack feature: UX + Frontend + Backend
  + QA + Reviewer.
- Documentation-only change: Tech Lead,
  with review when appropriate.

If delegation tools are unavailable,
the Tech Lead must report the limitation.

Never claim an agent was invoked unless
it actually executed.

---

## 7. Approval Gates

Product Owner approval is required for:

- Initial implementation plan.
- Significant UX design decisions.
- Material scope changes.
- Major architectural changes.
- New significant dependencies or services.
- Security-sensitive or destructive operations.
- Story acceptance.
- Merging changes.
- Deployment.

Routine implementation decisions may be made
by the Tech Lead within approved boundaries.

If approval is required, pause and ask.

---

## 8. Definition of Done

A story is Done when:

- Acceptance criteria are satisfied.
- Required implementation is complete.
- Relevant automated tests have passed.
- Critical and high-priority review findings
  are resolved or explicitly accepted.
- Applicable UX requirements are met.
- Documentation is updated.
- Known limitations are recorded.
- Product Owner acceptance is recorded.
- Merge is completed when authorized.

A story must not be marked Done simply
because code has been written.

---

## 9. Communication Standards

The Tech Lead should report progress concisely.

During planning, provide:
- Scope
- Approach
- Agent assignments
- Risks
- Approval needed

At approval gates, provide:
- Decision required
- Recommended option
- Alternatives
- Consequences

At completion, provide:
- Delivered functionality
- Test results
- Review results
- Remaining risks
- Next action

Avoid repetitive status updates.

Escalate blockers promptly.

---

## 10. Standard Commands

### Start a Story

"Start story US-XXX using the standard
development workflow. Review the requirements,
inspect the repository, and propose a plan."

### Approve UX and Implementation

"I approve the proposed UX design and
implementation plan. Continue with development
according to the standard workflow."

### Resume a Story

"Resume US-XXX from its handoff.md.
Verify repository state and continue from
the next documented phase."

### Prepare a Handoff

"Prepare a handoff for US-XXX.
Update handoff.md with current progress,
test results, decisions, blockers, and
the exact next action."

### Request Acceptance

"Prepare US-XXX for Product Owner acceptance.
Show acceptance criteria, test evidence,
known limitations, and verification steps."

### Close a Story

"I accept US-XXX and authorize the merge.
Complete the approved merge workflow,
update the backlog, and close the story.
Do not deploy."


## Story Completion and Backlog Management

A completed story must remain traceable.

### Definition of Done

A story is Done when:
- Acceptance criteria are satisfied.
- Required tests and reviews are complete.
- Critical and high-severity findings are resolved
  or explicitly accepted by the Product Owner.
- The Product Owner has accepted the story.
- Changes are merged into the target branch.
- Documentation is updated.

### Closure Procedure

After Product Owner acceptance and merge approval:

1. Verify the final Git state.
2. Merge using the approved workflow.
3. Update docs/product/backlog.md.
4. Move the story from Active to Completed.
5. Record completion date and actual PR/commit.
6. Finalize the story's handoff.md.
7. Preserve requirements and review documents.
8. Identify follow-up stories if necessary.

### Backlog Organization

Keep two sections:
- Active Stories
- Completed Stories

Never delete completed stories solely because
they are finished.

Do not mark a story Done before the required
acceptance and merge steps succeed.

Deployment is tracked separately from Done.
