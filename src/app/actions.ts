
// src/app/actions.ts
"use server";

import { generateAuralisResponse } from "@/ai/flows/generate-auralis-response";
import { addAuralisMemory } from "@/lib/auralisAPI";
import type { AuralisMemoryPostPayload } from "@/types/auralis"; // Import the new payload type

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
    console.log(">>>> [actions.ts] AI Flow Output:", JSON.stringify(flowOutput, null, 2));

    if (!flowOutput || !flowOutput.response) {
      console.error("AI flow did not return a valid response:", flowOutput);
      return { error: "Auralis is currently unable to respond. Please try again later." };
    }
    
    const { response, reflection, emotion, importance } = flowOutput;

    // 2. Prepare memory data to be saved, mapping to non-prefixed keys for the API
    const memoryToSave: AuralisMemoryPostPayload = {
      type: "episodic", // Corresponds to f_type
      content: userInput, // Corresponds to f_content
      reflection: reflection || "Nenhuma reflexão específica.", // Corresponds to f_reflection
      emotion: (emotion || "neutralidade").toLowerCase(), // Corresponds to f_emotion
      importance: importance, // Corresponds to f_importance (already validated as integer)
    };

    console.log(">>>> [actions.ts] Memory to Save to API (non-prefixed keys):", JSON.stringify(memoryToSave, null, 2));

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
