# Verification

Report `PASS`, `FAIL`, `SKIP`, and `BLOCKED` distinctly. State the exact command, relevant output, and
coverage boundary.

## Profiles

Run the project wrapper from the repository root:

```bash
tools/test-project quick
tools/test-project build
tools/test-project full
```

The profiles and the commands behind them are defined in the `[profiles]` and `[commands]` blocks of
`docs/project_profile.md`, so this file never needs to name a project's tooling. Use the smallest
profile that covers the change. Do not silently redefine build success as test success.

## Evidence categories

Static analysis (types, lint), bundle or build, unit and integration tests, browser behavior in a
running application, live backend behavior, and native-device behavior are distinct categories. The
project profile lists which of them exist here and which are `BLOCKED` for lack of infrastructure.

A change can pass one category and remain blocked in another. Report that boundary directly.
Missing infrastructure is `BLOCKED`, never `PASS`.

## A check is only evidence if it can fail

- **A green check is only evidence if the command has been shown to be capable of going red.**
  When adopting or trusting a verification command, prove it fails on a deliberate fault before
  treating its success as meaningful. A type check that compiles zero files exits 0 forever.
- **A known-failing check is not evidence either, and a fixed count invites everyone to stop reading
  it.** Baseline entries are for known, understood, individually named failures. A parse or syntax
  error is never baseline noise: it can hide a real defect inside an unchanged total, and it
  suppresses further analysis of that file. Read the failures, not only the count.
- **Where a file's only static check is one the baseline discounts, that file has no verification
  at all.** Know which checks cover which directories; a test runner that reads a file as text, or
  a type checker whose project config excludes a directory, does not check it.
- **Type checking and tests are not redundant.** Many test runners strip types without checking
  them, so a suite can pass straight over a type error.
- **Derive every count by running the command, never by quoting a document.** Recorded counts go
  stale the moment any change moves them.

## High-risk areas

Each project lists its own high-risk areas, and the extra verification they need, under
`## High-risk areas` in `docs/project_profile.md`. Do not rely on typecheck alone for any of them.

## A crashed checkout can zero files that git still believes are committed

If the machine goes down seconds after a commit, merge or checkout, git may have written the ref
updates while file and object writes were still in the page cache. On restart the newest commit,
its trees and blobs can be 0-byte files (`fatal: bad object HEAD`), and working files just written
can be empty while the index still records them as committed and unmodified.

**Repair without rewriting a ref.** A git object's name is the hash of its content, so re-creating
lost objects byte-for-byte restores the same hashes and every ref pointing at them becomes valid
again. Back up `.git` first, then:

```bash
find .git/objects -type f -empty          # the damage, precisely
git fsck --no-dangling                    # what refs and trees depend on it
# rebuild the file content, then confirm it hashes to the missing blob BEFORE writing:
git hash-object <rebuilt-file>
rm .git/objects/<the empty files>
git hash-object -w <rebuilt-file>
GIT_INDEX_FILE=$tmp git read-tree <parent> && GIT_INDEX_FILE=$tmp git update-index --cacheinfo …
GIT_INDEX_FILE=$tmp git write-tree        # must equal the missing tree
GIT_AUTHOR_DATE=… GIT_COMMITTER_DATE=… git commit-tree <tree> -p <parent>   # must equal the missing commit
```

The author and committer dates come from the reflog, whose entries survive as text; the message must
be reproduced exactly, trailers included. If any hash does not match, stop: the content is not what
was committed, and moving the ref instead is the honest fallback.

**Restore working files only where the file is empty on disk and non-empty in `HEAD`.** Anything else
that differs is real uncommitted work, not crash damage, and a blanket `git checkout -f` or
`git restore .` would destroy it silently.

**Then re-run the full baseline rather than trusting the pre-crash result.** The tree that was
verified and the tree on disk were not the same bytes.
