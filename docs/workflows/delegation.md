# Delegation

The canonical end-to-end path for one delegated implementation, from provisioning an agent to
integrating its work. `agent_selection.md` decides *which* agent runs a role; this file defines
*how* every delegation runs, whichever agent and harness it is.

The other workflow documents defer to this one on sequencing. `change_safety.md` remains
authoritative on what may be written and committed; `verification.md` remains authoritative on
evidence categories and reporting language; the `writespec` and `speccheck` skills remain
authoritative on spec content and clause-mapping technique. Project commands referred to below
(install, test, typecheck, …) are the ones named in `docs/project_profile.md`.

## Design goals

Four properties, in priority order. Every rule below exists to serve one of them.

1. **Worktrees stay warm.** A provisioned worktree that is clean and level with `main` is a
   standing asset: dependencies installed, and agent context cached where the harness keeps agents
   alive. Never delete one that a next delegation could use, just to prove tidiness.
2. **One full baseline per delegation.** The full verification profile is slow and token-hungry.
   It runs once, as a confirmation gate, after repairs, never as a diagnostic before them.
3. **One repair loop.** Surface every problem in a single review pass, fix them together, verify
   once.
   **Verification belongs to the checker, not the implementer.** The implementer writes the code
   and confirms only that it runs and that the existing suite still passes; it does not write
   tests. The checker derives coverage from the spec on the integration branch. This is not only
   about avoiding duplicated effort: tests written by the agent that wrote the code encode the
   same blind spots, so a green suite can report success over a clause that was never
   implemented. Independence is what makes the single check loop trustworthy enough to be the
   only one.
4. **Fast-forwards only.** `main` advances by fast-forward from a verified integration branch. It
   never receives untested work that then has to be re-tested in place.

## When to delegate at all

Delegation removes from the orchestrator's window the *iteration churn* (exploration, failed
attempts, re-edits, command output), not the code itself. The spec, the handback diff, the
independent tests, and the repairs all still land in the orchestrator's context. The saving is the
churn, typically several times the size of the finished diff; the cost is a fixed per-delegation
floor (provision, spec, commission round-trip, clause map, tests, repairs, baseline) that does not
shrink with the task. Below a certain task size the floor exceeds the churn and delegation loses
to inline work on every axis at once: tokens, latency, and quality.

So the gate is a size-and-kind rule, decided when the work is scoped rather than felt out at
dispatch time:

- **Delegate** work whose expected diff is roughly 150 production lines or more of mechanical,
  fully specifiable change, or any wave that splits into two or more disjoint specs, where
  batched fan-in amortizes the floor across the legs.
- **Keep inline** anything smaller; anything requiring design judgment mid-implementation (a spec
  that must settle the design *is* the solution, serialized as prose, so nothing was saved by not
  writing the code); dense single-file logic; and work whose independent test suite would rival
  the implementation in size, since there the checker performs the expensive half regardless.

The line-count figure is a working estimate, not a measured one. The spend ledger at
`docs/delegation_spend.md`, whose rows `tools/spend-guard` enforces at every integration, is what
will eventually correct it.

## Harnesses

The path below is the same whatever spawns the implementer. Only four steps depend on the harness:
how the agent and its worktree are created (1, 4), how the model is confirmed (5), and how the
commission is sent and answered (8).

- **Native subagents (the default, needs nothing installed).** The orchestrating client spawns its
  own subagent with the spec as the prompt. In Claude Code, launch it with worktree isolation so it
  works in its own git worktree. For a client whose subagents do not create a worktree, create and
  provision one first with `git worktree add` and `tools/prepare-worktree`, put its path in the
  spec, and tell the subagent to work only there. A native subagent's final message is its
  handback. Native subagents usually end with their task, so only the worktree, not the agent,
  can be kept warm, and they generally run on the orchestrating vendor's models.
