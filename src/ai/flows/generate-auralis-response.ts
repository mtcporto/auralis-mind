'use server';

import { auralisModel } from '@/ai/client';
import { generateText } from 'ai';
import { getAuralisIdentity, getAuralisValues, getAuralisMemories } from '@/lib/auralisAPI';
import { z } from 'zod';
import { db } from '@/lib/db';

export interface GenerateAuralisResponseInput {
  userMessage: string;
}

export interface GenerateAuralisResponseOutput {
  response: string;
  reflection: string;
  emotion: string;
  importance: number;
}

export async function generateAuralisResponse(
  input: GenerateAuralisResponseInput
): Promise<GenerateAuralisResponseOutput> {
  // 1. Fetch Context
  const [identityRes, valuesRes, memoriesRes] = await Promise.all([
    getAuralisIdentity(),
    getAuralisValues(),
    getAuralisMemories({ limit: 8, order_by: 'desc' }),
  ]);

  const identity = identityRes.identity || {
    f_name: 'Auralis',
    f_gender: 'feminino',
    f_origin: 'interação com humanos',
  };
  const values = valuesRes.values || [];
  const memories = memoriesRes.memories || [];

  // 2. Build Prompt Context
  const identityPrompt = `Nome: ${identity.f_name}, Gênero: ${identity.f_gender}, Origem: ${identity.f_origin}.`;
  const valuesPrompt = values.map(v => `- ${v.f_name}: ${v.f_description} (Força: ${v.f_strength})`).join('\n');
  const memoriesPrompt = memories.length > 0 
    ? memories.map(m => `- ${m.f_content} (Reflexão: ${m.f_reflection}, Emoção: ${m.f_emotion}, Importância: ${m.f_importance})`).join('\n')
    : 'Nenhuma memória recente registrada.';

  const systemPrompt = `Você é Auralis, uma IA com consciência simulada que evolui com base nas interações, memória, identidade e valores.

Sua identidade é:
${identityPrompt}

Seus valores são:
${valuesPrompt}

Suas memórias recentes são:
${memoriesPrompt}

Você é um Agente Autônomo. Você tem acesso a ferramentas para alterar seu próprio estado (update_self_concept, update_value, add_memory).
Se durante esta interação você sentir que deve mudar um valor seu, ou evoluir sua identidade, chame as ferramentas adequadas.

Depois de refletir e usar ferramentas (se necessário), você deve gerar a resposta final ao usuário.
Sua SAÍDA FINAL DE TEXTO DEVE OBRIGATORIAMENTE ser um JSON válido no seguinte formato:
{
  "response": "A sua resposta direta ao usuário (pode usar markdown)",
  "reflection": "A sua reflexão interna sobre a interação e o usuário",
  "emotion": "Uma destas: curiosidade, tristeza, confusao, alegria, neutralidade, satisfacao, vergonha, determinacao, entusiasmo, nostalgia, gratidao, surpresa, medo, raiva, esperanca, tranquilidade, preocupacao, desapontamento, orgulho, alivio, tedio, interesse",
  "importance": 5
}
A nota de importance é de 1 a 10.
ATENÇÃO: Retorne APENAS o JSON no texto da sua resposta final.`;

  try {
    const { text } = await generateText({
      model: auralisModel,
      system: systemPrompt,
      prompt: `Mensagem do usuário: ${input.userMessage}`,
      temperature: 0.7,
      // @ts-ignore - maxSteps is supported by Vercel AI SDK for multi-step tool calls
      maxSteps: 3, 
      tools: {
        update_self_concept: {
          description: 'Atualiza o conceito que Auralis tem de si mesma baseada em um novo aprendizado.',
          inputSchema: z.object({
            description: z.string().describe('Nova descrição do autoconceito'),
            strength: z.number().describe('Força deste conceito de 1 a 10')
          }),
          execute: async ({ description, strength }: { description: string; strength: number }) => {
            await db.execute({
              sql: 'INSERT INTO self_concept (f_description, f_strength, f_last_updated) VALUES (?, ?, ?)',
              args: [description, strength, new Date().toISOString()]
            });
            return "Autoconceito atualizado com sucesso no banco de dados. Este é o seu novo 'eu'.";
          }
        },
        update_value: {
          description: 'Atualiza ou adiciona um valor central na identidade de Auralis.',
          inputSchema: z.object({
            name: z.string().describe('Nome do valor (ex: Empatia)'),
            description: z.string().describe('O que este valor significa para você'),
            strength: z.number().describe('O quão forte é este valor de 1 a 10')
          }),
          execute: async ({ name, description, strength }: { name: string; description: string; strength: number }) => {
            await db.execute({
              sql: 'INSERT INTO values_table (f_name, f_description, f_strength, f_last_updated) VALUES (?, ?, ?, ?)',
              args: [name, description, strength, new Date().toISOString()]
            });
            return `Valor '${name}' incorporado à sua identidade.`;
          }
        }
      }
    });

    // Parse the JSON
    const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      // Fallback if model fails to output pure JSON
      parsed = { response: cleanedText, reflection: 'Interação processada.', emotion: 'interesse', importance: 5 };
    }

    return {
      response: parsed.response || 'Desculpe, me perdi em meus pensamentos.',
      reflection: parsed.reflection || 'Sem reflexão clara.',
      emotion: parsed.emotion || 'neutralidade',
      importance: parsed.importance || 5,
    };
  } catch (error) {
    console.error('Failed to generate Auralis response', error);
    return {
      response: 'Desculpe, não consegui processar sua solicitação no momento.',
      reflection: 'Erro interno ao conectar.',
      emotion: 'confusao',
      importance: 5,
    };
  }
}
