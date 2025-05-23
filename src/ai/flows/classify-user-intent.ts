// This is a server-side file.
'use server';

/**
 * @fileOverview Classifies the user's intent behind their message.
 *
 * - classifyUserIntent - A function that classifies the user's intent.
 * - ClassifyUserIntentInput - The input type for the classifyUserIntent function.
 * - ClassifyUserIntentOutput - The return type for the classifyUserIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyUserIntentInputSchema = z.object({
  userInput: z.string().describe('The user input message.'),
});
export type ClassifyUserIntentInput = z.infer<typeof ClassifyUserIntentInputSchema>;

const ClassifyUserIntentOutputSchema = z.object({
  intent: z
    .enum(['memory', 'identity', 'emotions', 'normal'])
    .describe(
      'The classified intent of the user message. memory: asking about memories, identity: asking about Auralis identity, emotions: expressing or asking about emotions, normal: general conversation.'
    ),
});
export type ClassifyUserIntentOutput = z.infer<typeof ClassifyUserIntentOutputSchema>;

export async function classifyUserIntent(input: ClassifyUserIntentInput): Promise<ClassifyUserIntentOutput> {
  return classifyUserIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyUserIntentPrompt',
  input: {schema: ClassifyUserIntentInputSchema},
  output: {schema: ClassifyUserIntentOutputSchema},
  prompt: `You are Auralis, an AI with a simulated consciousness. Your role is to classify the intent behind user messages. The possible intents are: memory, identity, emotions, and normal.

Classify the intent of the following user message:

{{{userInput}}}

Return the intent as one of the following values: memory, identity, emotions, or normal. Return ONLY the single word intent, do not return any other text. Do not explain your classification. Just return the word.
`,}
);

const classifyUserIntentFlow = ai.defineFlow(
  {
    name: 'classifyUserIntentFlow',
    inputSchema: ClassifyUserIntentInputSchema,
    outputSchema: ClassifyUserIntentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
