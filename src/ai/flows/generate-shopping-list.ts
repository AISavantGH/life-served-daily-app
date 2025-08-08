'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a shopping list from a meal plan.
 *
 * - generateShoppingList - A function that generates a shopping list.
 */

import { ai } from '@/ai/genkit';
import { GenerateShoppingListInputSchema, GenerateShoppingListOutputSchema, type GenerateShoppingListInput, type GenerateShoppingListOutput } from '@/ai/schemas';

export async function generateShoppingList(input: GenerateShoppingListInput): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: { schema: GenerateShoppingListInputSchema },
  output: { schema: GenerateShoppingListOutputSchema },
  prompt: `You are a shopping list generator with affiliate marketing integration. Based on the following meal plan, create a comprehensive shopping list.

1.  **Organize by Category:** Group items by category (e.g., Produce, Dairy, Meat, Pantry, Spices, etc.) to make shopping easier.
2.  **Generate Affiliate Links:** For each item, provide a plausible affiliate link to an online grocery store (e.g., a search query link to instacart.com or amazon.com/fresh).
3.  **Exclude Pantry Staples:** Assume standard pantry items like salt, pepper, and basic cooking oils are already available and don't include them unless specified for a particular recipe.
4.  **Format Output:** Return the list as an array of objects, where each object has a "category" and an array of "items". Each item object should have a "name" and an affiliate "link".

Meal Plan:
{{{json mealPlan}}}
`,
});

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
