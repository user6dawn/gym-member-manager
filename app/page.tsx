import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full text-center space-y-6">
          <Image 
            src="/images/bodyshakefitnesslogo.png"
            alt="BodyShake Fitness Center"
            width={180}
            height={64}
            className="mx-auto text-primary"
          />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            BodyShake Fitness Center
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
    </div>
  );
}
