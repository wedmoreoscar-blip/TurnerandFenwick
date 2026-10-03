# Bootstrap prompt for a fresh clone

Give this to Codex, Claude Code or opencode from the repository root:

```text
Read AGENTS.md, docs/project_profile.md and docs/agent_setup/CROSS_MACHINE_SETUP.md completely.
Keep this bootstrap scoped to local agent setup: do not change application code, install
dependencies, deploy anything, or copy secrets. Run tools/check-agent-setup and report its result.
Confirm which instruction files and skills you loaded. Do not create or copy any skill into a home
directory. Report anything that still needs a client restart, a repository trust decision, or a
gitignored file from the project owner.
```
