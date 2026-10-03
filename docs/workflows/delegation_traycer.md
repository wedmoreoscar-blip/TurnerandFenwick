# Delegation through Traycer

**Applies only when Traycer is present**: the `traycer` CLI is on `PATH`, or this agent was launched
by Traycer. Otherwise ignore this file and delegate with native subagents as
`docs/workflows/delegation.md` describes.

When it applies, this file replaces steps 1, 4, 5 and 8 of `delegation.md` and adds Traycer's
details to `agent_selection.md`. Everything else in those files still holds. The agent kit also
installs `agent_selection.md` followed by this file as `~/.traycer/agent-selection-guide.md`, which
Traycer serves to its agents (`traycer agent selection-guide`); edit the repository copies, never
that file.

## Where the orchestrator writes

**The orchestrator always writes to the integration target, the main checkout on `main`, even when
Traycer has launched it inside a worktree.** Being placed in a worktree does not make that worktree
your working tree. Commit orchestration output (decisions, docs, kickoff, specs, integration merges)
to the main checkout; leave your own worktree untouched and expect it to fall behind `main`. An
orchestrator that commits into its own worktree invents a merge step before it can dispatch
anything, and risks handing a stale tree to the next session.

Traycer artifacts are a review surface, not storage: they are epic-scoped and do not survive into
another epic. Use them when a spec should be read and commented on before dispatch, but write every
spec to `tasks/specs/` and commit it.

## Step 1 — reuse a warm agent

List the epic's agents and worktrees (`traycer agent list`). Inspect, read-only, any warm implementer:
harness, model, worktree branch, Git status, distance from `main`. A warm agent on the *other*
implementer model is not automatically compatible: reconfiguring across harnesses is a real change,
so say so in the reuse block and let the user decide. Ask with the one-block question in
`agent_selection.md` before reusing.

Every implementer runs in its own worktree from `traycer worktree create`, never the workspace
folder. `gui` agents release their worktree when idle; `tui` agents pin it until their process exits.

## Step 4 — configure explicitly

Default implementer:

```
traycer agent create --harness codex --model gpt-5.6-luna \
  --reasoning-effort max --surface gui --cwd <worktree> --permission-mode full_access
```

Only on the user's explicit instruction to switch:

```
traycer agent create --harness opencode --model deepseek:deepseek-v4-flash-vision-exp \
  --reasoning-effort max --surface gui --cwd <worktree> --permission-mode full_access
```

- **`--reasoning-effort max` is required, not redundant.** Without it the agent runs at low effort
  on identical config; `opencode.json`'s `agent.build.variant` and the repository's
  `.codex/config.toml` model do not reach a Traycer-launched agent on their own. Pass `--model`
  explicitly every time.
- Effort values differ by harness (`low|high|max` for the DeepSeek model, `low|medium|high|xhigh|max`
  for Luna). `max` is valid on both.
- opencode's own model syntax uses a slash (`deepseek/deepseek-v4-flash-vision-exp`); Traycer's
  `--model` uses a colon (`deepseek:deepseek-v4-flash-vision-exp`). Both are correct in their place.
  DeepSeek is opencode's built-in provider, authenticated with `opencode providers login`.

### Surface

Always `--surface gui` for implementers. Agent-to-agent messaging on `--surface tui` is
Claude-Code-only; `codex` and `opencode` fail `agent.create` with `TARGET_TUI_UNSUPPORTED`.
Traycer's docs list all three as terminal-capable, which covers harnesses backing a human-driven
terminal session, not agent-to-agent messaging.

### Permission and effort layers

Three separate layers, frequently confused. They stack; they do not override one another.

| Layer | Set where | Applies to |
| --- | --- | --- |
| Traycer `--permission-mode` | `traycer agent create` | Whether Traycer prompts the **user** to approve the child's actions: `full_access`, `supervised`, `auto_accept_edits`. There is no `auto`. |
| Harness autonomy | `opencode.json` `permission`; `~/.codex/config.toml` | The child itself, on every surface. |
| Traycer terminal CLI arguments | Traycer Settings ▸ provider | Terminal-interface launches only; never reaches a `gui` agent. |

Use `--permission-mode full_access` for implementers. Containment rests on worktree isolation and
the deny rules, which apply in every mode.

## Step 5 — verify what actually ran

`traycer agent create` can return `WebSocket frame timed out after 15000ms` and **still create the
agent, with none of the requested flags applied.** It appears in `agent list` and runs normally, on
the wrong provider, model and effort. So, every time:

1. Confirm `create` returned an agent id cleanly. If it timed out, delete the agent and retry; do
   not dispatch to it.
2. After the first turn, verify the real model. For opencode: `opencode session list` →
   `opencode export <sessionID>`, and check `providerID`, `modelID`, `variant`. For codex: check the
   session rollout's model field reads `gpt-5.6-luna`, not a model the repository config supplies.

## Step 8 — send with `--expect-reply`

```
traycer agent send --to <agent> --expect-reply --message "$(cat tasks/specs/<spec>.md)"
```

Without `--expect-reply` the peer never reports back. `tools/writespec-guard` checks every
`traycer agent send` that carries a `--message`: replies (`--response-id`) pass, and so do messages
marked `[no-spec]` (pings, acknowledgements, stand-downs) or `[visual-check]`.

When the orchestrator is a Codex TUI, the `relay` pack's `$codex-tui-relay` replaces this step:
Codex appends the commission to the relay ledger and the hub sends it.

## Keeping agents warm

Traycer agents persist, so after integration keep both the worktree and the agent. A clean worktree
level with `main` plus an agent with cached context skips the whole create/install/configure/verify
cycle next time. Re-engaging a warm agent is still new delegated work and needs the user's
confirmation.

## Visual check agents

Visual-check agents coordinate by Traycer A2A messages in one shared worktree. Name them
`<repo>_visual_<n>`; Traycer offers no rename, so use the names that exist.
