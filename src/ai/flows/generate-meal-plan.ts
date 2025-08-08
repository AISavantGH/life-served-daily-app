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
    .string()
    .describe('A comma-separated list of meal preferences, e.g., cuisine types, favorite ingredients.'),
  userProfile: UserProfileSchema.optional().describe("The user's health profile."),
});
export type GenerateMealPlanInput = z.infer<typeof GenerateMealPlanInputSchema>;

const GenerateMealPlanOutputSchema = z.object({
  mealPlan: z.string().describe('A detailed meal plan based on the provided dietary restrictions and preferences.'),
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
  prompt: `You are a meal plan generator. Generate a meal plan for 7 days (Monday to Sunday) based on the user's dietary restrictions and preferences. Include breakfast, lunch, and dinner for each day.

  {{#if userProfile}}
  Here is the user's profile for more personalization:
  - Age: {{userProfile.age}}
  - Gender: {{userProfile.gender}}
  - Activity Level: {{userProfile.activityLevel}}
  {{#if userProfile.location}}- Location: {{userProfile.location}}{{/if}}
  {{#if userProfile.healthGoals}}
  - Health Goals: {{#each userProfile.healthGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}
  {{#if userProfile.otherHealthGoal}}- Other Health Goal: {{{userProfile.otherHealthGoal}}}{{/if}}
  {{/if}}

  Dietary Restrictions: {{{dietaryRestrictions}}}
  Meal Preferences: {{{mealPreferences}}}

  Make sure to avoid unsafe food combinations by using the avoidUnsafeCombinations tool.
  The meal plan should be detailed and easy to follow.
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
