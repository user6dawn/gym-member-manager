import { createServerClient } from '@/lib/supabase/server';
import AdminStatsContent from '@/components/admin-stats-content';

export default async function AdminStatsPage() {
  const supabase = createServerClient();

  const now = new Date();
  const range30Start = new Date(now);
  range30Start.setDate(now.getDate() - 30);

  const range180Start = new Date(now);
  range180Start.setDate(now.getDate() - 180);

  const todayDateOnly = now.toISOString().slice(0, 10);

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: totalSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true });

  const { count: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gt('expiration_date', todayDateOnly);

  const { count: newUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', range30Start.toISOString());

  const { count: newSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .gte('payment_date', range30Start.toISOString().slice(0, 10));

  const { data: recentUsers } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', range180Start.toISOString());

  const { data: recentSubscriptions } = await supabase
    .from('subscriptions')
    .select('payment_date, session')
    .gte('payment_date', range180Start.toISOString().slice(0, 10));

  const aggregateByDate = (dates: string[] | null | undefined) => {
    const map = new Map<string, number>();

    dates?.forEach((iso) => {
      const key = iso.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
  };

  const userGrowth = aggregateByDate(
    (recentUsers ?? []).map((u) => (u as { created_at: string }).created_at),
  );

  const subscriptionGrowth = aggregateByDate(
    (recentSubscriptions ?? []).map(
      (s) => (s as { payment_date: string }).payment_date,
    ),
  );

  const sessionCounts = new Map<string, number>();

  (recentSubscriptions ?? []).forEach((s) => {
    const { session } = s as { session: string | null };
    const key = session ?? 'Unknown';
    sessionCounts.set(key, (sessionCounts.get(key) ?? 0) + 1);
  });

  const sessionDistribution = Array.from(sessionCounts.entries()).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Stats</h1>
        <p className="text-muted-foreground">
          Analytics and trends for users and subscriptions
        </p>
      </div>
      <AdminStatsContent
        totalUsers={totalUsers ?? 0}
        totalSubscriptions={totalSubscriptions ?? 0}
        activeSubscriptions={activeSubscriptions ?? 0}
        newUsers={newUsers ?? 0}
        newSubscriptions={newSubscriptions ?? 0}
        userGrowth={userGrowth}
        subscriptionGrowth={subscriptionGrowth}
        sessionDistribution={sessionDistribution}
      />
    </div>
  );
}
