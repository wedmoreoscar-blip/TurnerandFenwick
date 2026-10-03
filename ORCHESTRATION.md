# The Orchestration System — What It's For, Where It Wins, How to Use It

A candid operating guide to the delegation setup, assessed on the three axes that justify its
existence: **latency** (how fast work completes), **accuracy** (how good the code is), and
**subscription efficiency** (production output per weekly subscription limit). The workflow
contracts themselves live in `docs/workflows/`; this file is the judgment layer on top of them.

## What the system actually is

A frontier orchestrator plans, writes specs, reviews, tests, repairs, and integrates. A cheaper
implementer does the typing (see `docs/workflows/agent_selection.md` for which one). One review
pass, one repair loop, one baseline per delegation batch; `main` advances only by fast-forward.

## The core economics — know what you're actually saving

Delegation does **not** keep code out of the orchestrator's window. The spec, the handback diff,
the independent tests, and the repairs all land in its context anyway. What it removes is the
**iteration churn** (exploration, failed attempts, re-edits, command output), which is typically
3–10× the size of the finished diff, and which is the real consumer of context window and output
tokens in hands-on coding. Every design choice below either buys more churn arbitrage or reduces
the fixed overhead floor each delegation pays (provision, spec, round-trip, clause map, tests,
repairs, baseline).

## Where it's strong

- **Batched fan-in.** Several disjoint legs → one speccheck pass → one repair loop → one baseline.
  In practice most clauses land satisfied, a few are repaired inline, and almost nothing is handed
  back. This amortization is the system's single best feature on all three axes.
- **Off-subscription bulk output.** Every line the implementer types is a line the orchestrator's
  subscription doesn't pay output-token weight for. It keeps the frontier window for judgment work.
- **Independent verification.** The checker derives tests from the spec's clauses, never from the
  code. This beats a solo frontier agent on accuracy, because self-authored tests encode the
  author's blind spots: a green suite can report success over a clause nobody built. The clause
  map catches the one defect class tests cannot: the missing clause.
- **Warm assets.** Worktrees stay provisioned, and agents stay cached where the harness allows;
  reuse skips the create/install/configure/verify cycle.

## Where it's weak, and what was done about it

| Weakness | Consequence | Mitigation in place |
| --- | --- | --- |
| Fixed overhead floor per delegation | Small tasks cost more delegated than done inline, on every axis at once | Explicit threshold in `delegation.md` ("When to delegate at all"): ~150+ mechanical production lines or a multi-leg wave delegates; smaller, design-heavy, or test-heavy work stays inline |
| The threshold is a guess | No data measures delegated vs. inline cost | `docs/delegation_spend.md` ledger, one row per leg, enforced by `tools/spend-guard` at every integration; the rows will correct the number |
| Machine contention | Parallel verification starves agents several-fold; a starved agent looks stalled, producing wrong diagnoses | Implementers run only the profile's `[implementer].run` commands; the expensive ones are checker-only and hook-enforced; the orchestrator never runs baselines while agents work |
| Clause map catches omissions, not mediocrity | Implementer code can satisfy every clause and still be fragile in the details | Inline repairs by the checker, named in the acceptance record so under-specification becomes visible as a trend; dense logic routed inline by the threshold |
| Spec must pre-answer everything | For design-heavy work the spec *is* the solution serialized as prose; nothing was saved | Same threshold: design judgment stays with the orchestrator |
| Orchestrator's visual pass bills images at frontier weight | §9 of `visual_check.md` is the priciest step for the orchestrator | Capped: numeric read-backs first, exactly one image per screen, no re-shoot loop |
| Every handoff re-pays a large cold start | The standing prefix (instructions + workflows) is big; frontier cold starts are expensive | Hand off late, reuse warm implementer context, and pack sessions (below) |

## Actionable advice

Each item states the rule and the reason. The reasons are the part to internalize: they tell you
when the rule stops applying.

1. **Pack waves into as few orchestrator sessions as possible.** Inside a warm session the standing
   prefix and project context are already paid for and cached, so each additional wave rides nearly
   free on input. The same wave in a fresh session re-pays the full cold start. Don't end a session
   with a planned wave un-dispatched if context still allows it.
2. **Prefer one wide wave over two narrow ones.** Fan-out cost is per-wave (one review pass, one
   baseline), not per-leg. Partition the specs to be disjoint and go as wide as the specs allow;
   never shrink a wave to reduce machine load, cut the expensive per-implementer commands instead.
3. **Respect the inline threshold in both directions.** Under ~150 mechanical lines, or anything
   design-heavy, delegating loses on tokens, latency, *and* quality. Above it, especially for
   boilerplate-heavy UI or migrations, the churn arbitrage is large. Make the call at scoping time.
4. **Spend spec effort where churn is high, not where the code is hard.** Hard code has a low
   churn-to-diff ratio and belongs inline. If a spec takes as long to write as the code would, the
   task was mis-routed.
5. **Fill the spend ledger honestly, including the "where they went" note.** It is the only
   instrument that will tell you whether the system beats a solo frontier agent for a given task
   size. Guard it from becoming a formality.
6. **Watch the inline-repair trend, not individual repairs.** Three consecutive tickets with a
   clause completed inline means specs are under-specifying or the implementer is underperforming.
7. **The orchestrator looks at images exactly once.** It is multimodal, but at frontier weight, so
   every screenshot it ingests outside the single capped §9 pass duplicates work an implementer
   does for a fraction of the cost.
8. **Build a spine when legs would otherwise overlap.** When a wave cannot be made disjoint because
   of shared files, build the shared contract inline first so that several agents can then work in
   parallel against it (see "Partitioning a wave" in `delegation.md`). Do it when the parallelism it
   unlocks is worth more than the inline work.
9. **Reuse warm worktrees and agents by default; treat creation as the exception.** (Reuse still
   needs the user's confirmation; make it a one-block question.)
10. **Never verify while agents verify.** The orchestrator's baseline waits until handbacks are in
    and runs once on the integration branch.
11. **Fix forward on a failed batch baseline.** Falling back to per-branch integration unpicks
    repairs already applied to re-derive attribution that is almost never the problem.

## What would falsify this design

If the spend ledger accumulates rows showing delegated legs of ordinary size costing as much
orchestrator context as inline authorship, the system is paying its overhead floor without
collecting churn arbitrage, and the threshold should rise, or the whole path should narrow to wide
mechanical waves only. That is a data question, not an argument; the ledger settles it.
