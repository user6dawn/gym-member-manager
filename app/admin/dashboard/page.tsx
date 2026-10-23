import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import DashboardContent from '@/components/dashboard-content';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

type DashboardSubscription = {
  expiration_date: string;
  session: string | null;
};

type DashboardMember = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  image_url: string | null;
  status: boolean;
  subscriptions: DashboardSubscription[];
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = roleError ? null : roleRow?.role;

  if (role !== 'admin' && role !== 'frontdesk') redirect('/');
  const isAdmin = role === 'admin';
  // Use the server-only client for dashboard reads after checking the session role.
  // Frontdesk never receives the unfiltered rows returned by this client.
  const dataClient = supabaseAdmin;

  let processedMembers: DashboardMember[] = [];
  let membersLoadError = false;
  let totalMembersCount = 0;

  if (isAdmin) {
    const { data, error, count } = await dataClient
      .from('users')
      .select(`
        id,
        name,
        phone,
        email,
        image_url,
        status,
        subscriptions:subscriptions(
          expiration_date,
          session
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching dashboard members:', error);
    membersLoadError = Boolean(error);
    totalMembersCount = count ?? 0;
    processedMembers = (data ?? []).map((member) => ({
      ...member,
      subscriptions: [...(member.subscriptions ?? [])].sort(
        (a, b) => b.expiration_date.localeCompare(a.expiration_date),
      ),
    }));
  } else {
    // Frontdesk receives member names and photos for desk identification, plus
    // plan/session status. Contact details and profile IDs remain restricted.
    const { data, error, count } = await dataClient
      .from('users')
      .select(`
        member_id,
        name,
        image_url,
        status,
        subscriptions:subscriptions(
          expiration_date,
          session
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching frontdesk dashboard members:', error);
    membersLoadError = Boolean(error);
    totalMembersCount = count ?? 0;
    processedMembers = (data ?? []).map((member) => {
      const subscriptions = [...(member.subscriptions ?? [])].sort(
        (a, b) => b.expiration_date.localeCompare(a.expiration_date),
      );
      return {
        id: `frontdesk-${member.member_id}`,
        name: member.name,
        phone: '',
        email: null,
        image_url: member.image_url,
        status: member.status,
        subscriptions,
      };
    });
  }

  const now = new Date();
  const todayDateOnly = now.toISOString().slice(0, 10);

  const { count: newUsersToday } = await dataClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayDateOnly)
    .lt('created_at', new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString());

  const { count: newSubscriptionsToday } = await dataClient
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('payment_date', todayDateOnly);

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          initialMembers={processedMembers}
          membersLoadError={membersLoadError}
          newUsersCount={newUsersToday ?? 0}
          newSubscriptionsCount={newSubscriptionsToday ?? 0}
          isAdmin={isAdmin}
          totalMembersCount={totalMembersCount}
        />
      </Suspense>
    </div>
  );
}
