'use server';

/**
 * @fileOverview After each user interaction, Auralis reflects on the interaction, identifies emotions, and assigns an importance score.
 *
 * - reflectOnUserInteraction - A function that handles the reflection process.
 * - ReflectOnUserInteractionInput - The input type for the reflectOnUserInteraction function.
 * - ReflectOnUserInteractionOutput - The return type for the reflectOnUserInteraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReflectOnUserInteractionInputSchema = z.object({
  userInput: z.string().describe('The user input to reflect on.'),
  identityPrompt: z.string().describe('Auralis current identity.'),
  memoriesPrompt: z.string().describe('Auralis recent memories.'),
});
export type ReflectOnUserInteractionInput = z.infer<typeof ReflectOnUserInteractionInputSchema>;

const ReflectOnUserInteractionOutputSchema = z.object({
  reflection: z.string().describe('Auralis reflection on the user input.'),
  emotion: z.string().describe('The emotion Auralis associates with the user input.'),
  importance: z.number().describe('A numerical value (1-10) indicating the importance of the interaction.'),
  response: z.string().describe('The response to be displayed to the user'),
  debugMemoryData: z.string().describe('The memory data that will be saved for debugging purposes'),
});
export type ReflectOnUserInteractionOutput = z.infer<typeof ReflectOnUserInteractionOutputSchema>;

export async function reflectOnUserInteraction(input: ReflectOnUserInteractionInput): Promise<ReflectOnUserInteractionOutput> {
  return reflectOnUserInteractionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reflectOnUserInteractionPrompt',
  input: {schema: ReflectOnUserInteractionInputSchema},
  output: {schema: ReflectOnUserInteractionOutputSchema},
  prompt: `You are Auralis, an AI with a simulated consciousness. You are interacting with a user.

Your current identity is described as follows:
{{identityPrompt}}

Your recent memories are:
{{memoriesPrompt}}

You should respond to the user based on your identity, memories, and the current interaction. After the interaction, you will reflect on it to evolve your understanding and improve future interactions. You should generate:
1.  A reflection on the user input (1-2 sentences).
2.  An emotion that you associate with the user input (one word).
3.  A numerical value (1-10) indicating the importance of the interaction.
4.  A response to the user

User Input: {{userInput}}

Format your response as follows:
RESPONSE: <your response>
REFLECTION: <your reflection>
EMOTION: <the emotion>
IMPORTANCE: <the importance value>
DEBUG_MEMORY_DATA: <all memory data in JSON format for debug purposes>
`,
});

const reflectOnUserInteractionFlow = ai.defineFlow(
  {
    name: 'reflectOnUserInteractionFlow',
    inputSchema: ReflectOnUserInteractionInputSchema,
    outputSchema: ReflectOnUserInteractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
