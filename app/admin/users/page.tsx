import { createServerClient } from '@/lib/supabase/server';
import AdminUsersTable from '@/components/admin-users-table';

export const dynamic = 'force-static';
export const revalidate = 0;

export default async function AdminUsersPage() {
  const supabase = createServerClient();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, status, created_at')
    .order('created_at', { ascending: false });

  if (error || !users) {
    console.error('Error fetching users for admin users page:', error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Users</h1>
        <p className="text-muted-foreground mb-6">
          There was a problem loading users. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Browse, search, and filter all users.
        </p>
      </div>
      <AdminUsersTable users={users} />
    </div>
  );
}

