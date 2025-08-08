import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Logo } from '@/components/icons';
import './globals.css';

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
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="flex flex-col min-h-screen">
          <header className="bg-card border-b shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center gap-3">
                  <Logo className="h-8 w-8 text-primary" />
                  <h1 className="text-2xl font-headline font-bold text-foreground">
                    Life Served Daily
                  </h1>
                </div>
                {/* Placeholder for future navigation */}
                <div className="w-32 h-8 bg-muted rounded-md animate-pulse"></div>
              </div>
            </div>
          </header>
          <main className="flex-grow">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
