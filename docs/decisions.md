# Project Decisions

This is the durable design ledger. Agents add entries only through the `update-decisions` workflow.
Keep history: supersede an entry instead of deleting it. Only `LOCKED` entries are settled truth.

Entry headings use one of `LOCKED`, `PENDING`, `SUPERSEDED`, with a date:

    ## LOCKED — <decision in one line> (YYYY-MM-DD)

## PENDING

Nothing yet.
