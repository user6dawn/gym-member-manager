import { createServerClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/dashboard-content';
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-static';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerClient();
  
  // Fetch initial members data with their latest subscription
  const { data: members, error } = await supabase
    .from('users')
    .select(`
      *,
      subscriptions:subscriptions(
        payment_date,
        expiration_date
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching members:', error);
  }

  const processedMembers = members?.map(member => {
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
        <h1 className="text-3xl font-bold">Member Dashboard</h1>
        <p className="text-muted-foreground">
          Manage gym members and their subscriptions
        </p>
      </div>
        <ThemeToggle />
      </div>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent initialMembers={processedMembers} />
      </Suspense>
    </div>
  );
}