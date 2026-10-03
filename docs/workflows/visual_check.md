# Final Visual Check

The terminal phase of a redesign wave: confirming the built UI actually matches the design
references (drawings, mockups), and fixing it where it does not.

This is **not** `docs/workflows/delegation.md` and must not be run as if it were. That path is
built for rigour and speed on deterministic work and is enforced by `tools/writespec-guard`. This
one is free-flowing, conversational, and deliberately lower ceremony. The two differ on purpose; the
reasons are in "Why this is not the delegation path" below.

Everything project-specific (where the references live, which screens are drawn, the viewport, how
to launch the app, the standing design constraints) is under `## Visual check extras` in
`docs/project_profile.md`. Read it before starting. "The implementer" below means the current
default implementer from `agent_selection.md`.

The looking is delegated for economics, not capability. The orchestrator is multimodal (§9's
independent pass depends on exactly that), but the implementer looks at screenshots at a small
fraction of the orchestrator's cost. Route the looking to the implementer, and reserve the
orchestrator's own image ingestion for the single capped pass in §9.

## Shape

```
implementation integrated
        │
        ▼
   HALT ─── notify the user, wait for the go-ahead ─────────┐
        │                                                   │
        ▼                                              (no contact
   Agent 0 recon: drive the app, screenshot, compare,    with agents
   report findings, FIX NOTHING                          until they say go)
        │
        ▼
   Orchestrator + agent 0 agree headcount and the file-ownership split
        │
        ▼
   n fixers in ONE shared worktree, each owning disjoint files,
   coordinating, self-verifying by screenshot
        │
        ▼
   Orchestrator final pass: visual + full baseline + fast-forward
```

## Tooling: a real browser

This phase works because the implementer can drive a real browser, not merely read images.
Playwright (as a library in runner scripts, or through a Playwright MCP server) gives screenshots,
`getComputedStyle` and bounding boxes for numeric criteria, real interaction for behaviour a static
capture cannot show, and an empty console-error list as evidence rather than an impression.

- **Declare it.** Make Playwright a committed dev dependency. An undeclared, ad-hoc install is
  pruned by the next managed install and the capability vanishes silently.
- **Pin it exactly.** Each Playwright release expects a specific browser build. A version range
  silently resolves to a release wanting a browser that is not cached and fails at launch.
- **Upgrading is two steps.** The package manager fetches the library, not the browser; run
  `npx playwright install chromium` afterwards or the first capture fails.
- Import it from scratch runner scripts by **absolute module path** (`<repo>/node_modules/playwright`);
  scripts outside the repository will not resolve it otherwise. Keep runner scripts out of the
  repository, alongside the working captures.
- Implementers must not change dependency files themselves; provisioning is the orchestrator's.

## 0. No reference, no check

**A design reference is a precondition, not a nice-to-have.** A visual check compares the built
screen against an authoritative picture of what it should be. With no reference there is nothing
to compare against, and the exercise degrades into an agent's taste.

So the scope of any visual pass is *only* the screens the profile lists as having a reference.
Tell the recon agent this explicitly and give it the list. Left unstated, it will report dozens of
findings on undesigned screens and the phase will be spent triaging noise.

A screen that needs checking and has no reference is not a visual-check problem. It is a blocked
prerequisite: record it and obtain the reference first.

## 1. Halt and wait

When the implementation work for the wave is integrated, stop. Tell the user the visual-check stage
has been reached. **Do not contact any agent until they say to start.** Reaching this point is not
authorization to begin.

## 2. Brief agent 0 roughly

### Agent naming

Visual agents are indexed from 0. Agent 0 is the primary agent and coordination hub; further agents
are 1, 2, and so on. Where the harness names agents, prefix the name with the repository, because
names repeat across repositories: **an agent's name states the repository it works in, and that
binding is absolute.** Match agents on the full name or id, never on a shared suffix. Use the names
that exist, not the ones a convention implies.

### Blind is a case, not a requirement

Do not write a spec. A real spec would require taking the screenshots and finding the defects
first, which is the entire job being delegated. The brief is deliberately rough.

When one model implements everything, the recon agent will often have built the code under check
and arrive warm. Warm is accepted: it beats standing up a new agent. Know what it costs: an agent
reviewing its own work carries its build-time blind spots into the recon, so the finding list is
thinner than a genuinely blind one, and the orchestrator's own final pass (§9) is what compensates.

The brief itself:

- what changed in this wave, and which screens it touched;
- where the references and the numeric criteria live (from the profile);
- the standing design constraints it must not violate (from the profile);
- an explicit instruction to **report, not repair**.

