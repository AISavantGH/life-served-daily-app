"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart, Ban, Heart, Loader2, Sparkles, ShoppingCart, User, Target, Leaf, WheatOff, MilkOff, Shell, Sprout, Utensils, Lightbulb, TrendingUp } from "lucide-react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { handleGenerateMealPlan, handleGenerateShoppingList, handleGetUserProfile, handleSaveUserProfile, handleAnalyzeMealPlan } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { UserProfile } from "@/services/user-profile-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GenerateMealPlanOutput, GenerateShoppingListOutput, AnalyzeMealPlanOutput } from "@/ai/schemas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";


const dietaryRestrictions = [
    { id: "gluten-free", label: "Gluten-Free", icon: WheatOff },
    { id: "dairy-free", label: "Dairy-Free", icon: MilkOff },
    { id: "nut-allergy", label: "Nut Allergy", icon: Shell },
] as const;

const mealPreferencesList = [
    { id: "vegetarian", label: "Vegetarian", icon: Leaf },
    { id: "vegan", label: "Vegan", icon: Sprout },
    { id: "italian", label: "Italian" },
    { id: "mexican", label: "Mexican" },
    { id: "asian", label: "Asian" },
    { id: "mediterranean", label: "Mediterranean" },
    { id: "indian", label: "Indian" },
    { id: "american", label: "American" },
    { id: "african", label: "African" },
] as const;

const mealPlannerFormSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  otherDietaryRestrictions: z.string().optional(),
  mealPreferences: z.array(z.string()).optional(),
  otherMealPreference: z.string().optional(),
  favoriteIngredients: z.string().optional(),
}).refine(data => (data.dietaryRestrictions && data.dietaryRestrictions.length > 0) || (data.otherDietaryRestrictions && data.otherDietaryRestrictions.trim().length > 0) || (data.mealPreferences && data.mealPreferences.length > 0) || (data.otherMealPreference && data.otherMealPreference.trim().length > 0) || (data.favoriteIngredients && data.favoriteIngredients.trim().length > 0), {
    message: "Please select at least one preference or restriction.",
    path: ["mealPreferences"],
});


const healthGoals = [
    { id: "weight_loss", label: "Weight Management (Loss)" },
    { id: "weight_gain", label: "Weight Management (Gain)" },
    { id: "weight_maintenance", label: "Weight Management (Maintenance)" },
    { id: "general_health", label: "Improving General Health" },
    { id: "energy_levels", label: "Increasing Energy Levels" },
    { id: "diabetes_management", label: "Diabetes Management" },
    { id: "blood_pressure", label: "High Blood Pressure Management" },
    { id: "cholesterol", label: "Cholesterol Management" },
  ] as const;

const userProfileFormSchema = z.object({
  age: z.coerce.number().min(1, "Age must be a positive number."),
  gender: z.string().min(1, "Gender is required."),
  activityLevel: z.string().min(1, "Activity level is required."),
  location: z.string().optional(),
  healthGoals: z.array(z.string()).optional(),
  otherHealthGoal: z.string().optional(),
});

const analysisFormSchema = z.object({
    feedback: z.string().min(10, "Please provide at least 10 characters of feedback."),
});

