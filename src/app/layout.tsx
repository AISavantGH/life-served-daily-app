import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { PT_Sans } from 'next/font/google';
import { Logo } from '@/components/icons';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'Life Served Daily',
  description: 'Your daily meal planning assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          ptSans.variable
        )}
      >
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-20 items-center">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight font-headline">
                  Life Served Daily
                </h1>
                <p className="text-sm text-muted-foreground">Your Personal Meal Planning Assistant</p>
              </div>
            </div>
          </div>
        </header>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
