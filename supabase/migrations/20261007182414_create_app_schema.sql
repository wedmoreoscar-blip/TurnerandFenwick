-- Create the app schema for our own data (journal, inbox, settings), closed to the public API roles.
--
-- Project: Supabase dev first, prod later (same file, same order).
-- docs/decisions.md, "Data and identity rules": our data lives in app; only server-side code
-- (Medusa, Edge Functions) touches it, with the service-role key. No anon or authenticated access,
-- so no grants to those roles here, and every app table must enable RLS in the migration that
-- creates it.
--
-- Supabase's default privileges cover only the public schema, so a new schema grants nothing to
-- anon or authenticated. The revokes below make that explicit. The default privileges give
-- service_role access to tables, sequences and functions that postgres creates in app later.
--
-- After db push, set Project Settings > Data API > Exposed schemas to app only (removing public and
-- graphql_public). That dashboard setting, not this file, is what hides Medusa's tables from the API.
--
-- Safe to run twice. Undo: drop schema app; (only while it is empty).

create schema if not exists app;

revoke all on schema app from public, anon, authenticated;
grant usage on schema app to service_role;

alter default privileges for role postgres in schema app
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema app
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema app
  revoke all on functions from public, anon, authenticated;

alter default privileges for role postgres in schema app
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema app
  grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema app
  grant execute on functions to service_role;