export function MealPlanner() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<GenerateMealPlanOutput | null>(null);
  const [shoppingList, setShoppingList] = useState<GenerateShoppingListOutput | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeMealPlanOutput | null>(null);
  const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const mealPlannerForm = useForm<z.infer<typeof mealPlannerFormSchema>>({
    resolver: zodResolver(mealPlannerFormSchema),
    defaultValues: {
      dietaryRestrictions: [],
      otherDietaryRestrictions: "",
      mealPreferences: [],
      otherMealPreference: "",
      favoriteIngredients: "",
    },
  });

  const userProfileForm = useForm<z.infer<typeof userProfileFormSchema>>({
    resolver: zodResolver(userProfileFormSchema),
    defaultValues: {
      age: 30,
      gender: "Female",
      activityLevel: "Moderately Active",
      location: "",
      healthGoals: ["general_health"],
      otherHealthGoal: "",
    },
  });

  const analysisForm = useForm<z.infer<typeof analysisFormSchema>>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
        feedback: "",
    },
  });

  useEffect(() => {
    async function fetchUserProfile() {
      const profile = await handleGetUserProfile();
      if (profile) {
        setUserProfile(profile);
        userProfileForm.reset({
            ...profile,
            healthGoals: profile.healthGoals || [],
            otherHealthGoal: profile.otherHealthGoal || ""
        });
      }
    }
    fetchUserProfile();
  }, [userProfileForm]);

  async function onSaveProfile(values: z.infer<typeof userProfileFormSchema>) {
    setIsProfileSaving(true);
    await handleSaveUserProfile(values);
    setUserProfile(values);
    setIsProfileSaving(false);
    toast({
      title: "Profile Saved!",
      description: "Your health information has been updated.",
    });
  }

  async function onGenerateMealPlan(values: z.infer<typeof mealPlannerFormSchema>) {
    setIsMealPlanLoading(true);
    setMealPlan(null);
    setShoppingList(null);
    setAnalysis(null);
    setCheckedItems({});
    
    const combinedDietaryRestrictions = [
      ...(values.dietaryRestrictions || []),
      values.otherDietaryRestrictions,
    ]
      .filter(Boolean)
      .join(", ");


    const result = await handleGenerateMealPlan({ 
        dietaryRestrictions: combinedDietaryRestrictions,
        mealPreferences: values.mealPreferences,
        otherMealPreference: values.otherMealPreference,
        favoriteIngredients: values.favoriteIngredients,
        userProfile: userProfile ?? undefined 
    });

    setIsMealPlanLoading(false);

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

  async function onGenerateShoppingList() {
    if (!mealPlan) return;

    setIsShoppingListLoading(true);
    setShoppingList(null);
    setCheckedItems({});

    const result = await handleGenerateShoppingList({ mealPlan });
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

  async function onAnalyzeMealPlan(values: z.infer<typeof analysisFormSchema>) {
    if (!mealPlan) return;
    setIsAnalysisLoading(true);
    setAnalysis(null);

    const result = await handleAnalyzeMealPlan({
        mealPlan,
        userFeedback: values.feedback,
        userProfile: userProfile ?? undefined,
    });
    setIsAnalysisLoading(false);
    setIsAnalysisDialogOpen(false);
    analysisForm.reset();


    if (result.success && result.data) {
        setAnalysis(result.data);
        toast({
            title: "Analysis Complete!",
            description: "Here are some insights on your meal plan.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Analysis Failed.",
            description: result.error || "There was a problem analyzing your meal plan.",
        });
    }
  }

  const handleCheckItem = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };
  
  const cleanupMarkdown = (text: string) => {
    return text.replace(/\*\*/g, '').replace(/ \*/g, '').replace(/\*/g, '').replace(/•/g, '').trim();
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <Card>
        <Tabs defaultValue="meal-plan">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="meal-plan" className="text-base"><Utensils className="mr-2" />Meal Planner</TabsTrigger>
            <TabsTrigger value="profile" className="text-base"><User className="mr-2"/>User Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="meal-plan">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Craft Your Perfect Meal Plan</CardTitle>
              <CardDescription className="text-base">
                Your tastes, your needs, your week. Let&apos;s get cooking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...mealPlannerForm}>
                <form onSubmit={mealPlannerForm.handleSubmit(onGenerateMealPlan)} className="space-y-8">
                <FormField
                    control={mealPlannerForm.control}
                    name="mealPreferences"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="flex items-center gap-2 text-xl font-semibold">
                                    <Heart className="h-6 w-6 text-primary" />
                                    Meal Preferences
                                </FormLabel>
                                <FormDescription className="mt-1 text-base">
                                    Help us understand what you love to eat. Select your dietary profile and preferred cuisines.
                                </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {mealPreferencesList.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={mealPlannerForm.control}
                                        name="mealPreferences"
                                        render={({ field }) => {
                                            const Icon = item.icon;
                                            return (
                                                <FormItem
                                                    key={item.id}
                                                    className="flex flex-row items-center space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), item.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== item.id
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal flex items-center gap-2 text-base">
                                                      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                                                      {item.label}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={mealPlannerForm.control}
                    name="otherMealPreference"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base">Other Preferred Cuisines</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Nigerian, Ethiopian, Moroccan" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={mealPlannerForm.control}
                    name="favoriteIngredients"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base">Favorite Ingredients</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Tomatoes, Basil, Chicken" {...field} />
                            </FormControl>
                            <FormDescription>
                                List some ingredients you'd love for us to include.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                  <Separator />
                  <FormField
                    control={mealPlannerForm.control}
                    name="dietaryRestrictions"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                            <FormLabel className="flex items-center gap-2 text-xl font-semibold">
                                <Ban className="h-6 w-6 text-destructive" />
                                Allergies & Intolerances
                            </FormLabel>
                            <FormDescription className="mt-1 text-base">
                                Let us know what to avoid. Select all that apply.
                            </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {dietaryRestrictions.map((item) => (
                            <FormField
                              key={item.id}
                              control={mealPlannerForm.control}
                              name="dietaryRestrictions"
                              render={({ field }) => {
                                const Icon = item.icon;
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center gap-2 text-base">
                                      <Icon className="h-5 w-5 text-muted-foreground" />
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={mealPlannerForm.control}
                    name="otherDietaryRestrictions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base">Other Allergies or Intolerances</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., soy, shellfish, mustard" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                  <Button type="submit" size="lg" disabled={isMealPlanLoading || !mealPlannerForm.formState.isValid} className="w-full text-lg">
                    {isMealPlanLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Your Plan...
                      </>
                    ) : (
                       <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate My Meal Plan
                       </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </TabsContent>
          <TabsContent value="profile">
            <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3 font-headline">Your Health Profile</CardTitle>
                <CardDescription className="text-base">
                    This information helps us create a highly personalized and effective meal plan for you.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...userProfileForm}>
                    <form onSubmit={userProfileForm.handleSubmit(onSaveProfile)} className="space-y-8">
                        <div>
                            <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2"><User /> Personal Details</h3>
                            <div className="space-y-4">
                                <FormField control={userProfileForm.control} name="age" render={({ field }) => (
                                    <FormItem><FormLabel className="text-base">Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={userProfileForm.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Gender</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select your gender" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={userProfileForm.control} name="activityLevel" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Activity Level</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select your activity level" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Sedentary">Sedentary (e.g., desk job, little to no exercise)</SelectItem>
                                                <SelectItem value="Lightly Active">Lightly Active (e.g., light exercise/sports 1-3 days/week, walks)</SelectItem>
                                                <SelectItem value="Moderately Active">Moderately Active (e.g., moderate exercise/sports 3-5 days/week)</SelectItem>
                                                <SelectItem value="Very Active">Very Active (e.g., hard exercise/sports 6-7 days a week)</SelectItem>
                                                <SelectItem value="Super Active">Super Active (e.g., very hard exercise & a physical job)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={userProfileForm.control} name="location" render={({ field }) => (
                                    <FormItem><FormLabel className="text-base">Location (e.g., Nigeria, Italy)</FormLabel><FormControl><Input placeholder="Suggests locally available ingredients" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                        <Separator />
                        <div>
                        <h3 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2"><Target className="h-6 w-6" />Health Goals</h3>
                            <FormField
                                control={userProfileForm.control}
                                name="healthGoals"
                                render={() => (
                                    <FormItem>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {healthGoals.map((item) => (
                                        <FormField
                                            key={item.id}
                                            control={userProfileForm.control}
                                            name="healthGoals"
                                            render={({ field }) => {
                                            return (
                                                <FormItem
                                                key={item.id}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                <FormControl>
                                                    <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                        ? field.onChange([...(field.value || []), item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                                (value) => value !== item.id
                                                            )
                                                            )
                                                    }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal text-base">
                                                    {item.label}
                                                </FormLabel>
                                                </FormItem>
                                            )
                                            }}
                                        />
                                        ))}
                                    </div>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={userProfileForm.control}
                                name="otherHealthGoal"
                                render={({ field }) => (
                                    <FormItem className="mt-4">
                                        <FormLabel className="text-base">Other Health Goal</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Improve Gut Health, Reduce Inflammation" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <Button type="submit" size="lg" disabled={isProfileSaving} className="w-full text-lg">
                            {isProfileSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving Profile...</> : 'Save Profile'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {isMealPlanLoading && (
        <Card className="w-full">
            <CardHeader>
                <div className="h-8 w-3/4 rounded-md bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="h-4 w-1/4 rounded-md bg-muted animate-pulse" />
                    <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
                    <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
                </div>
                 <div className="space-y-2">
                    <div className="h-6 w-1/3 rounded-md bg-muted animate-pulse" />
                    <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
                </div>
            </CardContent>
        </Card>
      )}

      {mealPlan && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">{mealPlan.title}</CardTitle>
            <CardDescription className="text-base">
              {mealPlan.summary}
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-semibold text-primary mb-2">Nutritional Targets</h3>
                    <div className="text-base text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: cleanupMarkdown(mealPlan.nutritionalTargets).replace(/\n/g, '<br />') }} />
                </div>
                <Separator />
                <div>
                    <h3 className="text-2xl font-semibold text-primary mb-2">Your 7-Day Plan</h3>
                     <Accordion type="single" collapsible className="w-full" defaultValue={mealPlan.mealPlan[0]?.day}>
                        {mealPlan.mealPlan.map(plan => (
                            <AccordionItem value={plan.day} key={plan.day}>
                            <AccordionTrigger className="text-xl font-semibold hover:no-underline">{plan.day}</AccordionTrigger>
                            <AccordionContent className="pl-2 space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/6">Time</TableHead>
                                            <TableHead className="w-3/6">Menu</TableHead>
                                            <TableHead className="text-right">Calories</TableHead>
                                            <TableHead className="text-right">Protein (g)</TableHead>
                                            <TableHead className="text-right">Carbs (g)</TableHead>
                                            <TableHead className="text-right">Fat (g)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plan.meals.map(meal => (
                                            <TableRow key={meal.time}>
                                                <TableCell className="font-medium">{meal.time}</TableCell>
                                                <TableCell className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: cleanupMarkdown(meal.menuItems).replace(/\n/g, '<br />') }} />
                                                <TableCell className="text-right">{meal.calories}</TableCell>
                                                <TableCell className="text-right">{meal.protein}</TableCell>
                                                <TableCell className="text-right">{meal.carbs}</TableCell>
                                                <TableCell className="text-right">{meal.fat}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={2} className="font-bold">Totals</TableCell>
                                            <TableCell className="text-right font-bold">{plan.totals.calories}</TableCell>
                                            <TableCell className="text-right font-bold">{plan.totals.protein}</TableCell>
                                            <TableCell className="text-right font-bold">{plan.totals.carbs}</TableCell>
                                            <TableCell className="text-right font-bold">{plan.totals.fat}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <h4 className="font-semibold mb-1 text-primary">Daily Rationale</h4>
                                    <p className="text-sm text-muted-foreground">{plan.dailyRationale}</p>
                                </div>
                            </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
             </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 p-6">
             <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" size="lg" className="w-full text-lg">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Analyze My Meal Plan
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Analyze Your Plan</DialogTitle>
                        <DialogDescription>
                            How has this past week been? Provide some feedback so we can suggest improvements.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...analysisForm}>
                        <form onSubmit={analysisForm.handleSubmit(onAnalyzeMealPlan)} className="space-y-4">
                            <FormField
                                control={analysisForm.control}
                                name="feedback"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Feedback</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="e.g., I felt low on energy in the afternoons, the dinners were hard to cook, I was still hungry..."
                                                rows={5}
                                                {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isAnalysisLoading}>
                                    {isAnalysisLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        "Get Suggestions"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Button onClick={onGenerateShoppingList} size="lg" disabled={isShoppingListLoading} className="w-full text-lg">
                {isShoppingListLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Shopping List...
                    </>
                ) : (
                    <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Generate Shopping List
                    </>
                )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Enjoy your meals! You can generate a new plan anytime.</p>
          </CardFooter>
        </Card>
      )}

      {isAnalysisLoading && (
        <Card className="w-full animate-pulse">
          <CardHeader>
            <div className="h-8 w-1/2 rounded-md bg-muted" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full rounded-md bg-muted" />
            <div className="h-4 w-5/6 rounded-md bg-muted" />
            <div className="h-24 w-full rounded-md bg-muted" />
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3 font-headline"><Lightbulb /> Meal Plan Analysis</CardTitle>
                <CardDescription>
                    {analysis.analysis}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-primary">Actionable Suggestions</h3>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        {analysis.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                </div>
                <Separator />
                <div>
                    <h3 className="text-xl font-semibold mb-1 text-primary">Nutritional Consistency</h3>
                    <div className="flex items-center gap-4">
                        <Progress value={analysis.consistencyScore} className="w-1/2" />
                        <span className="text-lg font-bold">{analysis.consistencyScore}/100</span>
                    </div>
                     <p className="text-sm text-muted-foreground mt-2">{analysis.consistencyRationale}</p>
                    <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mealPlan?.mealPlan.map(p => p.totals)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" tickFormatter={(value, index) => mealPlan?.mealPlan[index].day.substring(0,3) ?? ''} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="calories" fill="var(--color-chart-1)" />
                                <Bar dataKey="protein" fill="var(--color-chart-2)" />
                                <Bar dataKey="carbs" fill="var(--color-chart-3)" />
                                <Bar dataKey="fat" fill="var(--color-chart-4)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      {isShoppingListLoading && (
        <Card className="w-full animate-pulse">
            <CardHeader>
                <div className="h-8 w-3/4 rounded-md bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-5/6 rounded-md bg-muted" />
                <div className="h-4 w-full rounded-md bg-muted" />
            </CardContent>
        </Card>
      )}

      {shoppingList && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3 font-headline"><ShoppingCart/> Your Shopping List</CardTitle>
            <CardDescription className="text-base">
              Here&apos;s everything you need for your week of delicious meals. Check them off as you shop!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {shoppingList.shoppingList.map((category) => (
              <div key={category.category}>
                <h3 className="text-xl font-semibold mb-3 border-b pb-2">{category.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {category.items.map((item) => (
                    <div key={item} className="flex items-center space-x-3">
                      <Checkbox
                        id={item}
                        checked={checkedItems[item] || false}
                        onCheckedChange={() => handleCheckItem(item)}
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={item}
                        className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${checkedItems[item] ? 'line-through text-muted-foreground' : ''}`}
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
