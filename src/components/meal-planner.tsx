"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban, Heart, Loader2, Sparkles, ShoppingCart, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { handleGenerateMealPlan, handleGenerateShoppingList } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GenerateShoppingListOutput } from "@/ai/flows/generate-shopping-list";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  dietaryRestrictions: z.string().min(1, {
    message: "Please list any dietary restrictions, or enter 'none'.",
  }),
  mealPreferences: z.string().min(1, {
    message: "Please list some meal preferences, e.g., 'Italian, spicy, chicken'.",
  }),
});

type MealPlan = {
  mealPlan: string;
};

type MealPlanDay = {
  day: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
};

export function MealPlanner() {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [parsedMealPlan, setParsedMealPlan] = useState<MealPlanDay[]>([]);
  const [shoppingList, setShoppingList] = useState<GenerateShoppingListOutput | null>(null);
  const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietaryRestrictions: "",
      mealPreferences: "",
    },
  });

  const parseMealPlan = (plan: string): MealPlanDay[] => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const planDays: MealPlanDay[] = [];
    const lines = plan.split('\n');
    let currentDayIndex = -1;
  
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) return;
  
      const dayMatch = days.find(d => trimmedLine.startsWith(d));
      if (dayMatch) {
        currentDayIndex = days.indexOf(dayMatch);
        if(!planDays[currentDayIndex]) {
          planDays[currentDayIndex] = {
            day: dayMatch,
            meals: { breakfast: '', lunch: '', dinner: '' },
          };
        }
      } else if (currentDayIndex !== -1 && planDays[currentDayIndex]) {
        if (trimmedLine.toLowerCase().startsWith('breakfast:')) {
            planDays[currentDayIndex].meals.breakfast = trimmedLine.substring('breakfast:'.length).trim();
        } else if (trimmedLine.toLowerCase().startsWith('lunch:')) {
            planDays[currentDayIndex].meals.lunch = trimmedLine.substring('lunch:'.length).trim();
        } else if (trimmedLine.toLowerCase().startsWith('dinner:')) {
            planDays[currentDayIndex].meals.dinner = trimmedLine.substring('dinner:'.length).trim();
        }
      }
    });
  
    return planDays.filter(p => p);
  };
  

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsMealPlanLoading(true);
    setMealPlan(null);
    setShoppingList(null);
    setParsedMealPlan([]);
    setCheckedItems({});
    const result = await handleGenerateMealPlan(values);
    setIsMealPlanLoading(false);

    if (result.success && result.data) {
      setMealPlan(result.data);
      setParsedMealPlan(parseMealPlan(result.data.mealPlan));
      toast({
        title: "Meal Plan Generated!",
        description: "Your delicious week awaits.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: result.error || "There was a problem generating your meal plan.",
      });
    }
  }

  async function onGenerateShoppingList() {
    if (!mealPlan) return;

    setIsShoppingListLoading(true);
    setShoppingList(null);
    setCheckedItems({});
    const result = await handleGenerateShoppingList({ mealPlan: mealPlan.mealPlan });
    setIsShoppingListLoading(false);

    if (result.success && result.data) {
        setShoppingList(result.data);
        toast({
            title: "Shopping List Ready!",
            description: "Time to hit the grocery store.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: result.error || "There was a problem generating your shopping list.",
        });
    }
  }

  const handleCheckItem = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create Your Meal Plan</CardTitle>
          <CardDescription>
            Tell us about your needs and tastes, and we&apos;ll craft a personalized meal plan for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="dietaryRestrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Ban className="h-5 w-5 text-destructive" />
                      Dietary Restrictions
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., vegetarian, gluten-free, nut allergy, none"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List any allergies or dietary choices.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mealPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Heart className="h-5 w-5 text-primary" />
                      Meal Preferences
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Italian cuisine, high-protein, quick meals, spicy food"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Tell us what you love to eat!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isMealPlanLoading} className="w-full">
                {isMealPlanLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                   <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Meal Plan
                   </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isMealPlanLoading && (
        <Card className="shadow-lg animate-pulse">
            <CardHeader>
                <div className="h-6 w-3/4 rounded-md bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-5/6 rounded-md bg-muted" />
                <div className="h-4 w-full rounded-md bg-muted" />
            </CardContent>
        </Card>
      )}

      {parsedMealPlan.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Personal Meal Plan</CardTitle>
            <CardDescription>
              Here is a week of delicious meals tailored just for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {parsedMealPlan.map(plan => (
                <AccordionItem value={plan.day} key={plan.day}>
                  <AccordionTrigger className="text-lg font-semibold">{plan.day}</AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-2">
                    <p><strong>Breakfast:</strong> {plan.meals.breakfast}</p>
                    <p><strong>Lunch:</strong> {plan.meals.lunch}</p>
                    <p><strong>Dinner:</strong> {plan.meals.dinner}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button onClick={onGenerateShoppingList} disabled={isShoppingListLoading} className="w-full">
                {isShoppingListLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Shopping List...
                    </>
                ) : (
                    <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Generate Shopping List
                    </>
                )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Enjoy your meals! You can generate a new plan anytime.</p>
          </CardFooter>
        </Card>
      )}

      {isShoppingListLoading && (
        <Card className="shadow-lg animate-pulse">
            <CardHeader>
                <div className="h-6 w-3/4 rounded-md bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-5/6 rounded-md bg-muted" />
                <div className="h-4 w-full rounded-md bg-muted" />
            </CardContent>
        </Card>
      )}

      {shoppingList && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Shopping List</CardTitle>
            <CardDescription>
              Here's everything you need for your week of meals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shoppingList.shoppingList.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-semibold mb-2">{category.category}</h3>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={checkedItems[item] || false}
                        onCheckedChange={() => handleCheckItem(item)}
                      />
                      <label
                        htmlFor={item}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${checkedItems[item] ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
