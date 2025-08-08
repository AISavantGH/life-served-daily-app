import { MealPlanner } from '@/components/meal-planner';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">
                Life Served Daily
              </h1>
              <p className="text-sm text-muted-foreground">Your Personal Meal Planning Assistant</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center p-4 md:p-8">
        <MealPlanner />
      </main>
    </div>
  );
}
