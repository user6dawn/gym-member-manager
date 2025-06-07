import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="container mx-auto max-w-md p-6 flex flex-col items-center justify-center h-full text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-12 w-12 text-foreground" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Registration Successful!
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Thank you for choosing BodyShake Fitness Center
              </p>
            </div>

            <div className="space-y-3 border-1 py-4 px-6 w-full bg-muted/100">
              <p className="text-sm text-foreground font-medium">
                Your membership details have been submitted successfully
              </p>
              <p className="text-sm text-muted-foreground">
                Our staff will review your application and contact you if needed
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-base text-muted-foreground pb-4">
                Visit our website to learn more about us!
              </p>
              <a 
                href="https://bodyshakefitness.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="font-semibold">
                  Visit Website
                </Button>
              </a>
            </div>
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