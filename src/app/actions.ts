"use server";

import { generateMealPlan } from "@/ai/flows/generate-meal-plan";
import { generateShoppingList } from "@/ai/flows/generate-shopping-list";
import { getUserProfile, saveUserProfile, UserProfile } from "@/services/user-profile-service";
import type { GenerateMealPlanInput, GenerateMealPlanOutput, GenerateShoppingListInput, GenerateShoppingListOutput } from "@/ai/schemas";

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

  export async function handleGetUserProfile(): Promise<UserProfile | null> {
    return await getUserProfile();
  }
  
  export async function handleSaveUserProfile(profile: UserProfile): Promise<void> {
    await saveUserProfile(profile);
  }
