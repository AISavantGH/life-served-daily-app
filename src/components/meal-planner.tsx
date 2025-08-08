"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban, Heart, Loader2, Sparkles } from "lucide-react";

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
import { handleGenerateMealPlan } from "@/app/actions";

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

export function MealPlanner() {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietaryRestrictions: "",
      mealPreferences: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMealPlan(null);
    const result = await handleGenerateMealPlan(values);
    setIsLoading(false);

    if (result.success && result.data) {
      setMealPlan(result.data);
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
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
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

      {isLoading && (
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

      {mealPlan && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Personal Meal Plan</CardTitle>
            <CardDescription>
              Here is a week of delicious meals tailored just for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border bg-muted/50 p-4 font-code text-sm">
                {mealPlan.mealPlan}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Enjoy your meals! You can generate a new plan anytime.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
