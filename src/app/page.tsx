import { MealPlanner } from '@/components/meal-planner';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-2 items-center">
            <Logo className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight font-headline">
              Life Served Daily
            </h1>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center p-4 md:p-8">
        <MealPlanner />
      </main>
    </div>
  );
}
