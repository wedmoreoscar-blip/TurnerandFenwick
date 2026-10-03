# Skill catalog

Skills shared by every kit repository (the `core` pack). Packs installed later add their own;
`.agent-kit.lock` lists the installed packs. Project-only skills are not listed here.

| Skill | Use it to | Needs in the repo |
| --- | --- | --- |
| `audit-context` | Read everything and reconcile docs, records and code, read-only | `docs/workflows/context_audit.md` |
| `bench` | Run an existing benchmark with smoke test, grading and findings | `docs/workflows/benchmarking.md`, `tools/agent-lock` |
| `decision-check` | Answer a question strictly from `LOCKED` decisions | `docs/decisions.md` |
| `find-skills` | Find an existing skill in the open ecosystem and install it into this project | `npx skills` |
| `handoff` | Close a session: decisions, git triage, kickoff bundle | `docs/workflows/session_lifecycle.md`, `tasks/` |
| `healthcheck` | One check of this session's background jobs | nothing |
| `kickoff` | Resume the recorded continuation | `tasks/next_session_kickoff.md` |
| `make-bench` | Design and scaffold a new benchmark | `docs/workflows/benchmarking.md` |
| `skill-writing` | Create or revise a portable skill | `docs/workflows/skill_authoring.md` |
| `speccheck` | Accept a delegated diff against its spec | `docs/workflows/delegation.md`, `tools/test-project` |
| `teacher` | Teach a component interactively | nothing |
| `update-decisions` | Record a settled decision in the ledger | `docs/decisions.md` |
| `writespec` | Write a delegation spec | `tools/spec-block`, `docs/project_profile.md` |

## Invocation

| Client | Syntax |
| --- | --- |
| Codex | `$skill-name`, or `/skills` |
| Claude Code | `/skill-name` |
| opencode | by name through its skill tool |

## Rules

- No personal or global skills. Never install a skill into `~/.agents/skills`, `~/.claude/skills` or
  another home folder.
- Every copy of a skill (`.agents/skills`, `.claude/skills`, any extra tool target) is byte-identical;
  `tools/check-agent-setup` fails on drift.
- A project-only skill must not reuse a kit skill's name.
