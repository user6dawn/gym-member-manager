import { MemberForm } from '@/components/member-form';
import Link from 'next/link';

export default function MemberRegistrationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Gym Membership Registration</h1>
            <p className="text-muted-foreground">
              Please fill out the form below to register as a gym member.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <MemberForm />
          </div>
        </div>
      </main>

      <footer className="w-full border-t mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BodyShake Fitness Center. All rights reserved.
            </p>
            {/* <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/form" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Register
              </Link>
              <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}