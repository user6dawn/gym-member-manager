import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <div className="container mx-auto max-w-md p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">Registration Successful!</h1>
        <p className="text-muted-foreground">
          Thank you for registering with our gym. Your membership details have been submitted successfully.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Our staff will review your application and you may be contacted for further information if needed.
        </p>
        <div className="pt-6">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}