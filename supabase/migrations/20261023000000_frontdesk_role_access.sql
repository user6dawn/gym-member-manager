-- Role lookup used by policies. SECURITY DEFINER lets the function read the
-- caller's role even when user_roles RLS is enabled.
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Restrictive policies also constrain any broader permissive policies that
-- may already exist in the hosted project.
DROP POLICY IF EXISTS frontdesk_admin_only_users ON public.users;
CREATE POLICY frontdesk_admin_only_users
  ON public.users AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS frontdesk_admin_only_subscriptions ON public.subscriptions;
CREATE POLICY frontdesk_admin_only_subscriptions
  ON public.subscriptions AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS anonymous_cannot_read_users ON public.users;
CREATE POLICY anonymous_cannot_read_users
  ON public.users AS RESTRICTIVE FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS anonymous_cannot_read_subscriptions ON public.subscriptions;
CREATE POLICY anonymous_cannot_read_subscriptions
  ON public.subscriptions AS RESTRICTIVE FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS anonymous_registration_write_limits ON public.users;
CREATE POLICY anonymous_registration_write_limits
  ON public.users AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (status = false);

DROP POLICY IF EXISTS anonymous_cannot_modify_users ON public.users;
CREATE POLICY anonymous_cannot_modify_users
  ON public.users AS RESTRICTIVE FOR UPDATE TO anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS anonymous_cannot_delete_users ON public.users;
CREATE POLICY anonymous_cannot_delete_users
  ON public.users AS RESTRICTIVE FOR DELETE TO anon
  USING (false);

DROP POLICY IF EXISTS anonymous_cannot_access_subscriptions ON public.subscriptions;
CREATE POLICY anonymous_cannot_access_subscriptions
  ON public.subscriptions AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS anonymous_cannot_access_user_roles ON public.user_roles;
CREATE POLICY anonymous_cannot_access_user_roles
  ON public.user_roles AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Preserve admin CRUD through the authenticated Supabase client.
DROP POLICY IF EXISTS admin_manage_users ON public.users;
CREATE POLICY admin_manage_users
  ON public.users FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS admin_manage_subscriptions ON public.subscriptions;
CREATE POLICY admin_manage_subscriptions
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- The public registration form may create an inactive member, but cannot read
-- the inserted record or use this policy to create an active account.
DROP POLICY IF EXISTS public_register_inactive_user ON public.users;
CREATE POLICY public_register_inactive_user
  ON public.users FOR INSERT TO anon
  WITH CHECK (status = false);

DROP POLICY IF EXISTS user_roles_select_own_or_admin ON public.user_roles;
CREATE POLICY user_roles_select_own_or_admin
  ON public.user_roles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_app_role() = 'admin');

DROP POLICY IF EXISTS user_roles_read_own ON public.user_roles;
CREATE POLICY user_roles_read_own
  ON public.user_roles FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS admin_manage_user_roles ON public.user_roles;
CREATE POLICY admin_manage_user_roles
  ON public.user_roles FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS frontdesk_no_role_mutations ON public.user_roles;
CREATE POLICY frontdesk_no_role_mutations
  ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS frontdesk_no_role_updates ON public.user_roles;
CREATE POLICY frontdesk_no_role_updates
  ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS frontdesk_no_role_deletes ON public.user_roles;
CREATE POLICY frontdesk_no_role_deletes
  ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.current_app_role() = 'admin');
