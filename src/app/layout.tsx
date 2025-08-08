import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Logo } from '@/components/icons';
import './globals.css';

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
      <body className={cn('min-h-screen bg-background font-body antialiased', ptSans.variable)}>
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
              <div className="mr-4 flex">
                <a href="/" className="mr-6 flex items-center space-x-2">
                  <Logo className="h-6 w-6" />
                  <span className="font-bold sm:inline-block font-headline">Life Served Daily</span>
                </a>
              </div>
            </div>
          </header>
          <main className="flex-1 py-8">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
