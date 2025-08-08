/**
 * @fileOverview This file contains all the Zod schemas and TypeScript types for the AI flows.
 */

import {z} from 'genkit';

// Schemas for User Profile
const UserProfileSchema = z.object({
    age: z.number().describe("User's age"),
    gender: z.string().describe("User's gender"),
    activityLevel: z.string().describe("User's activity level (e.g., Sedentary, Lightly Active, Moderately Active)"),
    location: z.string().optional().describe("User's location to suggest locally available ingredients."),
    healthGoals: z.array(z.string()).optional().describe("User's health goals (e.g., Weight Management, Increasing Energy Levels)."),
    otherHealthGoal: z.string().optional().describe("Other specific health goal provided by the user."),
});

// Schemas for Generate Meal Plan Flow
export const GenerateMealPlanInputSchema = z.object({
  dietaryRestrictions: z
    .string()
    .describe('A comma-separated list of dietary restrictions, e.g., allergies, vegetarian, gluten-free.'),
  mealPreferences: z
    .array(z.string()).optional()
    .describe('A list of preferred cuisines.'),
  otherMealPreference: z.string().optional().describe("Other specific meal preference provided by the user."),
  favoriteIngredients: z.string().optional().describe("A comma-separated list of favorite ingredients."),
  dislikedIngredients: z.string().optional().describe("A comma-separated list of ingredients to avoid."),
  userProfile: UserProfileSchema.optional().describe("The user's health profile."),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const MealItemSchema = z.object({
    time: z.string().describe("The time for the meal (e.g., 9 AM)."),
    menuItems: z.string().describe("The food items for the meal, including portion sizes. Use markdown for lists."),
    calories: z.number().describe("Estimated calories for the meal."),
    protein: z.number().describe("Estimated protein in grams for the meal."),
    carbs: z.number().describe("Estimated carbohydrates in grams for the meal."),
    fat: z.number().describe("Estimated fat in grams for the meal."),
});

const MealPlanDaySchema = z.object({
    day: z.string().describe("The day of the week (e.g., Monday)."),
    meals: z.array(MealItemSchema).describe("A list of meals and snacks for the day."),
    totals: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
    }).describe("Total nutritional information for the day."),
    dailyRationale: z.string().describe("A brief explanation of why the day's meals meet the user's goals."),
});

export const GenerateMealPlanOutputSchema = z.object({
  title: z.string().describe("A catchy title for the meal plan report."),
  summary: z.string().describe("A brief summary of the meal plan's goals and approach."),
  nutritionalTargets: z.string().describe("A description of the calorie, protein, carbohydrate, and fat targets. Use markdown for lists."),
  mealPlan: z.array(MealPlanDaySchema).describe('A detailed 7-day meal plan based on the provided dietary restrictions and preferences.'),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;


// Schemas for Generate Shopping List Flow
export const GenerateShoppingListInputSchema = z.object({
  mealPlan: GenerateMealPlanOutputSchema.describe('The structured meal plan to generate a shopping list for.'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

const ShoppingListItemSchema = z.object({
    name: z.string().describe("The name of the shopping list item."),
    link: z.string().url().optional().describe("An affiliate link to purchase the item online."),
});

const ShoppingListCategorySchema = z.object({
  category: z.string().describe("The category of the shopping list items (e.g., 'Produce', 'Dairy')."),
  items: z.array(ShoppingListItemSchema).describe("The items in this category."),
});

export const GenerateShoppingListOutputSchema = z.object({
  shoppingList: z.array(ShoppingListCategorySchema).describe('A shopping list organized by category (e.g., Produce, Dairy, Meat, Pantry).'),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

// Schemas for Analyze Meal Plan Flow
export const AnalyzeMealPlanInputSchema = z.object({
    mealPlan: GenerateMealPlanOutputSchema.describe('The meal plan to be analyzed.'),
    userFeedback: z.string().describe("The user's feedback on the meal plan."),
    userProfile: UserProfileSchema.optional().describe("The user's health profile."),
});
export type AnalyzeMealPlanInput = z.infer<typeof AnalyzeMealPlanInputSchema>;

export const AnalyzeMealPlanOutputSchema = z.object({
    analysis: z.string().describe("A brief analysis of the meal plan based on user feedback and goals."),
    suggestions: z.array(z.string()).describe("A list of actionable suggestions for the next meal plan."),
    consistencyScore: z.number().describe("A score from 0-100 indicating how consistent the daily nutritional totals are."),
    consistencyRationale: z.string().describe("A brief explanation for the consistency score."),
});
export type AnalyzeMealPlanOutput = z.infer<typeof AnalyzeMealPlanOutputSchema>;
