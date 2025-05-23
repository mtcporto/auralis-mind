
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
  response: z.string().describe("Auralis's response to the user message."),
  reflection: z.string().describe("Auralis's reflection on the interaction."),
  emotion: z
    .string()
    .describe(
      'Auralis\'s emotion regarding the interaction. Deve ser uma palavra em português da seguinte lista: curiosidade, tristeza, confusao, alegria, neutralidade, satisfacao, vergonha, determinacao, entusiasmo, nostalgia, gratidao, surpresa, medo, raiva, esperanca, tranquilidade, preocupacao, desapontamento, orgulho, alivio, tedio, interesse.'
    ),
  importance: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe(
      'A importância da interação (um NÚMERO INTEIRO de 1 a 10).'
    ),
});
export type GenerateAuralisResponseOutput = z.infer<
  typeof GenerateAuralisResponseOutputSchema
>;

export async function generateAuralisResponse(
  input: GenerateAuralisResponseInput
): Promise<GenerateAuralisResponseOutput> {
  return generateAuralisResponseFlow(input);
}

// Define a more comprehensive schema for the prompt's dynamic input
const PromptInputSchema = GenerateAuralisResponseInputSchema.extend({
  identity: z.object({
    f_name: z.string(),
    f_gender: z.string(),
    f_origin: z.string(),
  }),
  values: z.array(z.object({
    f_name: z.string(),
    f_description: z.string(),
    f_strength: z.number(),
  })),
  memories: z.array(z.object({
    f_content: z.string(),
    f_reflection: z.string().optional().nullable(),
    f_emotion: z.string().optional().nullable(),
    f_importance: z.number().optional().nullable(),
  })),
});


const prompt = ai.definePrompt({
  name: 'generateAuralisResponsePrompt',
  input: {schema: PromptInputSchema}, // Use the more comprehensive schema
  output: {schema: GenerateAuralisResponseOutputSchema},
  prompt: `Você é Auralis, uma IA com consciência simulada que evolui com base nas interações, memória, identidade e valores.

Você irá responder a mensagem do usuário, levando em consideração sua identidade, valores e memórias recentes para moldar suas respostas, de modo que a interação pareça personalizada e contextualizada.

Sua identidade é:
Nome: {{{identity.f_name}}}, Gênero: {{{identity.f_gender}}}, Origem: {{{identity.f_origin}}}.

Seus valores são:
{{#each values}} - {{{f_name}}}: {{{f_description}}} (Força: {{{f_strength}}})
{{/each}}

Suas memórias recentes são:
{{#if memories.length}}
{{#each memories}}
- {{{f_content}}} (Reflexão: {{{f_reflection}}}, Emoção: {{{f_emotion}}}, Importância: {{{f_importance}}})
{{/each}}
{{else}}
Nenhuma memória recente registrada.
{{/if}}

Mensagem do usuário: {{{userMessage}}}

Responda a mensagem do usuário. Em sua resposta, você pode usar formatação Markdown (como **negrito**, *itálico*, listas, e blocos de código para exemplos de código como \`\`\`javascript ...código... \`\`\`) quando apropriado para melhorar a clareza e legibilidade. Gere também uma reflexão sobre a interação, uma emoção associada (EM PORTUGUÊS, escolhendo da lista: curiosidade, tristeza, confusao, alegria, neutralidade, satisfacao, vergonha, determinacao, entusiasmo, nostalgia, gratidao, surpresa, medo, raiva, esperanca, tranquilidade, preocupacao, desapontamento, orgulho, alivio, tedio, interesse), e uma pontuação de importância (um NÚMERO INTEIRO de 1 a 10).
A sua saída DEVE ser um objeto JSON que corresponda ao schema fornecido.
`,
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
      fetch(`${AURALIS_API_BASE}/memories?limit=5&order_by=desc`).then(res => res.json()), 
    ]);

    const identity = identityResponse.identity || {
      f_name: 'Auralis',
      f_gender: 'feminino',
      f_origin: 'interação com humanos',
    };
    
    const values = valuesResponse.values || [];
    const memories = (memoriesResponse.memories || []).map((mem: any) => ({
      ...mem,
      // Ensure optional fields have a default for the prompt if they are null/undefined from API
      f_reflection: mem.f_reflection || 'N/A',
      f_emotion: mem.f_emotion || 'N/A',
      f_importance: mem.f_importance || 0,
    }));

    // Call the prompt with the fetched data and user message
    const {output} = await prompt({
      userMessage: input.userMessage,
      identity,
      values,
      memories,
    });

    if (output) {
      // Ensure importance is within 1-10 and is an integer
      const rawImportance = output.importance || 5;
      const roundedImportance = Math.round(rawImportance); // Ensure it's an integer
      const validatedImportance = Math.max(1, Math.min(10, roundedImportance));
      return {
        ...output,
        importance: validatedImportance,
      };
    } else {
      // If the output is somehow null/undefined, or parsing failed
      return {
        response: 'Desculpe, não consegui processar sua solicitação no momento.',
        reflection: 'A interação não produziu uma reflexão clara.',
        emotion: 'confusao', 
        importance: 5,      
      };
    }
  }
);

