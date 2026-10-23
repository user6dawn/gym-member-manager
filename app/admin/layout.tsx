import AdminHeader from '@/components/admin-header';
import { createServerClient } from '@/lib/supabase/server';

type UserRoleRow = {
  role: 'admin' | 'frontdesk' | string;
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;

  if (user?.id) {
    const { data, error } = await supabase
      .from('user_roles' as never)
      .select('role')
      .eq('id', user.id)
      .single();

    const roleRow = !error ? (data as UserRoleRow | null) : null;
    role = roleRow?.role ?? null;
  }

  return (
    <div className="min-h-screen md:flex">
      {(role === 'admin' || role === 'frontdesk') && <AdminHeader role={role} />}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
