# Change Safety

## Working tree

- Treat existing modified and untracked files as user-owned unless provenance is known.
- Never stage blindly, stash, revert, delete, or absorb unrelated work.
- Inspect the complete diff and Git status before reporting completion or committing.
- Stage explicit reviewed paths only. Never push without an explicit user request.
- Never print or commit `.env` values, API keys, service secrets, generated output, build output, or
  local client state.

## Isolated delegated writes

Delegated implementations run in their own git worktree, never against the main checkout. The main
checkout stays user-owned. How the worktree is created depends on the harness (a client's native
subagent isolation, `tools/prepare-worktree`, or an orchestration tool); `docs/workflows/delegation.md`
covers each. Every delegation is commissioned by a spec written with the `writespec` skill; the spec
names the only files the implementer may modify.

## Review and integration

- Verify every delegated diff with the `speccheck` skill before accepting it: enumerate the spec's
  clauses, map clauses to hunks and hunks to clauses, and write acceptance tests from the spec, not
  the code.
- **The checker owns the repair loop after handback.** Fix localized failures and their regression
  tests inline when the production correction is roughly twenty changed lines or less and stays
  inside the commissioned allowlist. The original model assignment, task category, warm context,
  or implementer availability never justifies another round trip.
- Re-contact an implementer only when completing the work would mean designing rather than
  repairing, the approach is substantially wrong, the repair needs scope or authority the spec did
  not grant, or the checker lacks a required capability. Before sending anything, state which
  exception applies and the concrete evidence. Re-engaging a warm agent remains new delegated work
  and requires the user's confirmation.
- **A missing clause is not by itself grounds to hand work back.** Judge the size and kind of what
  remains: implementable from the existing spec means repair it inline. A round trip costs a
  rebrief, a wait, and a second review, and discards context the checker has already loaded. Name
  every inline repair in the acceptance record, since that note is the only remaining trace of how
  much of a ticket the checker finished.
- Retain focused regression tests when they protect real behavior.
- Integrate only spec-checked work into a clean, non-overlapping target. Stop if the target moved
  incompatibly or user changes overlap.
- **Review the merged tree, not the worktree.** Merge the delegated branch into an `integration`
  branch first, then run `speccheck` and repair there, so every fix is made against the code that
  will actually ship. `main` advances only by fast-forward from a verified `integration`.
- **Run the full verification profile once, after the repairs, not before them.** A cheap
  test-only run during `speccheck` is diagnostic evidence; the full baseline is the confirmation
  gate. Skip it entirely when the merge was a fast-forward and the repair changed nothing, because
  the tree is then identical to the one already tested.
- **Keep a delegated worktree warm after integration when it will be reused.** Do not reinstall
  dependencies into a kept worktree unless the merge actually changed one of
  `[worktree].dependency_files` in `docs/project_profile.md`. Bring it level with `main` by merge
  before its next dispatch.
- **Never merge into a worktree whose agent is mid-task.** Sync idle, clean worktrees eagerly;
  defer a busy one until just before its next dispatch. A merge that lands under a working agent
  shifts its tree and produces failures that are hard to attribute.

`docs/workflows/delegation.md` holds the full sequence these bullets summarize.

## External and destructive operations

Pushes, deployments, remote database migrations, secret changes, production data changes, and
release publishing require explicit user authorization. The project's own list of such commands
is denied to agents in `.claude/settings.json`, `opencode.json` and `.codex/rules/`; see
`docs/project_profile.md`. Use `tools/agent-lock` for shared dependency installs, dev servers,
local service mutations, benchmarks, or other resource-heavy jobs.
