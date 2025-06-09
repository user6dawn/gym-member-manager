'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto p-6 flex flex-col items-center text-center space-y-8">
          {/* Success Icon */}
          <div className="rounded-full bg-primary/10 p-4 flex items-center justify-center">
            <CheckCircle className="h-14 w-14 text-primary" />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Registration Successful!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you for choosing BodyShake Fitness Center
            </p>
          </div>

          {/* Membership Info */}
          <div className="w-full rounded-lg border border-muted bg-background py-4 px-6 space-y-2">
            <p className="text-base text-foreground font-medium">
              Your membership details have been submitted successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Our staff will review your application and contact you if needed.
            </p>
          </div>

          {/* Payment Info */}
          <div className="w-full rounded-lg border border-primary/30 bg-muted/50 py-5 px-6 space-y-4">
            <p className="text-base text-foreground font-medium">
              Please make your payment to complete the registration process. Pay strictly to the account below:
            </p>
            <div className="text-center space-y-1 text-base">
              <div>
              <span className="font-semibold">Account Name:</span> Nnaemeka Chimereze Onyeze
              </div>
              <div>
              <span className="font-semibold">Bank Name:</span> Opay
              </div>
              <div className="flex items-center justify-center gap-2">
              <span className="font-semibold">Account Number:</span> 7047219659
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText('7047219659')}
                className="ml-2 p-1 rounded hover:bg-muted transition-colors"
                aria-label="Copy account number"
              >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <rect x="3" y="3" width="13" height="13" rx="2" />
                </svg>
              </button>
              </div>
            </div>
            <a
              href="https://Wa.me/+2347012097110"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full font-semibold">
                Click here to share receipt via WhatsApp
              </Button>
            </a>
          </div>

          {/* Website Link */}
          <div className="w-full rounded-lg border border-muted bg-background py-4 px-6 space-y-2">
            <p className="text-base text-muted-foreground">
              Visit our website to learn more about us!
            </p>
            <a
              href="https://bodyshakefitness.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="lg" className="w-full font-semibold">
                Visit Website
              </Button>
            </a>
          </div>
        </div>
      </main>

      <footer className="w-full border-t mt-auto bg-background">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BodyShake Fitness Center. All rights reserved.
            </p>
            {/* 
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/form" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Register
              </Link>
              <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            </div>
            */}
          </div>
        </div>
      </footer>
    </div>
  );
}