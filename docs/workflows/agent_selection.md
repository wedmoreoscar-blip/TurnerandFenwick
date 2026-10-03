# Agent Selection

Canonical source for which agent runs which role. For *how* a delegation runs end to end
(provisioning, commissioning, review, and integration) see `docs/workflows/delegation.md`, which this
file defers to on ordering. Project-specific overrides belong under `## Model preferences` in
`docs/project_profile.md`, never in this file.

This file names roles and models, not harnesses. If an orchestration tool's pack is installed and
the tool is present (for example `docs/workflows/delegation_traycer.md`), that file adds the exact
spawn commands, surfaces and flags for it.

## Orchestrator

Claude Code on the strongest available Claude model is the default orchestrator. It plans, writes
specs, checks returned diffs, integrates, and commits. Orchestration, spec authorship, and
acceptance are never delegated.

Another client may orchestrate only where an installed pack explicitly authorizes it (for example
the `relay` pack's Codex TUI route).

## Implementers

Selection presupposes that delegating is worth it at all, and that gate lives in
`docs/workflows/delegation.md` ("When to delegate at all"). This file decides *who* runs the work
only once that gate says delegate.

One implementer model runs everything: deterministic implementation, refactors, visual work,
browser-driven acceptance. There is no separate "visual" agent; the implementer models in use all
ingest images, so the only live axis is cost.

1. **GPT-5.6 Luna via Codex is the default** where Codex is available, because it bills against a
   subscription already held: its output is already paid for.
2. **DeepSeek V4 Flash Vision Exp via opencode replaces it wholesale only when the user explicitly
   says to switch**, typically because the Codex subscription is exhausted. Never infer the switch
   from a task looking cheap, a wave being large, or the default stalling; ask if you think it is
   due. Once switched, it is the default for everything until the user switches back. Always the
   Vision Exp variant, never plain `deepseek-v4-flash`: same price, same text performance, plus
   image input.
3. **With only native subagents available** (no orchestration tool, or a collaborator's machine),
   the implementer is the orchestrating client's own subagent. Where the client lets you choose
   the subagent's model, pick the cheapest one that can do the work; spec quality matters more
   than model size for mechanical work.

### Reuse warm worktrees and agents before creating anything

A clean, provisioned worktree, and where the harness keeps agents alive a warm agent with cached
context, is the default implementation route ahead of creating anything new. Before every
implementation dispatch:

1. Identify any warm worktree or agent capable of the task and inspect it read-only: model, branch,
   Git status, and distance from the current integration target.
2. If one exists, tell the user what would be reused and ask whether to reuse it or create an
   isolated one. **Do not send the spec, reconfigure the agent, or alter its worktree until the user
   answers.** Make the question cheap to answer: one block, one question.

   ```
   Reuse for <ticket>?
     agent     <id or "native subagent"> (<model>)
     worktree  <path> — clean/dirty, N behind main
     sync      merge only | merge + install (dependency files moved) | none
     reconfig  none | <what changes>
   Reuse, or isolated agent/worktree?
   ```

   If any line would read "dirty" or "cannot sync safely", say so and stop: that is a different
   question and needs its own answer.
3. Reuse is the recommended default, not pre-authorized action. The user may prefer isolation for
   any reason.
4. After the user confirms, synchronize the worktree safely, configure the model explicitly, and
   commission through `writespec` as usual. If it cannot be synchronized without risking
   unintegrated work, report that and ask again.
5. Create a new worktree or agent only when no compatible warm route exists or the user chooses
   isolation.

Warm reuse changes provisioning order; it does not weaken worktree isolation, model verification,
`writespec`, or `speccheck`.

### The final visual check is not a delegation

The final visual check of a redesign wave has its own workflow in `docs/workflows/visual_check.md`:
a halt for the user, a rough brief, one shared worktree, several coordinating agents, and
self-verification by screenshot. Do not commission it with a spec. It runs on the current default
implementer.

## Confirm the agent before dispatching

Spawn commands can fail open: report success while applying none of the requested model or effort
settings. Never take the spawn command or the agent's own self-report as evidence of which model is
running. Where the harness exposes the real model (a session export, a rollout file, a status
command), check it after the first turn, and re-create the agent if it is wrong.

## Commissioning and acceptance

Commission with a **`writespec`** spec; accept only through **`speccheck`**. In Claude Code,
`tools/writespec-guard` denies a non-compliant dispatch, so commissioning is enforced rather than
advisory. These skills override any bundled delegation skills of a harness where they overlap. The
spec's closing block already tells the implementer how to verify and report.

Keep specs to roughly five clauses. An implementer approaching its context limit means the spec was
oversized: split it rather than resuming the agent.

## Isolation

Every implementer runs in its own git worktree, never the main checkout. Keep a worktree after
integration when a next delegation can use it; the precondition for reuse is *clean and current*,
not merely *exists*.

## Permissions

Run implementers in the harness's most permissive non-interactive mode that the user has approved.
An implementer waiting on an unanswered approval prompt looks identical to one still working, so a
stalled agent never announces itself, which is intolerable when several run in parallel.

Containment does not rest on that mode. Worktree isolation and the deny rules in
`.claude/settings.json`, `opencode.json` and `.codex/rules/` (no `git push`, no reading `.env`, no
project deploy commands) apply in every mode. Never infer a more restrictive mode from the task, the
parent agent's mode, or a general safety preference; only an explicit user instruction may narrow
it.
