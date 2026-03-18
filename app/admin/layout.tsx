import AdminHeader from '@/components/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
