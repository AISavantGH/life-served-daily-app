'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing a meal plan based on user feedback.
 *
 * - analyzeMealPlan - A function that analyzes a meal plan and provides suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AnalyzeMealPlanInputSchema, AnalyzeMealPlanOutputSchema, type AnalyzeMealPlanInput, type AnalyzeMealPlanOutput } from '@/ai/schemas';

export async function analyzeMealPlan(input: AnalyzeMealPlanInput): Promise<AnalyzeMealPlanOutput> {
    return analyzeMealPlanFlow(input);
}

const prompt = ai.definePrompt({
    name: 'analyzeMealPlanPrompt',
    input: { schema: AnalyzeMealPlanInputSchema },
    output: { schema: AnalyzeMealPlanOutputSchema },
    prompt: `You are an expert nutritionist and health coach. Analyze the provided 7-day meal plan and the user's feedback on it.

    **Meal Plan:**
    {{{json mealPlan}}}

    **User Feedback:**
    "{{{userFeedback}}}"

    **User Profile:**
    {{#if userProfile}}
    - Age: {{userProfile.age}}
    - Gender: {{userProfile.gender}}
    - Activity Level: {{userProfile.activityLevel}}
    - Health Goals: {{#if userProfile.healthGoals}}{{#each userProfile.healthGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}{{#if userProfile.otherHealthGoal}}, {{{userProfile.otherHealthGoal}}}{{/if}}
    {{else}}
    No specific user profile provided.
    {{/if}}

    **Instructions:**
    1.  **Analyze Feedback:** Carefully consider the user's feedback in the context of their profile and the provided meal plan.
    2.  **Provide Overall Analysis:** Write a brief, encouraging, and insightful analysis of the meal plan's alignment with the user's goals and feedback.
    3.  **Generate Actionable Suggestions:** Create a list of 3-5 clear, concise, and actionable suggestions for how the user could adjust their next meal plan. Frame these as positive changes.
    4.  **Nutritional Consistency Score:** Based on the meal plan's daily totals, calculate a "Nutritional Consistency Score" out of 100. A high score means the daily totals for calories, protein, etc., are very consistent day-to-day. A low score means they fluctuate a lot. Provide a brief explanation for the score.
    5.  **Return in JSON format:** Your response must be in the specified JSON format.
    `,
});

const analyzeMealPlanFlow = ai.defineFlow(
    {
        name: 'analyzeMealPlanFlow',
        inputSchema: AnalyzeMealPlanInputSchema,
        outputSchema: AnalyzeMealPlanOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
