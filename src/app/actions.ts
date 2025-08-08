"use server";

import { generateMealPlan, GenerateMealPlanInput, GenerateMealPlanOutput } from "@/ai/flows/generate-meal-plan";
import { generateShoppingList, GenerateShoppingListInput, GenerateShoppingListOutput } from "@/ai/flows/generate-shopping-list";

export async function handleGenerateMealPlan(input: GenerateMealPlanInput): Promise<{ success: boolean; data?: GenerateMealPlanOutput; error?: string; }> {
  try {
    const result = await generateMealPlan(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function handleGenerateShoppingList(input: GenerateShoppingListInput): Promise<{ success: boolean; data?: GenerateShoppingListOutput; error?: string; }> {
    try {
      const result = await generateShoppingList(input);
      return { success: true, data: result };
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      return { success: false, error: errorMessage };
    }
  }
