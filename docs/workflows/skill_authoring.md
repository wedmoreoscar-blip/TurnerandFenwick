# Portable Skill Authoring

Create skills against the open Agent Skills structure so the same core package can be used by Codex
and Claude Code (opencode reads both folders).

## Required structure

```text
skill-name/
  SKILL.md
  agents/openai.yaml     # optional Codex/ChatGPT interface metadata
  references/            # optional detailed material
  scripts/               # optional deterministic helpers
  assets/                # optional output resources
```

`SKILL.md` must use lowercase kebab-case for the folder and `name`, and begin with only the portable
required frontmatter unless a client-specific extension is truly needed:

```yaml
---
name: skill-name
description: State what the workflow does and the concrete requests that should trigger it.
---
```

## Process

1. Define two or three realistic trigger requests, expected inputs, output, safety boundary, and
   requests that must not trigger the skill.
2. Keep one recognizable job per skill. Put detailed policy or examples in one-level-deep references.
3. Prefer imperative, concise instructions. Add a script only when deterministic repetition warrants
   it, and execute-test every added script.
4. For Codex, initialize new packages with its installed `skill-creator` helper when available and
   validate with `quick_validate.py`. Generate `agents/openai.yaml` from the finished skill.
5. Mirror the whole skill folder byte-identically in `.agents/skills/<name>/` and
   `.claude/skills/<name>/`, plus every extra tool target recorded in `.agent-kit.lock`. Do not use
   symlinks because the repository must clone cleanly on Windows.
6. Test obvious triggers, paraphrases, non-triggers, incomplete inputs, and at least one edge case in a
   fresh session. Restart a client only if its live watcher does not discover a newly created folder.
7. Run `tools/check-agent-setup` to validate structure and cross-client parity.

## Where skills live

There are no personal or global skills. A skill is either **project-only** (it lives in this
repository and nowhere else) or **kit-owned** (its source is the agent kit, and `kit sync` copies it
into each repository). Never write a skill into `~/.agents/skills`, `~/.claude/skills` or any other
home directory: a second copy there drifts, and Claude Code prefers a personal copy over the
project's.

- Improving a kit-owned skill: edit it here, then `kit push <path>` sends it to the kit.
- Promoting a project skill to the kit: `kit push --new .agents/skills/<name> --pack core`.
- A project-only skill must not reuse a kit skill's name.

Only the user runs `kit`. An agent may suggest a push but never performs one unasked.

Keep user installation guidance outside skill folders. Setup procedure belongs in
`docs/agent_setup/`, not in each skill package.
