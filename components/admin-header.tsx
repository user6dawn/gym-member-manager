"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type AdminHeaderProps = {
  role: 'admin' | 'frontdesk';
};

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/stats', label: 'Stats', Icon: BarChart3 },
  { href: '/admin/users', label: 'Users', Icon: Users },
];

export default function AdminHeader({ role }: AdminHeaderProps) {
  const isAdmin = role === 'admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Close the drawer whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll and allow Escape to close while the drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileMenuOpen]);

  if (pathname === '/admin/login' || pathname === '/admin') return null;

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(`${href}/`));

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsMobileMenuOpen(false);
      router.replace('/admin/login');
      router.refresh();
      toast({ title: 'Signed out successfully' });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({ title: 'Error signing out', variant: 'destructive' });
    }
  };

  const brand = (
    <Link
      href="/admin/dashboard"
      aria-label="Bodyshake Fitness admin dashboard"
      className="flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Image
        src="/images/bodyshakefitnesslogo.png"
        alt=""
        width={128}
        height={128}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );

  const links = (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1">
      {navItems.filter(({ href }) => isAdmin || href === '/admin/dashboard').map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {/* Active marker */}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                active ? 'opacity-100' : 'opacity-0'
              )}
            />
            <Icon
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="flex items-center gap-2 border-t pt-4">
      <Button
        variant="ghost"
        className="h-10 flex-1 justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        Log out
      </Button>
      <ThemeToggle />
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden">
        {brand}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open admin navigation"
          aria-expanded={isMobileMenuOpen}
          aria-controls="admin-mobile-drawer"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background px-4 py-6 md:flex">
        <div className="mb-8 px-2">{brand}</div>
        <div className="flex-1 overflow-y-auto">{links}</div>
        {footer}
      </aside>

      {/* Mobile drawer (always mounted so it can slide) */}
      <div
        className={cn('fixed inset-0 z-40 md:hidden', !isMobileMenuOpen && 'pointer-events-none')}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          tabIndex={isMobileMenuOpen ? 0 : -1}
          aria-label="Close admin navigation"
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200',
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
        <aside
          id="admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-background px-4 py-6 shadow-xl',
            'transition-transform duration-200 ease-out motion-reduce:transition-none',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="mb-8 flex items-center justify-between px-2">
            {brand}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close admin navigation"
              tabIndex={isMobileMenuOpen ? 0 : -1}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">{links}</div>
          {footer}
        </aside>
      </div>
    </>
  );
}
