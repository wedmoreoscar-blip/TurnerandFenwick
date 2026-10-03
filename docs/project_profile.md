# Project profile — TurnerandFenwick

Project facts the shared workflows refer to. The TOML block is read by `tools/test-project`,
`tools/prepare-worktree`, `tools/spec-block` and `tools/writespec-guard`; keep it valid
(`tools/check-agent-setup` parses it). Everything that needs judgment goes in the prose sections.
This file belongs to this project; the agent kit never overwrites it.

```toml
[commands]
# name = "shell command", run from the repository root. Add any others the profiles need.
install_fresh = "echo 'set install_fresh: installs exactly the lockfile, never rewrites it'"
install_incr  = "echo 'set install_incr: incremental install after a dependency change'"
test          = "echo 'set test' && false"
# typecheck = ""
# lint      = ""
# build     = ""
# dev       = ""   # dev server, used by the visual check

[profiles]
# tools/test-project <profile> runs these command names in order.
quick = ["test"]
full  = ["test"]

[implementer]
run     = ["test"]   # what a delegated implementer runs itself
skip    = []         # checker-only (the expensive ones); specs may not instruct them
forbid  = []         # extra commands implementers must never run, e.g. deploy CLIs
blocked = []         # verification an implementer cannot do, e.g. "browser checks", "live backend"

[worktree]
copy_files       = []   # gitignored files a worktree needs, e.g. ".env"
dependency_files = []   # a merge changing these needs install_incr, e.g. "package-lock.json"
```

## Stack

## Known failures

<!-- Known, understood, individually named failures only. Never record counts here as truth:
derive them by running the command. A parse or syntax error is never baseline noise. -->

## Blocked verification

<!-- Evidence categories this project has but agents cannot reach (live backend, devices, …). -->

## High-risk areas

<!-- Code where typecheck alone is never enough, and the extra verification each needs. -->

## Delegation extras

<!-- Hook for docs/workflows/delegation.md: any extra provisioning or review step for this repo. -->

## Visual check extras

<!-- Hook for docs/workflows/visual_check.md: where design references live, which screens are
referenced, viewport, numeric criteria, standing design constraints, how to launch the app. -->

## Model preferences

<!-- Overrides to docs/workflows/agent_selection.md for this project only, if any. -->

## Project permissions

<!-- Commands agents must never run here (deploys, remote migrations, secret changes). Add each to
.claude/settings.json permissions.deny as "Bash(<cmd> *)", to opencode.json permission.bash as
"<cmd> *": "deny", and to .codex/rules/project.rules as a forbidden prefix_rule. -->

## Quirks
