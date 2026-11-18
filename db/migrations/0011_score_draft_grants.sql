-- Restore EXECUTE on scoring RPCs after 0010 recreate.
-- Callers without this grant see: permission denied for function save_score_draft

revoke all on function public.save_score_draft(uuid, uuid, integer, text) from public;
revoke all on function public.publish_score_drafts(uuid[]) from public;

grant execute on function public.save_score_draft(uuid, uuid, integer, text)
  to authenticated, service_role;
grant execute on function public.publish_score_drafts(uuid[])
  to authenticated, service_role;

revoke execute on function public.save_score_draft(uuid, uuid, integer, text) from anon;
revoke execute on function public.publish_score_drafts(uuid[]) from anon;
