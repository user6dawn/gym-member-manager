import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import AdminUsersTable from '@/components/admin-users-table';

export const revalidate = 60; // Revalidate data every 60 seconds

export default async function AdminUsersPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (roleError || role?.role !== 'admin') redirect('/admin/dashboard');

  const { data: users, error, count } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      image_url,
      status,
      created_at,
      subscriptions:subscriptions(
        payment_date,
        expiration_date
      )
    `, { count: 'exact' })
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

  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');

  const usersWithSubscriptionStatus = users.map((user) => {
    const subscriptions =
      (user.subscriptions as Array<{
        payment_date: string;
        expiration_date: string;
      }> | null) || [];
    const latestSubscription = subscriptions
      .slice()
      .sort((a, b) =>
        b.expiration_date.slice(0, 10).localeCompare(a.expiration_date.slice(0, 10)),
      )[0] || null;

    const lastSubscriptionDate = subscriptions
      .slice()
      .sort(
        (a, b) =>
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
      )[0]?.payment_date ?? null;

    const subscriptionStatus: 'active' | 'inactive' | 'expired' = latestSubscription
      ? latestSubscription.expiration_date.slice(0, 10) > today
        ? 'active'
        : 'expired'
      : 'inactive';

    return {
      ...user,
      lastSubscriptionDate,
      subscriptionStatus,
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Browse, search, and filter all users. Showing {usersWithSubscriptionStatus.length} of {count ?? 0} total users.
        </p>
      </div>
      <AdminUsersTable users={usersWithSubscriptionStatus} totalUsersCount={count ?? 0} />
    </div>
  );
}
