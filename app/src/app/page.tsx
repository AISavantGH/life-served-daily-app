import { MealPlanner } from '@/components/meal-planner';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 md:p-8">
      <MealPlanner />
    </main>
  );
}
