# Claude Code setup

From the repository root Claude Code discovers `CLAUDE.md` (which imports `AGENTS.md`),
`.claude/settings.json` (permissions and the writespec/spend guards), `.claude/skills/<name>/`, and
`.mcp.json`.

```bash
claude
```

Verify:

1. Accept the workspace trust prompt; project permission rules apply only after it.
2. Run `tools/check-agent-setup`.
3. Run `/context` and confirm `CLAUDE.md` and `AGENTS.md` loaded.
4. Type `/` and confirm `/kickoff`, `/writespec` and `/speccheck` are listed.
5. Invoke `/healthcheck` with nothing running; it must not invent or start work.

Personal approvals go in `.claude/settings.local.json`, which is ignored and never copied. Do not
create `~/.claude/skills/<name>` copies of project skills: a personal skill takes precedence over the
project's and would silently replace it.

The guards in `tools/` are Python scripts run by `PreToolUse` hooks. They need `python3` on `PATH`.

Official references: `https://code.claude.com/docs/en/memory`, `https://code.claude.com/docs/en/skills`,
`https://code.claude.com/docs/en/settings`, `https://code.claude.com/docs/en/hooks`.
