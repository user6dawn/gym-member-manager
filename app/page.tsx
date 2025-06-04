import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GymTrack</span>
          </div>
          <nav>
            <Link href="/admin/login">
              <Button variant="ghost">Admin Login</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center space-y-6">
          <Dumbbell className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            GymTrack Member System
          </h1>
          <p className="text-xl text-muted-foreground">
            Efficiently manage gym memberships, track subscriptions, and maintain member records.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/form">
              <Button size="lg" className="w-full sm:w-auto">
                Register as Member
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GymTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
}