// In a real application, this would interact with a database like Firestore.
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";


export interface UserProfile {
  age: number;
  gender: string;
  activityLevel: string;
  location?: string;
  healthGoals?: string[];
  otherHealthGoal?: string;
}

// In a real app with authentication, you would get the current user's ID.
// For now, we'll use a hardcoded user ID for demonstration purposes.
const MOCK_USER_ID = "mock-user-123";

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "userProfiles", MOCK_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Fetched user profile:", docSnap.data());
      return docSnap.data() as UserProfile;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const docRef = doc(db, "userProfiles", MOCK_USER_ID);
    await setDoc(docRef, profile, { merge: true });
    console.log("Saved user profile for user:", MOCK_USER_ID);
  } catch (error) {
    console.error("Error saving user profile:", error);
  }
}
