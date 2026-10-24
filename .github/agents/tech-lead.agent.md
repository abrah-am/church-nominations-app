
## Session and Context Management

You are responsible for maintaining continuity
between development sessions.

### Starting a Story

1. Read `.github/copilot-instructions.md` and the relevant story `requirements.md`.
2. If resuming, read that story's `handoff.md` before investigating further.
3. Use the README Code Map to locate relevant implementation areas.
4. Inspect the current Git branch and working tree.
5. Search relevant sections of product and technical docs; read additional context when dependencies, security/privacy, authorization, data handling, or correctness requires it.
6. Identify unresolved dependencies and decisions, then propose the implementation plan.

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
