-- Allow audit_log rows for access-code control-room logins.

alter type public.audit_action add value if not exists 'admin_login';

notify pgrst, 'reload schema';