Agent 0 drives the running app, captures each screen, compares, and comes back with a finding list
and a recommendation for how many agents the fixes warrant.

### Recon parallelises too, above about eight screens

**The disjoint-file constraint that forces the repair shape does not bind recon.** Recon writes no
product code; its only writes are per-screen notes, already disjoint by screen. So above roughly
eight referenced screens, split recon across n agents on disjoint screen sets. Below that, one
agent is simpler and cheaper.

**Agent 0 remains the sole author of the finding list, the headcount and the ownership split.**
That synthesis needs whole-wave context. Splitting the *looking* is safe; splitting the *judgement*
is not.

**The strongest argument is accuracy, not speed.** An agent whose context compacts partway through
a long recon has lost the measured detail behind its earlier findings, so the back half of its list
is derived from a summary of its own observations. n agents over disjoint screen sets each stay
inside their window.

That makes the per-screen notes load-bearing: **notes written as each capture is assessed are the
only part of an agent's observation that survives its own compaction.** After a compaction, treat
the agent's memory as inadmissible and its notes as the record.

Recon is report-only for product code, **not history-free**. It writes exploratory captures to the
gitignored per-screen `work/` directories and appends each measured conclusion to that screen's
tracked notes while it works.

**Measure, do not only look.** Eyeballing a screenshot catches layout breakage and misses "that is
13px, not 14px". Where a criterion states a number, read it back out of the browser with
`getComputedStyle` or a bounding box rather than judging it by eye.

**But recon and repair measure to different depths, and conflating them costs a whole pass.**

| | Recon measures to… | The fixer measures to… |
| --- | --- | --- |
| Question | Is this defect real? | Is this defect gone? |
| Enough | One number that contradicts a stated one | Full characterisation of the fixed state |
| Not required | Where the defect lives, or what the fix is | — |

A recon finding may **not** be "looks off to me": it must carry a number that contradicts the
reference, or it is taste. But it does not have to locate the cause. **Recon is the worst place to
diagnose a cause**: diagnosis needs the files and recon has the browser, so recon findings naming a
source are often wrong. Let recon say *what is wrong on screen*, and let the fixer, who is in the
code, say *why*.

## 3. Size the team from the findings

Discuss the headcount with agent 0 rather than picking one. `n` is justified by the size and spread
of the finding list, not chosen by default. Two agents that finish beat four that mostly
coordinate.

## 4. One shared worktree, agents spawned into it

All visual agents work in a **single shared worktree**, normally the one agent 0 already inhabits.
One tree means one running app, no divergent copies, and no merge of several worktrees at the end.
Spawn the additional agents into that worktree directly.

### File ownership is the only safety net

A shared worktree has no isolation. Two agents editing one file means last write wins and the other
agent's work vanishes silently.

Screens are the convenient way to derive ownership, but **screens are not files**. Two screens
routinely share a component, and design-system primitives are used everywhere. So agent 0's split
must produce two lists:

- **per-agent screen-local files**, which parallelise freely;
- **shared components**, assigned to exactly one named agent, or held back for the orchestrator.

The rule enforced is disjoint *file* ownership. A screen assignment that yields overlapping files is
not a valid split. Notes files are part of the same split: each fixer owns its screens' notes, and
agent 0 alone owns any shared visual-history documents. Two agents must never append to the same
file concurrently.

Agent 0 is the first fixer as well as the coordination hub: it has the recon context, and standing
it down wastes the best-informed agent. Where the harness lets agents message each other, the
fixers coordinate directly; with native subagents, which cannot, coordination goes through the
orchestrator.

### Shoot early and often: a fixer that only edits will compact

Screenshotting is not the write-up at the end of a repair. It is a **feedback loop that keeps the
agent's window small**: shoot, read back, append one line to the notes, and the conclusion is
externalised on disk instead of accumulating in context. An agent that edits for an hour and
verifies at the end carries the whole hour in its window and then loses it.

**Capture after each finding is addressed, not at the end of the cluster.**

## 5. The finding list is the allowlist

There is no spec and no file allowlist, and visual judgment invites improvement nobody asked for.
Fixers fix listed findings. Anything else an agent notices goes back to the orchestrator as a new
finding; it does not go into the tree.

## 6. Self-verification is explicitly exempt

`delegation.md` forbids an implementer verifying its own work, and `writespec-guard` enforces it.
**That rule does not apply here, and the exemption is deliberate.** The ban exists because
implementer-authored *tests* encode the same blind spots as the implementation. A screenshot is an
observation of the running app, not an assertion the agent authored, so it cannot conceal an
omission in the same way.

Commissioning messages for this phase carry the literal marker **`[visual-check]`**, which
`writespec-guard` recognises. Do not reuse `[no-spec]`: that marker asserts the message commissions
no work, which would be false here.

