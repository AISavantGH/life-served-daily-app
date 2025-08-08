"use server";

import { generateMealPlan, GenerateMealPlanInput } from "@/ai/flows/generate-meal-plan";

export async function handleGenerateMealPlan(input: GenerateMealPlanInput) {
  try {
    const result = await generateMealPlan(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
