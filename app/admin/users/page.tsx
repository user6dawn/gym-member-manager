import { createServerClient } from '@/lib/supabase/server';
import AdminUsersTable from '@/components/admin-users-table';

export default async function AdminUsersPage() {
  const supabase = createServerClient();

  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      status,
      created_at,
      subscriptions:subscriptions(
        payment_date,
        expiration_date
      )
    `)
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
  now.setHours(0, 0, 0, 0);

  const usersWithSubscriptionStatus = users.map((user) => {
    const subscriptions =
      (user.subscriptions as Array<{
        payment_date: string;
        expiration_date: string;
      }> | null) || [];
    const latestSubscription = subscriptions
      .slice()
      .sort((a, b) =>
        new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime(),
      )[0] || null;

    const lastSubscriptionDate = subscriptions
      .slice()
      .sort(
        (a, b) =>
          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
      )[0]?.payment_date ?? null;

    const subscriptionStatus: 'active' | 'inactive' | 'expired' = latestSubscription
      ? new Date(latestSubscription.expiration_date).getTime() >= now.getTime()
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
          Browse, search, and filter all users.
        </p>
      </div>
      <AdminUsersTable users={usersWithSubscriptionStatus} />
    </div>
  );
}
