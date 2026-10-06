-- Revoke API execute rights on public.rls_auto_enable().
--
-- Project: Supabase dev first, prod later (same file, same order).
-- Fixes security advisor lints 0028 and 0029: the function is SECURITY DEFINER and callable by
-- anon and authenticated through /rest/v1/rpc/rls_auto_enable.
--
-- Supabase created the function with the project's "auto-enable RLS" option. The event trigger
-- ensure_rls (ddl_command_end) runs it to enable RLS on every new table in public. Event triggers
-- run their function without checking EXECUTE rights, so the trigger keeps working; only direct
-- calls through the Data API lose access.
--
-- Safe to run twice: revoking a right that is not held does nothing. Skipped if the function does not
-- exist (a project created without the auto-enable RLS option).
-- Undo: grant execute on function public.rls_auto_enable() to anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
