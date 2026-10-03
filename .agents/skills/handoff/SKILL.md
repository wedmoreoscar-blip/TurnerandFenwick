---
name: handoff
description: Close or archive a project session by updating durable decisions, triaging Git changes, optionally making a safe local commit, and writing a resumable kickoff bundle. Use for handoff, wrap-up, archive-only handoff, end-of-session, or next-session prompt requests.
---

1. Read applicable repository instructions and Git status. If
   `docs/workflows/session_lifecycle.md` exists, follow it as the repository-specific contract.
2. Discover existing handoff/kickoff conventions before creating files. Prefer the repo's canonical
   paths and authority order.
3. If no convention exists, write a root `HANDOFF.md` containing current state, changed files, commands
   and results, unresolved risks, exact next steps, and a fenced `## PROMPT` for the next session. Do not
   invent a decisions ledger or task directory merely to satisfy this generic skill.
4. Triage the entire Git status; never stage blindly or include secrets, generated output, or unfamiliar
   work. Create a local commit only when requested or clearly part of the repo's handoff contract.
5. Never push. Report files written, commit if any, verification boundaries, and the exact continuation.
