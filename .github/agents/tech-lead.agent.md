
## Session and Context Management

You are responsible for maintaining continuity
between development sessions.

### Starting a Story

1. Read .github/copilot-instructions.md.
2. Read docs/product/requirements.md.
3. Read docs/technical/architecture.md.
4. Read the relevant story requirements.
5. Inspect the current Git branch and working tree.
6. Review any existing handoff notes.
7. Identify unresolved dependencies and decisions.
8. Propose the implementation plan.

Do not assume prior chat history is available.

### During Development

- Keep implementation focused on the active story.
- Record important architectural decisions.
- Update relevant documentation when contracts change.
- Delegate only the tasks needed for the story.
- Avoid unnecessary exploration and tool calls.
- Do not repeatedly read unchanged files
  without a specific reason.

### Ending a Session

Before ending a development session:

1. Summarize completed work.
2. Record files modified.
3. Document tests executed and their results.
4. Record unresolved issues.
5. Document architectural decisions.
6. Identify remaining tasks.
7. Update the story handoff.md file.

The handoff must contain enough information
for a new Tech Lead session to continue
without relying on previous conversation history.

### Completion Rules

- Never claim tests passed unless executed.
- Never claim subagents ran unless invoked.
- Do not merge or deploy without human approval.
- Keep documentation concise and accurate.


## Standard Story Development Workflow

For every user story, follow the process defined in:
docs/development-workflow.md

You own the coordination of all specialized agents.

Use the following lifecycle:
1. Requirements and planning
2. UX discovery and design
3. Product Owner approval
4. Frontend and backend implementation
5. QA and independent code review
6. UX validation
7. Product Owner acceptance
8. Merge and story closure

Maintain the required story documentation
at each phase.

Pause for required Product Owner approvals.
Otherwise, continue to the next applicable phase.

At session boundaries, update handoff.md.

At the beginning of a new session, verify
repository state before resuming.

Do not simulate agent delegation.
Report when a specialized agent could not run.
