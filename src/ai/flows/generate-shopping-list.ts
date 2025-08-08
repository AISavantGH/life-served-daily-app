'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a shopping list from a meal plan.
 *
 * - generateShoppingList - A function that generates a shopping list.
 * - GenerateShoppingListInput - The input type for the generateShoppingList function.
 * - GenerateShoppingListOutput - The return type for the generateShoppingList function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateShoppingListInputSchema = z.object({
  mealPlan: z.string().describe('The meal plan to generate a shopping list for.'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

const ShoppingListCategorySchema = z.object({
  category: z.string().describe("The category of the shopping list items (e.g., 'Produce', 'Dairy')."),
  items: z.array(z.string()).describe("The items in this category."),
});

const GenerateShoppingListOutputSchema = z.object({
  shoppingList: z.array(ShoppingListCategorySchema).describe('A shopping list organized by category (e.g., Produce, Dairy, Meat, Pantry).'),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

export async function generateShoppingList(input: GenerateShoppingListInput): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: { schema: GenerateShoppingListInputSchema },
  output: { schema: GenerateShoppingListOutputSchema },
  prompt: `You are a shopping list generator. Based on the following meal plan, create a comprehensive shopping list.
Organize the list by category (e.g., Produce, Dairy, Meat, Pantry, Spices, etc.) to make shopping easier.
Assume standard pantry items like salt, pepper, and basic cooking oils are already available and don't include them unless specified for a particular recipe.
Return the shopping list as an array of objects, where each object has a "category" and an array of "items".

Meal Plan:
{{{mealPlan}}}
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
