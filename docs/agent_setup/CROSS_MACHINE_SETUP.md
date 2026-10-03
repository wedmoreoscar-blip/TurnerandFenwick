# Setting up a clone

A clone of this repository carries its whole agent setup: instructions, skills, workflow docs,
tools, guards and permission rules. Nothing needs installing beyond the AI clients you use, and no
orchestration tool is required. Most of it was installed by the **agent kit** (see "Where this setup
comes from" below), but a collaborator never needs the kit.

## What each client reads

| | Codex | Claude Code | opencode |
| --- | --- | --- | --- |
| Instructions | `AGENTS.md` | `CLAUDE.md`, which imports `AGENTS.md` | `AGENTS.md` |
| Skills | `.agents/skills/` | `.claude/skills/` | both, via `opencode.json` |
| Settings | `.codex/config.toml` | `.claude/settings.json` | `opencode.json` |
| Command rules | `.codex/rules/*.rules` | `permissions` in `.claude/settings.json` | `permission` in `opencode.json` |
| MCP servers | `[mcp_servers]` in `.codex/config.toml` | `.mcp.json` | `mcp` in `opencode.json` |

Project facts for every client are in `docs/project_profile.md`.

## Steps

1. Install and sign in to the client(s) you use.
2. Clone the repository and start the client from its root.
3. **Trust the repository when the client asks.** Codex ignores the project `.codex/` folder,
   including its command rules, in an untrusted repository; Claude Code applies project permission
   rules only after workspace trust.
4. Run `tools/check-agent-setup`. It needs Python 3.11+ and git, and nothing else.
5. Copy any gitignored config the project needs (see `[worktree].copy_files` in the profile, usually
   `.env`) from whoever owns it. Never commit it.
6. Start a fresh session and invoke `/kickoff` (Claude Code) or `$kickoff` (Codex) to pick up the
   recorded continuation.

Windows: the repository has no symlinks, so a plain Windows checkout works. The tools are Python and
bash scripts; run them from WSL or Git Bash.

## Never transfer

- `.env` files, API keys, service secrets, OAuth state, or client authentication.
- `.claude/settings.local.json`, `CLAUDE.local.md`, local memories, chats, or approval caches.
- `.worktrees/`, `node_modules/` or other installed dependencies, build output, or generated
  benchmark results.
- Anything into a home skill folder (`~/.claude/skills`, `~/.agents/skills`): this setup has no
  personal skills, and Claude Code would prefer a personal copy over the project's.

## Where this setup comes from

The shared parts (`docs/workflows/`, most of `tools/`, the skills, the `AGENTS.md` block between
`<!-- kit:begin … -->` markers, and the kit-added permission and hook entries) are copied from the
**agent kit**, a separate repository its owner keeps. `.agent-kit.lock` records which kit version
and which packs are installed. If you edit one of those files here, the owner's next `kit sync` will
report it as a local edit rather than overwrite it, and they can push it into the kit for every
project. Everything else (`docs/project_profile.md`, `docs/decisions.md`, `tasks/`, project skills)
belongs to this repository alone.

For the kit owner on a new machine: clone the kit repository to `~/agent-kit`, then
`ln -s ~/agent-kit/bin/kit ~/.local/bin/kit` (any directory on `PATH` works), and run `kit doctor`
inside each project.
