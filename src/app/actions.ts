// src/app/actions.ts
"use server";

import { generateAuralisResponse } from "@/ai/flows/generate-auralis-response";
import { addAuralisMemory } from "@/lib/auralisAPI";
import type { AuralisMemory } from "@/types/auralis";

interface AuralisInteractionResult {
  response: string;
  reflection: string;
  emotion: string;
  importance: number;
}

export async function handleUserMessageAction(
  userInput: string
): Promise<AuralisInteractionResult | { error: string }> {
  try {
    // 1. Call the Genkit flow to get Auralis's response and thoughts
    const flowOutput = await generateAuralisResponse({ userMessage: userInput });

    if (!flowOutput || !flowOutput.response) {
      console.error("AI flow did not return a valid response:", flowOutput);
      return { error: "Auralis is currently unable to respond. Please try again later." };
    }
    
    const { response, reflection, emotion, importance } = flowOutput;

    // 2. Prepare memory data to be saved
    const memoryToSave: Omit<AuralisMemory, "id" | "f_timestamp"> = {
      f_type: "episodic",
      f_content: userInput, // The user's message that triggered this memory
      f_reflection: reflection,
      f_emotion: emotion.toLowerCase(), // As per script.js
      f_importance: importance,
    };

    // 3. Save the memory to Auralis backend
    try {
      await addAuralisMemory(memoryToSave);
    } catch (apiError) {
      console.error("Failed to save Auralis memory:", apiError);
      // Non-fatal error for the user, Auralis still responded.
      // Log this for backend debugging.
    }

    return {
      response,
      reflection,
      emotion,
      importance,
    };
  } catch (error) {
    console.error("Error in handleUserMessageAction:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
