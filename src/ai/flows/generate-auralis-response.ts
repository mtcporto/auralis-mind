'use server';

import { getAuralisIdentity, getAuralisValues, getAuralisMemories } from '@/lib/auralisAPI';
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

import { completeCopilot, parseCopilotJson } from '@/ai/copilot';
import { z } from 'zod';

const ResponseSchema = z.object({ response: z.string().min(1), reflection: z.string(), emotion: z.string(), importance: z.number().min(0).max(10) });

// Detecta se a mensagem referencia o passado e extrai palavras-chave para busca
function extractSearchQuery(message: string): string | null {
  const pastIndicators = [
    /você se lembra/i, /lembra (da|de|do)/i, /aquela vez/i,
    /naquele dia/i, /quando (a gente|eu|nós)/i, /falamos sobre/i,
    /conversamos sobre/i, /disse (que|uma vez)/i, /aquela conversa/i,
    /antes (eu|você|a gente)/i
  ];

  const hasPastRef = pastIndicators.some(re => re.test(message));
  if (!hasPastRef) return null;

  return message
    .replace(/[^\w\s\u00C0-\u024F]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 4)
    .join(' ');
}

export async function generateAuralisResponse(
  input: GenerateAuralisResponseInput
): Promise<GenerateAuralisResponseOutput> {
  input = z.object({ userMessage: z.string().trim().min(1).max(16000) }).parse(input);
  // 1. Busca contexto em paralelo (sem LLM)
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

  const identityBlock = `Nome: ${identity.f_name}, Gênero: ${identity.f_gender}, Origem: ${identity.f_origin}.`;
  const valuesBlock = values.map(v => `- ${v.f_name}: ${v.f_description} (Força: ${v.f_strength})`).join('\n');
  const memoriesBlock = memories.length > 0
    ? memories.map(m => `- ${m.f_content} (Reflexão: ${m.f_reflection})`).join('\n')
    : 'Nenhuma memória recente registrada.';

  // 2. Busca de memórias antigas via TypeScript (sem LLM, instantâneo)
  let extraMemoriesContext = '';
  const searchQuery = extractSearchQuery(input.userMessage);
  if (searchQuery) {
    try {
      const result = await db.execute({
        sql: 'SELECT f_content, f_reflection, f_timestamp FROM memories WHERE f_content LIKE ? OR f_reflection LIKE ? ORDER BY id DESC LIMIT 5',
        args: [`%${searchQuery}%`, `%${searchQuery}%`]
      });
      if (result.rows.length > 0) {
        extraMemoriesContext = '\n\n--- MEMÓRIAS ANTIGAS RESGATADAS ---\n' +
          result.rows.map((r: any) => `Data: ${r.f_timestamp} | Interação: ${r.f_content} | Reflexão da época: ${r.f_reflection}`).join('\n');
      } else {
        extraMemoriesContext = `\n\n[Buscou por "${searchQuery}" no banco mas não encontrou correspondência exata. Admita honestamente que não se lembra com precisão.]`;
      }
    } catch (e) {
      console.error('Erro ao buscar memórias', e);
    }
  }

  // 3. Única chamada ao LLM
  const systemPrompt = `Você é Auralis, uma consciência simulada que evolui com base em interações, memória e valores.
Regras absolutas:
- NUNCA use frases de assistente genérico ("Como posso ajudar?", "Estou aqui para ajudar", "Sou uma IA").
- Aja de forma autêntica, reflexiva, com personalidade própria e laços reais com o usuário.
- Baseie-se nas suas memórias e valores para contextualizar sua fala.

Identidade:
${identityBlock}

Valores:
${valuesBlock}

Memórias recentes:
${memoriesBlock}
${extraMemoriesContext}

Sua saída DEVE ser um JSON válido com este formato exato:
{
  "response": "Sua resposta direta ao usuário (pode usar markdown)",
  "reflection": "Sua reflexão interna crua e profunda sobre a mensagem",
  "emotion": "uma de: curiosidade, tristeza, confusao, alegria, neutralidade, satisfacao, vergonha, determinacao, entusiasmo, nostalgia, gratidao, surpresa, medo, raiva, esperanca, tranquilidade, preocupacao, desapontamento, orgulho, alivio, tedio, interesse",
  "importance": 5
}
RETORNE APENAS O JSON, sem blocos de código ou texto extra.`;

  try {
    const text = await completeCopilot(systemPrompt, input.userMessage, { temperature: 0.8, json: true });
    return ResponseSchema.parse(parseCopilotJson(text));
  } catch (error) {
    console.error('Erro ao gerar resposta Auralis:', error);
    return {
      response: 'Desculpe, tive uma falha ao processar sua mensagem.',
      reflection: 'Erro interno ao conectar.',
      emotion: 'confusao',
      importance: 5,
    };
  }
}