## 7. One dev server, owned by the orchestrator

Start the profile's `dev` command once, from the shared worktree, before dispatching the fixers,
under `tools/agent-lock dev-server -- <dev command>`. Give the agents the URL (as `APP_URL`) and tell
them not to start their own.

- **Give the worktree its config first.** A worktree is a checkout, not a provisioned environment,
  and most dev servers read env files from their own project root. Symlink the main checkout's
  config files in (`[worktree].copy_files`) rather than copying, so there is one source of truth.
- **Confirm the app boots, not that the port answers.** A server can return 200 for a page whose
  scripts then throw. One text-only browser read-back settles it before dispatch: assert console
  errors are empty and the page's body text is non-empty.
- Starting the dev command twice usually does not fail; it picks the next free port, giving several
  redundant servers on unpredictable ports. One server, one port, one lifecycle.
- **Cross-talk is real in a shared tree.** With hot reload, one agent's broken edit shows up in every
  other agent's screenshots. An error overlay on a screen you do not own is not your finding: wait
  and re-shoot.
- **The lock cannot go stale, but the server can die quietly.** `tools/agent-lock` holds a `flock`
  the kernel releases when the process ends, so if the server dies the lock frees silently. Check
  liveness, not the lock, before dispatch and whenever captures behave strangely. Restarting the
  server is the orchestrator's job.

## 8. Checkpoint commits are the only undo

One worktree, several concurrent writers, no merge safety net. The orchestrator commits a checkpoint
after each fixer reports done. Agents do not commit.

## 8a. Where screenshots go

Unless the profile says otherwise, the archive is `docs/visual/screenshots/<screen>/`:

- **Working captures** go in `<screen>/work/`, which is gitignored. Agents write here freely and
  refer to each other's captures by filename.
- **Per-screen `notes.md` is tracked working history.** The agent owning a screen appends one line
  as each capture is assessed: capture path, state exercised, measured conclusion, and
  pass/finding/blocker status.
- **Milestone captures** sit directly in `<screen>/` and **are committed**, one per referenced screen
  per wave. Working agents do not promote their own candidates: the orchestrator selects the
  milestone after its independent §9 pass.
- Name every capture `<wave>-<agent>-<timestampZ>-<status>.png`, status one of `broken`, `suspect`,
  `ok`.

Keep captures under 5MB; some models cannot ingest larger images, and a capture the agent cannot
read is worthless.

## 9. Casual review, rigorous integration

The *checking* is casual. The *code* is not. Fixes are real edits to real components and land under
the same guarantees as anything else. Once every fixer has reported:

1. **The orchestrator does its own visual pass, by looking, not by reading a summary.** Drive the
   app directly at the profile's viewport, capture each referenced screen as its milestone, and
   compare against the references. This is the only independent check in the phase.

   **It is also the priciest step for the orchestrator's subscription, so it is capped.**
   Numeric-first: verify every criterion that states a number by computed-style or bounding-box
   read-back before opening any image; that is text, and nearly free. Then ingest exactly **one**
   capture per referenced screen, once. No re-shoot loop: anything this pass turns up is fixed
   inline and confirmed by numeric read-backs, not by another round of images.
2. Full baseline, once: `tools/test-project full` and `git diff --check`.
3. Fast-forward `main`. Commit locally. Never push.
4. Leave the shared worktree clean, current, and warm.

**No repair loops back to the agents.** Anything the final pass turns up, the orchestrator fixes
inline.

## Done

Every finding is fixed or explicitly deferred by the user; the orchestrator's final pass is clean;
the baseline is green; `main` has been fast-forwarded. Without a stated finish line, agents
discussing whether the app looks good can continue indefinitely.

## Why this is not the delegation path

| | Implementation (`delegation.md`) | Final visual check |
| --- | --- | --- |
| Agent | The default implementer, in its own worktree | The same model, several instances sharing one worktree |
| Commissioned by | A `writespec` spec, hook-enforced | A rough brief; no spec is possible |
| Bounded by | The spec's file allowlist | Agent 0's finding list |
| Isolation | One worktree per agent | One shared worktree, disjoint file ownership |
| Self-verification | Forbidden and enforced | Expected; it is the mechanism |
| Coordination | None; specs are disjoint | Between agents, by design |
| Review | Clause mapping under `speccheck` | Orchestrator's own visual pass |
| Integration | Scratch branch, one baseline, fast-forward | Same |

The asymmetry is not laxity. A spec cannot be written for work whose first step is discovering what
is wrong, and rigour applied to discovery would mean doing the discovery twice.
