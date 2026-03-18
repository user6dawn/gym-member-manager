import { createServerClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/dashboard-content';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

type DashboardSubscription = {
  id: string;
  created_at: string;
  payment_date: string;
  expiration_date: string;
  total_days: number;
  session?: string | null;
};

type DashboardMember = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  subscriptions: DashboardSubscription[] | null;
};

type UserRoleRow = {
  role: string;
};

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        session
      )
    `)
    .order('created_at', { ascending: false });

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

  if (error) {
    console.error('Error fetching members:', error);
  }

  const processedMembers = ((members ?? []) as DashboardMember[]).map((member) => {
    const subscriptions = [...(member.subscriptions ?? [])].sort(
      (a, b) =>
        new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime()
    );

    return {
      ...member,
      image_url:
        member.image_url && !member.image_url.startsWith('http')
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gym.members/${member.image_url}`
          : member.image_url,
      subscriptions,
    };
  });

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
          isAdmin={isAdmin}
        />
      </Suspense>
    </div>
  );
}
