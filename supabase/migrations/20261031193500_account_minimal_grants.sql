-- Logosphere BITS — minimal account grants (default-privilege cleanup).
--
-- New tables and functions inherit broad platform default grants
-- (anon + authenticated on tables, PUBLIC + anon EXECUTE on
-- functions). Rows were still safe — RLS policies admit only
-- authenticated members, and every account RPC rejects JWT-less
-- callers in account_authorize() — but the posture stays minimal
-- and explicit like the demo path (demo_authorize, demo_sessions):
-- anon keeps nothing anywhere on the account plane, authenticated
-- keeps exactly the policy-bound table rights plus RPC EXECUTE.
-- Grants only; no tables, policies, rows, or behavior change.

revoke all on public.corporate_documents, public.account_messages,
  public.account_invitations, public.account_relations
  from anon, authenticated;

grant select, insert, delete on public.corporate_documents to authenticated;
grant select, insert on public.account_messages to authenticated;
grant select on public.account_invitations to authenticated;
grant select, insert, delete on public.account_relations to authenticated;

revoke all on function public.account_upsert_profile(text, text)
  from public, anon;
revoke all on function public.account_create_organization(text)
  from public, anon;
revoke all on function public.account_assign_role(uuid, uuid, text)
  from public, anon;
revoke all on function public.account_set_matrix_cell(text, text, text, boolean)
  from public, anon;
revoke all on function public.account_mark_message_read(uuid)
  from public, anon;
revoke all on function public.account_invite_member(uuid, text, text)
  from public, anon;
revoke all on function public.account_accept_invitation(text)
  from public, anon;
revoke all on function public.account_decline_invitation(text)
  from public, anon;
