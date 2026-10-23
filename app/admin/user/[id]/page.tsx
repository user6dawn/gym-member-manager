import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import UserProfile from '@/components/user-profile';
import { Suspense } from 'react';
import { UserDetailSkeleton } from '@/components/skeletons';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = createServerClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect('/admin/login');

  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', authUser.id)
    .single();
  if (roleError || roleRow?.role !== 'admin') redirect('/admin/dashboard');

  // Fetch user data
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !user) {
    console.error('Error fetching user:', error);
    notFound();
  }
  
  // Fetch user's subscriptions
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', id)
    .order('expiration_date', { ascending: false });
    
  if (subscriptionsError) {
    console.error('Error fetching subscriptions:', subscriptionsError);
  }
  
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<UserDetailSkeleton />}>
        <UserProfile 
          user={user} 
          subscriptions={subscriptions || []} 
        />
      </Suspense>
    </div>
  );
}
