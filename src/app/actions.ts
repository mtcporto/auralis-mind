
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
      return { error: "Auralis não consegue responder no momento. Por favor, tente novamente mais tarde." };
    }
    
    const { response, reflection, emotion, importance } = flowOutput;

    // 2. Prepare memory data to be saved, using non-prefixed keys for the API POST payload
    const memoryToSave: AuralisMemoryPostPayload = {
      type: "episodic", 
      content: userInput, 
      reflection: reflection || "Nenhuma reflexão específica.", 
      emotion: (emotion || "neutralidade").toLowerCase(), 
      importance: importance, 
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
    return { error: "Ocorreu um erro inesperado. Por favor, tente novamente." };
  }
}