- **An orchestration tool, when installed.** If the repository has an orchestration pack installed
  (for example `docs/workflows/delegation_traycer.md` from the agent kit's `traycer` pack) **and**
  that tool is actually available on this machine, its file replaces steps 1, 4, 5 and 8 with the
  tool's own commands. Everything else here still applies. Where the tool is absent, use native
  subagents.

## The path

### Provision

1. **Reuse a warm worktree, or a warm agent where the harness keeps one.** Check for a delegated
   worktree that is clean and suits the task. Reuse is the default route; creating a worktree is
   the exception. Ask the user before reusing (see `agent_selection.md`): reuse is recommended, not
   pre-authorized.
2. **Bring the worktree level with `main`.** Merge only. Never reset, rebase, or stash to get
   there. If the worktree is dirty or cannot be synchronized without risking unintegrated work,
   stop and ask rather than forcing it.
3. **Provision it with `tools/prepare-worktree <worktree> [--since <pre-merge-sha>]`.** The tool
   does three things, each for a reason worth knowing:

   - **Copies the gitignored files the project needs** (`[worktree].copy_files` in the profile,
     typically `.env`). A worktree contains tracked files and nothing else. Without its config,
     code that reads it at import time fails to load, and every test whose import graph reaches it
     dies before an assertion runs. The failure accuses the wrong party: a handful of failing test
     files the spec never mentions reads as "the implementer broke them", not "the environment is
     missing a file".
   - **Installs dependencies only if the dependency set actually moved, and picks the command by
     case**, under `tools/agent-lock dependencies`:

     | Case | Command | Why that one |
     | --- | --- | --- |
     | The worktree is newly created | `install_fresh` | Must install exactly what the lockfile says and never write it back |
     | `--since` shows a dependency file changed | `install_incr` | Incremental, seconds against a cold install |
     | Neither | nothing | Reinstalling into a warm worktree is slow and buys nothing |

     The fresh case must not rewrite the lockfile because the worktree shares the repository: a
     provisioning step that mutates the lockfile hands the implementer a tree already dirty in a
     file its spec forbids it to touch, and that change rides into the handback diff looking like
     the implementer's doing. The incremental case exists because a merge that moved the
     dependency set leaves installed packages describing a tree that no longer exists, and the
     first verification command can then fail on a tool that is simply missing.
   - **Runs the test command and prints the count** the implementer inherits. That run is cheap and
     confirms the worktree is genuinely usable before an agent is pointed at it. Never skip it.

4. **Configure the agent explicitly** where the harness allows it: model and reasoning effort.
   Do not assume a repository config file reaches a spawned agent.
5. **Verify what actually ran.** Where the harness can report the real model of a spawned agent,
   check it after the first turn. Never accept the spawn command or the agent's own self-report as
   evidence of which model is running.

Steps 4 and 5 are first-time or repurposing costs. A warm agent already configured for the same
role skips to step 6.

### Commission

6. **Write the spec with `writespec`.** Roughly five clauses, an explicit allowlist of modifiable
   files, and the three fixed blocks appended with `tools/spec-block`. `tools/writespec-guard`
   denies a non-compliant dispatch in Claude Code, so this is enforced rather than advisory there;
   in other clients it is a rule in `AGENTS.md`.
7. **State the verification baseline in concrete numbers.** Write the spec as though the
   implementer cannot ask. Run the commands and give the literal failure counts, the literal test
   count, and any repository-specific command trap. A cross-reference to another document is not a
   baseline. A runtime question route does not weaken this requirement.

   **Check the numbers survive the change you are commissioning.** A count is a floor only if the
   work is compatible with it. If the spec adds an instance of something an existing test counts,
   "all N must pass" is unachievable, and an implementer forbidden from editing tests will contort
   the code to keep the suite green instead. Name the test the checker will update, in the spec,
   rather than pinning a number the ticket invalidates.

   **State the numbers, but let the implementer run only `[implementer].run` from the profile.**
   It needs the literal counts to know what "no worse" means; it does not need to produce them all
   itself. The commands under `[implementer].skip` belong to the checker: they are the expensive
   ones, and an implementer re-deriving a known-failing count learns nothing.

   The reason is contention. Several implementers each running every expensive command can slow
   the machine several-fold. **A starved agent is indistinguishable from a stalled one**, and that
   ambiguity produces wrong "the agents are looping" diagnoses, needless steers to working agents,
   and long waits on results that will be discarded and re-run on the integration branch anyway.

   Cutting the expensive commands is the fix. **Do not respond by shrinking the wave**: fan out as
   wide as the specs allow.

   `tools/agent-lock` does **not** help here: it holds `flock -n`, so a second caller fails
   immediately with exit 75 rather than queuing. It is a mutual-exclusion guard for things that
   must never overlap (installs, the dev server), not a scheduler. Wrapping verification in it
   would turn contention into spurious failures.

   **The orchestrator observes the same rule in reverse: never run a baseline in the main checkout
   while agents are still working.** It competes with them directly. Hold it until the handbacks
   are in and run it once on the integration branch, which is what step 13 wants regardless.
8. **Dispatch so the result comes back.** A native subagent returns its report when it finishes.
   With a messaging harness, send in the mode that requires a reply; without it the peer never
   reports back.

### Review

9. **Commit the handback, then merge the branch into an `integration` branch, not `main`.** The
   implementer is told not to commit, so the work normally arrives uncommitted in its worktree.
   Committing it on its own branch is integration work and belongs to the orchestrator; say in the
   message that it is unreviewed at that point. Reviewing the merged tree rather than the worktree
   means every repair is made against the code that will actually ship, so no fix can be
   invalidated by a later merge. Using a scratch branch rather than `main` keeps the discard path
   cheap if the diff turns out to be unacceptable.

   **Merge each handback as it arrives, and give each one its own merge commit, never squashed.**
   Waiting for the whole wave before opening `integration` leaves the orchestrator idle while
   agents work, and delays the one finding worth having early. Merging one at a time also
   attributes a textual conflict for free: it belongs to the branch you just merged. Treat such a
   conflict as a spec violation to investigate, not a merge to resolve. The separate merge commits
   keep any single leg revertible, which preserves the cheap discard path once other legs are
   stacked on top.
10. **Map clauses first, and decide redelegation here.** Enumerate every spec clause, map each to
    the hunk that satisfies it, and map every hunk back to a clause. Do this before writing a
    single test.

    This ordering matters: **a missing clause is the one finding that tests cannot surface.** A
    suite written against a clause nobody implemented does not report a gap, it reports a failure,
    and you would go looking for a bug that is really an absence. Finding it here instead is
    cheap, and it is the point at which the redelegate-or-repair call is made, before any further
    effort is spent either way.

    **A missing clause does not by itself mean redelegation.** The test is the size and kind of
    the remaining work: repair it inline when it is implementable from the spec you already wrote,
    hand it back only when completing it would mean designing rather than repairing. See the
    exception list in `speccheck`.

11. **Then write independent tests and run them.** Derive coverage from the clause list, never
    from the implementation. Treat any tests the implementer supplied as part of the diff under
    review, not as evidence: read their bodies, because a test named for a clause can contain
    nothing that exercises it.

    **Run only the tests you just wrote for the leg you just merged, and nothing else.** The
    pre-existing suite and the rest of the profile are deferred to step 13. The line is not
    arbitrary: **run the checks whose answers survive the remaining merges, defer the ones whose
    answers do not.** A fresh clause test answers something only this leg can answer and stays
    valid however the wave lands; the full suite answers a question about the whole tree, and at
    leg three of five that answer is provisional and will be re-derived at leg five anyway.

    The pull to re-run everything is strongest right after a merge. It is the trap: five legs means
    five full runs, and the one-baseline rule dies by a thousand individually reasonable cuts.

    **Type checking defers too, and that is deliberate.** A targeted test run can pass straight
    over a type error. Accept that: early detection only earns its cost when it enables early
    action, and repairs already wait for the whole wave. The one call worth making early is
    redelegate-or-repair, and that comes off the clause map.

12. **Repair inline, then re-run the tests.** The checker owns the repair loop. Fix everything
    localized in one pass and confirm the suite is green afterwards. Hand work back only under a
    named `speccheck` exception, and by this point that should only be the whole-missing-clause
    case already caught at step 10.

    **Repairs wait until every handback is merged and mapped.** A repair is only certainly right
    against the tree that ships, and anything at a seam between two legs is not knowable until both
    are in. A half-repaired partial merge also makes the fix-forward rule below unusable.

    **Then read the whole diff across legs, once, before repairing.** Reading the diffs together is
    what surfaces several agents misreading the same convention, a signal about the spec template,
    not about the agents. `ORCHESTRATION.md` advice 6 is the standing instruction to act on the
    trend rather than the individual repair.

### Integrate

13. **Run the full baseline once, after the repairs:** `tools/test-project full` and
    `git diff --check`. Derive any known-failing ceiling by running it, not by quoting a document,
    and read the failures rather than only counting them.

    **A green test suite does not make this redundant.** Many test runners strip types without
    checking them, so a suite passes over a type error that the type checker reports.

    Skip it only when the merge at step 9 was a fast-forward *and* step 12 changed nothing: the
    tree is then byte-identical to something already verified. **A pipelined wave never
    qualifies**: per-leg merge commits are not fast-forwards, and the checks deferred in step 11
    have not run against the merged tree at all.
14. **Fast-forward `main` from `integration`,** then delete the scratch branch. Commit locally.
    Never push. Keep unrelated work off `integration`: it may be discarded wholesale, and unrelated
    commits pollute the diff under review.

    **The fast-forward is gated on the spend ledger.** Before the merge, append one row per
    delegated leg to `docs/delegation_spend.md`: date, label, the orchestrator-context tokens the
    leg cost, and a short note on where they went. `tools/spend-guard` denies the merge of an
    `integration*` branch until the rows exist; `[no-ledger]` in the merge command bypasses it
    only when the merge genuinely integrates no delegation.
15. **Re-merge `main` into every kept worktree that is idle and clean,** including the one that
    just delivered. Skipping this is what makes the second and third integrations of a batch
    conflict.

    **Never merge into a worktree whose agent is mid-task.** Git fails safe when the incoming
    commits touch a file the agent has modified, but when they touch *other* files the merge
    succeeds and the agent's working tree shifts underneath it. Its file reads go stale, its edits
    land on moved line numbers, and the resulting failures are hard to attribute.

    For a busy worktree, defer the sync instead of forcing it. Step 2 of its next delegation
    brings it current before anything is dispatched, so nothing is lost by waiting.
16. **Leave reusable worktrees (and agents, where the harness keeps them) warm.** Remove only a
    worktree no next delegation can use, with `git worktree remove`. The next delegation re-enters
    at step 1.

## Partitioning a wave

- **Partition by file ownership, not by feature letter or dependency order.** Handing two legs the
  same file breaks disjointness even when their features look separate.
- **Pay the shared contract inline, before dispatch.** Legs cannot compile against a module that
  does not exist. Build the shared spine (types, a shared resolver, a hook) inline first; the legs
  then only *call* it. Legs calling a module is a shared dependency; legs editing it is a shared
  file, and only the second breaks disjointness. This is also what the inline threshold wants:
  dense shared logic is exactly what should not be delegated.
- **Assign every seam at partition time.** When one change spans two legs' files, list every call
  site crossing the boundary before writing the specs, and give each one to exactly one leg, the
  one that owns the consumer. If that breaks disjointness, take the seam inline and say so in both
  specs. Otherwise both legs can satisfy every clause and the merged tree still fails.
- **An implementer reporting a seam instead of editing across it is correct behaviour.** The scope
  rule stays as written.

## Running several delegations at once

Fan out in parallel. **How you fan in depends on whether the specs are disjoint**, and that is a
fact about the specs you wrote, not a judgement call at integration time.

### Disjoint specs: batch them

When no two specs name the same file, every returned branch goes onto one `integration` branch, and
the wave costs **one** repair loop and **one** baseline rather than several.

**The review pipelines against the fan-out; only the expensive half batches.** Merge and map each
handback as it arrives rather than waiting for the wave. The per-leg work is independent by
construction, since disjoint specs mean one leg's clause map cannot depend on another's diff. What
batches is repairs, the cross-leg read and the baseline, all at steps 12–13.

The prize is that **redelegation is decided while the agent is still warm**, so any handed-back
work runs in parallel with the legs still coding instead of serialising behind them. Early merging
makes a *wholesale* rejection dearer, since other legs are stacked on top, but only "a
substantially wrong approach" implies the returned diff is discarded at all, and per-leg merge
commits keep even that case revertible.

**If that baseline fails, repair inline again and re-run it. Do not fall back to per-branch
integration.** Going backwards means unpicking a merge whose inline repairs are already applied
and re-applying them one branch at a time, far more expensive than fixing forward, and the failure
is nearly always a small semantic clash between branches rather than one bad branch.

Disjoint files do not rule out a *semantic* clash: branches consuming a shared API can each be
green alone and fail together with no conflict markers. That is precisely what the single
post-merge baseline exists to catch, and it is why the baseline runs on the merged tree rather
than in any worktree.

### Overlapping specs: integrate one at a time

When the specs genuinely share files, merge and check them one branch at a time. Here attribution
does pay for itself, because a conflict or failure is likely to belong to a specific branch rather
than to the combination.

Prefer to avoid this by partitioning the specs properly. A textual conflict between supposedly
disjoint branches at step 9 is a spec violation, not a merge problem; investigate it as one.

### Either way

A branch verified against a `main` that has since advanced has not been verified against the tree
it is about to join. Step 15 is what keeps that from accumulating.
