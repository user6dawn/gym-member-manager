import AdminHeader from '@/components/admin-header';
import { createServerClient } from '@/lib/supabase/server';

type UserRoleRow = {
  role: string;
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

  let isAdmin = false;

  if (user?.id) {
    const { data } = await supabase
      .from('user_roles' as never)
      .select('role')
      .eq('id', user.id)
      .single();

    const roleRow = data as UserRoleRow | null;
    isAdmin = roleRow?.role === 'admin';
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader isAdmin={isAdmin} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
