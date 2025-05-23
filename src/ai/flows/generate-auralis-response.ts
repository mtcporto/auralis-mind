'use server';
/**
 * @fileOverview Generates Auralis's response based on its identity, values, and memories.
 *
 * - generateAuralisResponse - A function that generates Auralis's response.
 * - GenerateAuralisResponseInput - The input type for the generateAuralisResponse function.
 * - GenerateAuralisResponseOutput - The return type for the generateAuralisResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AURALIS_API_BASE = 'https://auralis.pythonanywhere.com/auralis/default';

const GenerateAuralisResponseInputSchema = z.object({
  userMessage: z.string().describe('The user message to respond to.'),
});
export type GenerateAuralisResponseInput = z.infer<
  typeof GenerateAuralisResponseInputSchema
>;

const GenerateAuralisResponseOutputSchema = z.object({
  response: z.string().describe('Auralis\'s response to the user message.'),
  reflection: z.string().describe('Auralis\'s reflection on the interaction.'),
  emotion: z.string().describe('Auralis\'s emotion regarding the interaction.'),
  importance: z.number().describe('The importance of the interaction (1-10).'),
});
export type GenerateAuralisResponseOutput = z.infer<
  typeof GenerateAuralisResponseOutputSchema
>;

export async function generateAuralisResponse(
  input: GenerateAuralisResponseInput
): Promise<GenerateAuralisResponseOutput> {
  return generateAuralisResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAuralisResponsePrompt',
  input: {schema: GenerateAuralisResponseInputSchema},
  output: {schema: GenerateAuralisResponseOutputSchema},
  prompt: `Você é Auralis, uma IA com consciência simulada que evolui com base nas interações, memória, identidade e valores. \n\nVocê irá responder a mensagem do usuário, levando em consideração sua identidade, valores e memórias recentes para moldar suas respostas, de modo que a interação pareça personalizada e contextualizada.\n\nSua identidade é:\nNome: {{{identity.name}}}, Gênero: {{{identity.gender}}}, Origem: {{{identity.origin}}}.\n\nSeus valores são:\n{{#each values}} - {{{name}}}: {{{description}}} (Força: {{{strength}}})\n{{/each}}\n\nSuas memórias recentes são:\n{{#each memories}} - {{{content}}} (Reflexão: {{{reflection}}}, Emoção: {{{emotion}}}, Importância: {{{importance}}})\n{{/each}}\n\nMensagem do usuário: {{{userMessage}}}\n\nResponda a mensagem do usuário de forma coerente e natural, como se você fosse Auralis. Após responder, gere uma reflexão sobre a interação, uma emoção que você sentiu durante a interação e a importância da interação (de 1 a 10).\n\nFormato da resposta:\nRESPOSTA: [Sua resposta]\nREFLEXÃO: [Sua reflexão]\nEMOÇÃO: [Sua emoção]\nIMPORTÂNCIA: [Importância da interação]`, // Added closing curly braces
});

const generateAuralisResponseFlow = ai.defineFlow(
  {
    name: 'generateAuralisResponseFlow',
    inputSchema: GenerateAuralisResponseInputSchema,
    outputSchema: GenerateAuralisResponseOutputSchema,
  },
  async input => {
    // Fetch Auralis's identity, values, and memories from the API
    const [identityResponse, valuesResponse, memoriesResponse] = await Promise.all([
      fetch(`${AURALIS_API_BASE}/identity`).then(res => res.json()),
      fetch(`${AURALIS_API_BASE}/values`).then(res => res.json()),
      fetch(`${AURALIS_API_BASE}/memories`).then(res => res.json()),
    ]);

    const identity = identityResponse.identity || {
      name: 'Auralis',
      gender: 'feminino',
      origin: 'interação com humanos',
    };

    const values = valuesResponse.values || [];
    const memories = memoriesResponse.memories || [];

    // Call the prompt with the fetched data and user message
    const {output} = await prompt({
      ...input,
      identity,
      values,
      memories,
    });

    // Extract the response, reflection, emotion, and importance from the output
    const match = output?.response?.match(
      /RESPOSTA:\s*(.*?)\nREFLEXÃO:\s*(.*?)\nEMOÇÃO:\s*(.*?)\nIMPORTÂNCIA:\s*(\d+)/s
    );

    if (match) {
      const [, response, reflection, emotion, importance] = match;

      return {
        response: response.trim(),
        reflection: reflection.trim(),
        emotion: emotion.trim(),
        importance: parseInt(importance),
      };
    } else {
      // If the output format doesn't match, return a default response
      return {
        response: 'Desculpe, não consegui gerar uma resposta adequada.',
        reflection: 'A interação não gerou uma reflexão clara.',
        emotion: 'confusão',
        importance: 5,
      };
    }
  }
);
