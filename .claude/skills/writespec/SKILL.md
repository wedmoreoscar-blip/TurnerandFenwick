---
name: writespec
description: Write an implementation spec for delegation to a separate coding agent. Use before handing work to an implementer that does not share this session's context.
---

# Writing a spec for delegation

The implementer has none of your context. It has not read this codebase and does not know the
conventions. Write the spec as though it cannot ask you a question: everything foreseeable that it
needs is in the spec or it is not available. A project may provide a route for genuinely unforeseen
questions, but its existence never licenses an incomplete spec.

This spec commissions one step of the path in `docs/workflows/delegation.md`, which is built to cost
one review pass, one repair loop, and one full baseline run. The spec's job is to get correct code
written and hand it back promptly. Verifying it is the checker's job, on the integration branch,
under `speccheck`. Write the spec so the implementer can finish and stop.

Save the spec under `tasks/specs/` and commit it. A spec that exists only in a chat or a tool's
side panel is lost to the session that has to run it.

## Assume nothing carries over

Name files by full path. Point at an existing function it should imitate, by name and approximate
line, rather than describing a convention. Give exact type or signature names; do not paraphrase
them.

## State scope in both directions, tightly

Say what to change and say explicitly what not to touch. Unstated scope is where delegated work
drifts, because a reasonable-looking related edit is invisible in review unless you named the
boundary first.

Default to the smallest possible change. Name the files that may be modified, and say that no others
may be. If the implementer believes another file needs changing, it must report that rather than do
it.

Unrequested improvements are the most expensive kind of drift: they look like good work, so review
waves them through, and they enlarge the diff that every later review has to read.

When a change spans two specs' files, list every call site that crosses the boundary and give each
one to exactly one spec, the one that owns the consumer. Otherwise both specs can be satisfied in
full and the merged tree still fails, because nobody owned the seam.

## Make acceptance checkable

Each criterion should be something a reader with only the spec and a diff can confirm or deny.
"Handles the connected-party case" is not checkable. "Returns a StatuteClaim node when both facts
are present, None otherwise" is.

## State the verification baseline

The spec cannot rely on the implementer asking what "passing" looks like. If the repository has
known-failing checks, a missing test runner, or checks that need unavailable infrastructure, say so
in the spec and state exactly which commands must pass, which are expected to fail unchanged, and
which are BLOCKED rather than runnable.

Give literal numbers, not cross-references. "The lint baseline is 9 errors and 11 warnings" is a
baseline; "the accepted count from the previous ticket" is not, because the implementer must not
need to look it up or ask. The same goes for the current test count and for any command that
behaves unexpectedly in this repository: name the trap and the correct invocation.

**Get those numbers by running the commands, never by quoting a document.** A recorded count is
stale the moment any ticket improves or worsens it, and the record is rarely updated everywhere it
appears; a spec written from a stale count licenses a regression as "baseline held". The commands
are in the `[commands]` block of `docs/project_profile.md`. Run them, read the totals off the output,
and put those in the spec. It costs seconds and it cannot drift.

**Read the failures, not only the count.** A known-failing total can hide a new, real error inside
an unchanged number. Baseline entries are for known, understood, individually named failures.

**Check the numbers survive the change you are commissioning.** A count is a floor only if the work
is compatible with it. If the spec adds an instance of something an existing test counts, "all N
must pass" is unachievable, and an implementer forbidden from editing tests will contort the code to
keep the suite green instead. Name the test the checker will update, in the spec, rather than
pinning a number the ticket invalidates.

This baseline is a *do not break* line, not a burden of proof. It tells the implementer what
already-passing means so it can avoid regressing it and stop. It does not ask the implementer to
demonstrate that its own new behaviour is correct; see "Do not ask the implementer to verify its own
work" below.

## Say where the work happens and who owns Git

State the worktree path. Say that the orchestrator has already synchronized it and installed
dependencies, and that the implementer must not merge, rebase, reset, stash, commit, or change
branches. Integration is the orchestrator's, and an implementer that starts moving branches around
produces a diff nobody can review.

## Size it to one review

If a spec has more than roughly five clauses, split it. Long specs mean long diffs, and long diffs
mean a failed review sends a lot of correct work back round with the incorrect part.

## Assembling the spec

Write the task-specific sections yourself. Then append the three fixed blocks, generated by the
repository's tool, verbatim:

    tools/spec-block baseline >> <spec-file>
    tools/spec-block scope >> <spec-file>
    tools/spec-block closing >> <spec-file>

Do not retype, summarise or reword them. `scope` and `closing` are fixed text from this skill's
`blocks/` directory; `baseline` is rendered from the `[implementer]` section of
`docs/project_profile.md`, so it names this project's commands. `tools/writespec-guard` checks for
all three when a delegation is dispatched.

### State the baseline numbers; let the baseline block say what to run

Give the literal counts (failure totals, the test count, the build time) so "no worse" is checkable.
But **do not write an instruction to run the commands.** The baseline block already says which
commands the implementer runs and which belong to the checker.

This split exists because it was got wrong: a spec that appended the blocks and then added its own
"run these from the root of your worktree" above every command contradicted the block inside it,
and several parallel implementers each ran the most expensive commands in the repository at once.
Builds slowed several-fold from contention, and a starved agent looked exactly like a stalled one.
`writespec-guard` now denies a dispatch whose spec instructs a command listed under
`[implementer].skip` in the profile. Quote the numbers; never issue the commands.

### Do not ask the implementer to verify its own work

The closing block says "Do NOT write new tests." That line is load-bearing. Do not override it, and
do not write a spec clause that requires the implementer to produce test coverage.

The implementer should get the code written and confirm two cheap things: it executes without
syntax or import errors, and the existing suite still passes. Everything past that is the checker's,
on the integration branch.

Three reasons, in increasing order of importance:

1. **It is duplicated work.** The checker re-derives the tests from the spec regardless, so the
   implementer's verification time buys nothing.
2. **It is the wrong agent's time.** Implementers are chosen for competence and land most of the
   work correctly. Having one grind at the last stretch is slower than letting an independent
   checker find it, and it is time added to the critical path rather than removed from it.
3. **Implementer-written tests conceal missing work.** This is the real cost. Tests written by
   whoever wrote the code encode the same assumptions, including the assumption that an unbuilt
   clause was built. A green suite then reports success over a gap, which is worse than no suite at
   all, because it stops the checker looking. In practice this has meant fixtures that hid a unit
   mismatch, and a test named for a clause that contained nothing exercising it and passed against
   a function missing the required parameter.

If a ticket genuinely needs the implementer to write a test, state the specific reason in the spec
and add the literal marker `[implementer-tests]` to the dispatch. For deterministic logic there is
essentially never one.
