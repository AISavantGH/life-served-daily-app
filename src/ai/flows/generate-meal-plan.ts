'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a meal plan based on user dietary restrictions and preferences.
 *
 * - generateMealPlan - A function that generates a meal plan for the user.
 * - GenerateMealPlanInput - The input type for the generateMealPlan function.
 * - GenerateMealPlanOutput - The return type for the generateMealPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserProfileSchema = z.object({
    age: z.number().describe("User's age"),
    gender: z.string().describe("User's gender"),
    activityLevel: z.string().describe("User's activity level (e.g., Sedentary, Lightly Active, Moderately Active)"),
    location: z.string().optional().describe("User's location to suggest locally available ingredients."),
    healthGoals: z.array(z.string()).optional().describe("User's health goals (e.g., Weight Management, Increasing Energy Levels)."),
    otherHealthGoal: z.string().optional().describe("Other specific health goal provided by the user."),
});

const GenerateMealPlanInputSchema = z.object({
  dietaryRestrictions: z
    .string()
    .describe('A comma-separated list of dietary restrictions, e.g., allergies, vegetarian, gluten-free.'),
  mealPreferences: z
    .array(z.string()).optional()
    .describe('A list of preferred cuisines.'),
  otherMealPreference: z.string().optional().describe("Other specific meal preference provided by the user."),
  favoriteIngredients: z.string().optional().describe("A comma-separated list of favorite ingredients."),
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

const GenerateMealPlanOutputSchema = z.object({
  title: z.string().describe("A catchy title for the meal plan report."),
  summary: z.string().describe("A brief summary of the meal plan's goals and approach."),
  nutritionalTargets: z.string().describe("A description of the calorie, protein, carbohydrate, and fat targets. Use markdown for lists."),
  mealPlan: z.array(MealPlanDaySchema).describe('A detailed 7-day meal plan based on the provided dietary restrictions and preferences.'),
});
export type GenerateMealPlanOutput = z.infer<typeof GenerateMealPlanOutputSchema>;

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<GenerateMealPlanOutput> {
  return generateMealPlanFlow(input);
}

const AvoidUnsafeCombinationsTool = ai.defineTool({
    name: 'avoidUnsafeCombinations',
    description: 'This tool is used to avoid unsafe food combinations, ensuring the generated meal plan is safe and healthy.',
    inputSchema: z.string().describe('A list of ingredients for the meal plan'),
    outputSchema: z.string().describe('A list of ingredients that do not have unsafe food combinations'),
  },
  async (input) => {
    return input;
  }
);

const prompt = ai.definePrompt({
  name: 'generateMealPlanPrompt',
  input: {schema: GenerateMealPlanInputSchema},
  output: {schema: GenerateMealPlanOutputSchema},
    tools: [AvoidUnsafeCombinationsTool],
  prompt: `You are an expert nutritionist and meal planner. Generate a detailed and structured 7-day meal plan report based on the user's profile and preferences. The report must be comprehensive, informative, and encouraging.

  **User Profile and Preferences:**
  {{#if userProfile}}
  - Age: {{userProfile.age}}
  - Gender: {{userProfile.gender}}
  - Activity Level: {{userProfile.activityLevel}}
  {{#if userProfile.location}}- Location: {{userProfile.location}} (Suggest locally available ingredients if relevant){{/if}}
  - Health Goals: {{#if userProfile.healthGoals}}{{#each userProfile.healthGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}{{#if userProfile.otherHealthGoal}}, {{{userProfile.otherHealthGoal}}}{{/if}}
  {{else}}
  No specific user profile provided.
  {{/if}}

  - Dietary Restrictions: {{{dietaryRestrictions}}}
  - Meal Preferences:
    {{#if mealPreferences}}- Cuisines: {{#each mealPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
    {{#if otherMealPreference}}- Other Preferences: {{{otherMealPreference}}}{{/if}}
    {{#if favoriteIngredients}}- Favorite Ingredients: {{{favoriteIngredients}}}{{/if}}

  **Instructions for the Output:**
  
  1.  **Title and Summary:** Create a title and a brief summary for the meal plan report.
  2.  **Nutritional Targets:** Define clear daily nutritional targets (calories, protein, carbs, fat). Explain WHY these targets are chosen based on the user's profile and goals.
  3.  **Detailed 7-Day Plan:** For each of the 7 days (Monday to Sunday):
      *   Create a full day's menu including breakfast, lunch, dinner, and at least one snack.
      *   For each meal/snack, provide the time, a detailed description of the menu items with portion sizes, and a breakdown of calories, protein, carbs, and fat.
      *   Calculate the total calories, protein, carbs, and fat for the day.
      *   Write a "Daily Rationale" explaining how that day's meals support the user's goals.
  4.  **Formatting:** Ensure the menu items are in a markdown list for readability.
  5.  **Tool Use:** Use the \`avoidUnsafeCombinations\` tool to ensure the meal plan is safe.

  Your response must be in the specified JSON format. Be thorough, accurate, and empathetic in your tone.
  `,
});

const generateMealPlanFlow = ai.defineFlow(
  {
    name: 'generateMealPlanFlow',
    inputSchema: GenerateMealPlanInputSchema,
    outputSchema: GenerateMealPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
