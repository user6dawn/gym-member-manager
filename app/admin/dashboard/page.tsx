import { createServerClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/dashboard-content';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

export default async function DashboardPage() {
  const supabase = createServerClient();

  // Fetch initial members data with their latest subscription (including session)
  const { data: members, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      phone,
      email,
      image_url,
      status,
      subscriptions:subscriptions(
        id,
        created_at,
        payment_date,
        expiration_date,
        total_days,
        active_days,
        inactive_days,
        inactive_start_date,
        days_remaining,
        last_active_date,
        session
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching members:', error);
  }

  const processedMembers = members?.map((member) => {
    // Find the latest subscription by expiration date
    const subscriptions = member.subscriptions as any[] || [];
    const latestSubscription = subscriptions.length > 0
      ? subscriptions.sort((a, b) => 
          new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime()
        )[0]
      : null;
    
    return {
      ...member,
      latestSubscription,
    };
  }) || [];

  // Calculate summary metrics for the dashboard (today's numbers)
  const now = new Date();
  const todayDateOnly = now.toISOString().slice(0, 10);

  const { count: newUsersToday } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayDateOnly)
    .lt('created_at', new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());

  const { count: newSubscriptionsToday } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_date', todayDateOnly);

  return (
    <div className="container mx-auto p-6">


      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          initialMembers={processedMembers}
          newUsersCount={newUsersToday ?? 0}
          newSubscriptionsCount={newSubscriptionsToday ?? 0}
        />
      </Suspense>
    </div>
  );
}
