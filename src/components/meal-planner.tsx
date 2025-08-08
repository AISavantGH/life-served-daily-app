"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban, Heart, Loader2, Sparkles, ShoppingCart, Check, User, Target, Leaf, WheatOff, MilkOff, Shell, Vegan, Utensils } from "lucide-react";

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
import { handleGenerateMealPlan, handleGenerateShoppingList } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GenerateShoppingListOutput } from "@/ai/flows/generate-shopping-list";
import { Checkbox } from "@/components/ui/checkbox";
import { getUserProfile, saveUserProfile, UserProfile } from "@/services/user-profile-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const dietaryRestrictions = [
    { id: "vegetarian", label: "Vegetarian", icon: Leaf },
    { id: "vegan", label: "Vegan", icon: Vegan },
    { id: "gluten-free", label: "Gluten-Free", icon: WheatOff },
    { id: "dairy-free", label: "Dairy-Free", icon: MilkOff },
    { id: "nut-allergy", label: "Nut Allergy", icon: Shell },
] as const;

const mealPreferencesList = [
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
}).refine(data => (data.dietaryRestrictions && data.dietaryRestrictions.length > 0) || (data.otherDietaryRestrictions && data.otherDietaryRestrictions.trim().length > 0), {
    message: "Please select at least one dietary restriction or specify other allergies/intolerances.",
    path: ["dietaryRestrictions"],
}).refine(data => (data.mealPreferences && data.mealPreferences.length > 0) || (data.otherMealPreference && data.otherMealPreference.trim().length > 0) || (data.favoriteIngredients && data.favoriteIngredients.trim().length > 0), {
    message: "Please select at least one meal preference or specify other preferences/ingredients.",
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [parsedMealPlan, setParsedMealPlan] = useState<MealPlanDay[]>([]);
  const [shoppingList, setShoppingList] = useState<GenerateShoppingListOutput | null>(null);
  const [isMealPlanLoading, setIsMealPlanLoading] = useState(false);
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
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

  useEffect(() => {
    async function fetchUserProfile() {
      const profile = await getUserProfile();
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
  
  async function onSaveProfile(values: z.infer<typeof userProfileFormSchema>) {
    setIsProfileSaving(true);
    await saveUserProfile(values);
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
    setParsedMealPlan([]);
    setCheckedItems({});
    
    const combinedDietaryRestrictions = [
      ...(values.dietaryRestrictions || []),
      values.otherDietaryRestrictions,
    ]
      .filter(Boolean)
      .join(", ");

    if (!combinedDietaryRestrictions) {
        mealPlannerForm.setError("dietaryRestrictions", { type: "manual", message: "Please specify at least one dietary restriction." });
        setIsMealPlanLoading(false);
        return;
    }


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
        <Tabs defaultValue="meal-plan">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meal-plan">Meal Planner</TabsTrigger>
            <TabsTrigger value="profile">User Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="meal-plan">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Create Your Meal Plan</CardTitle>
              <CardDescription>
                Tell us about your needs and tastes, and we&apos;ll craft a personalized meal plan for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...mealPlannerForm}>
                <form onSubmit={mealPlannerForm.handleSubmit(onGenerateMealPlan)} className="space-y-6">
                <FormField
                    control={mealPlannerForm.control}
                    name="dietaryRestrictions"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                            <FormLabel className="flex items-center gap-2 text-base font-semibold">
                                <Ban className="h-5 w-5 text-destructive" />
                                Dietary Restrictions
                            </FormLabel>
                            <FormDescription className="mt-1">
                                Select any that apply to you.
                            </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                                    <FormLabel className="font-normal flex items-center gap-2">
                                      <Icon className="h-4 w-4 text-muted-foreground" />
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
                            <FormLabel>Other Allergies/Intolerances:</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., soy, shellfish" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                  <FormField
                    control={mealPlannerForm.control}
                    name="mealPreferences"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                                    <Heart className="h-5 w-5 text-primary" />
                                    Meal Preferences
                                </FormLabel>
                                <FormDescription className="mt-1">
                                    Select your favorite cuisines.
                                </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {mealPreferencesList.map((item) => (
                                    <FormField
                                        key={item.id}
                                        control={mealPlannerForm.control}
                                        name="mealPreferences"
                                        render={({ field }) => {
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
                                                    <FormLabel className="font-normal flex items-center gap-2">
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
                            <FormLabel>Other Meal Preference (e.g., Nigerian meal plan):</FormLabel>
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
                            <FormLabel>Favorite Ingredients:</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Tomatoes, Basil, Chicken" {...field} />
                            </FormControl>
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
          </TabsContent>
          <TabsContent value="profile">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">Your Health Profile 🍎</CardTitle>
                <CardDescription>
                    Provide your details to help us create a more personalized meal plan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...userProfileForm}>
                    <form onSubmit={userProfileForm.handleSubmit(onSaveProfile)} className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-primary mb-2">Personal Details</h3>
                            <div className="space-y-4">
                                <FormField control={userProfileForm.control} name="age" render={({ field }) => (
                                    <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={userProfileForm.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
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
                                        <FormLabel>Activity Level</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select your activity level" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Sedentary">Sedentary (little or no exercise)</SelectItem>
                                                <SelectItem value="Lightly Active">Lightly Active (light exercise/sports 1-3 days/week)</SelectItem>
                                                <SelectItem value="Moderately Active">Moderately Active (moderate exercise/sports 3-5 days/week)</SelectItem>
                                                <SelectItem value="Very Active">Very Active (hard exercise/sports 6-7 days a week)</SelectItem>
                                                <SelectItem value="Super Active">Super Active (very hard exercise/sports & a physical job)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={userProfileForm.control} name="location" render={({ field }) => (
                                    <FormItem><FormLabel>Location (e.g., Nigeria, Italy):</FormLabel><FormControl><Input placeholder="e.g., Nigeria, Italy, Mexico" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                        <div>
                        <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">Health Goals <Target className="h-5 w-5" /></h3>
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
                                                <FormLabel className="font-normal">
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
                                        <FormLabel>Other Health Goal:</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Improve Gut Health, Reduce Inflammation" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <Button type="submit" disabled={isProfileSaving} className="w-full">
                            {isProfileSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Profile'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
          </TabsContent>
        </Tabs>
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
