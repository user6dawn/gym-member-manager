"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dumbbell, LogOut, Menu, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b sticky top-0 z-10 bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg hidden sm:inline-block">GymTrack</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/admin/dashboard" 
                className={`text-sm ${isActive('/admin/dashboard') 
                  ? 'font-medium text-foreground' 
                  : 'text-muted-foreground hover:text-foreground transition-colors'}`}
              >
                Dashboard
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
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
              className={`px-2 py-1.5 rounded ${isActive('/admin/dashboard') 
                ? 'bg-secondary font-medium' 
                : 'text-muted-foreground'}`}
            >
              Dashboard
            </Link>
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