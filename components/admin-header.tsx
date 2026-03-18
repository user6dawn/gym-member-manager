"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient } from '@/lib/supabase/client';

export default function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    const fetchRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(data?.role === 'admin');
    };

    fetchRole();
  }, [supabase]);

  // Hide header for unauthenticated routes to prevent it showing during login flow
  if (pathname === '/admin/login' || pathname === '/admin') {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Signed out successfully',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error signing out',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="border-b sticky top-0 z-10 bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <Image
                src="/images/bodyshakefitnesslogo.png"
                alt="BodyShake Fitness"
                width={24}
                height={24}
                className="h-6 w-auto text-primary"
              />
              <span className="font-bold text-lg hidden sm:inline-block">
                BodyShake Fitness Center
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/admin/dashboard"
                className={`text-sm rounded-md px-2 py-1 transition-all ${
                  isActive('/admin/dashboard')
                    ? 'font-medium text-foreground bg-secondary/20 border border-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/10 border border-transparent hover:border-secondary/50'
                }`}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/stats"
                    className={`text-sm ${
                      isActive('/admin/stats')
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground transition-colors'
                    }`}
                  >
                    Stats
                  </Link>
                  <Link
                    href="/admin/users"
                    className={`text-sm ${
                      isActive('/admin/users')
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground transition-colors'
                    }`}
                  >
                    Users
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="hidden md:flex"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign out</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 py-2 pb-4 border-t">
          <nav className="flex flex-col space-y-3">
            <Link
              href="/admin/dashboard"
              className={`px-2 py-1.5 rounded-md transition-all ${
                isActive('/admin/dashboard')
                  ? 'bg-secondary text-foreground font-medium border border-secondary'
                  : 'text-muted-foreground hover:bg-secondary/10 hover:text-foreground border border-transparent'
              }`}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/stats"
                  className={`px-2 py-1.5 rounded ${
                    isActive('/admin/stats')
                      ? 'bg-secondary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  Stats
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-2 py-1.5 rounded ${
                    isActive('/admin/users')
                      ? 'bg-secondary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  Users
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
