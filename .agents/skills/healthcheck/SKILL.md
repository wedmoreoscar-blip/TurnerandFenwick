---
name: healthcheck
description: Perform one lightweight health check of background work active in the current session, diagnose failures or stalls, and minimally recover them. Use when asked for a health check, background-job status, or to check whether an active run is still healthy. Do not use for continuous monitoring.
---

1. Discover only background jobs associated with the current session. Inspect tracked shells/tasks and
   relevant process names; identify each job's output or log.
2. Check current progress and task-specific failures: exceptions, nonzero exits, HTTP errors, auth or
   credit/rate limits, malformed output, and genuine stalls.
3. If healthy, report one terse line per job and stop.
4. If broken, apply the smallest in-scope fix and resume only checkpoint-safe work. Do not restart
   unrelated jobs or loop on a persistent failure.
5. Report the diagnosis and recovery in one or two lines. Never invent a background job when none is
   active.
