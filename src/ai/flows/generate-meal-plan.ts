'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a meal plan based on user dietary restrictions and preferences.
 *
 * - generateMealPlan - A function that generates a meal plan for the user.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateMealPlanInputSchema, GenerateMealPlanOutputSchema, type GenerateMealPlanInput, type GenerateMealPlanOutput } from '@/ai/schemas';

export async function generateMealPlan(input: GenerateMealPlanInput): Promise<GenerateMealPlanOutput> {
  return generateMealPlanFlow(input);
}

const AvoidUnsafeCombinationsTool = ai.defineTool({
    name: 'avoidUnsafeCombinations',
    description: 'This tool is used to avoid unsafe food combinations, ensuring the generated meal plan is safe and healthy.',
    inputSchema: z.object({
        ingredients: z.string().describe('A comma-separated list of ingredients to check for unsafe combinations.'),
    }),
    outputSchema: z.string().describe('A list of ingredients that do not have unsafe food combinations'),
  },
  async (input) => {
    return input.ingredients;
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
  {{#if userProfile.location}}- Location: {{userProfile.location}} (Prioritize suggesting locally available ingredients for this location).{{/if}}
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
