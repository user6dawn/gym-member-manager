import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Body Shake Fitness',
  description: 'A complete solution for tracking gym members and subscriptions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/images/bodyshakefitnesslogo.png" />
        <link rel="shortcut icon" href="/images/bodyshakefitnesslogo.png" />
        <link rel="apple-touch-icon" href="/images/bodyshakefitnesslogo.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background flex flex-col items-center justify-between`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-1 w-full max-w-7xl mx-auto">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}