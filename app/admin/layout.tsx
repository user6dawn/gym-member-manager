import AdminHeader from '@/components/admin-header';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  
  // Get session data
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, the middleware will handle the redirect
  return (
    <div className="flex flex-col min-h-screen">
      {session && <AdminHeader />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}