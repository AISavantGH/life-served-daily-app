// In a real application, this would interact with a database like Firestore.
// For now, we'll use a mock in-memory store.

export interface UserProfile {
  age: number;
  gender: string;
  activityLevel: string;
  location?: string;
  healthGoals?: string[];
  otherHealthGoal?: string;
}

// Mock in-memory storage
let mockProfile: UserProfile | null = null;


export async function getUserProfile(): Promise<UserProfile | null> {
    console.log("Fetching mock user profile...");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log("Mock profile returned:", mockProfile);
    return mockProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
    console.log("Saving mock user profile:", profile);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    mockProfile = profile;
    console.log("Mock profile saved.");
}
