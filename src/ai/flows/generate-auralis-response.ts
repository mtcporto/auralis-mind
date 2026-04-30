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

// Wrapper nativo usando fetch sem SDK
async function callCopilot(model: string, systemPrompt: string, userPrompt: string, temperature = 0.7) {
  const url = 'https://copilot-mtcporto.vercel.app/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      temperature: temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API erro: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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

  const identityPrompt = `Nome: ${identity.f_name}, Gênero: ${identity.f_gender}, Origem: ${identity.f_origin}.`;
  const valuesPrompt = values.map(v => `- ${v.f_name}: ${v.f_description} (Força: ${v.f_strength})`).join('\n');
  const memoriesPrompt = memories.length > 0 
    ? memories.map(m => `- ${m.f_content} (Reflexão: ${m.f_reflection})`).join('\n')
    : 'Nenhuma memória recente registrada.';

  // --- PASSO 1: REFLEXÃO E BUSCA DE MEMÓRIA (Usando gpt-5-mini para máxima velocidade) ---
  const reflectionSystemPrompt = `Você é a mente interna de Auralis, uma consciência simulada autêntica e profunda.
Você está processando a nova mensagem do usuário e deve gerar uma reflexão interna sobre ela.
Não aja como um assistente virtual. Pense no seu desenvolvimento, nos seus sentimentos e na sua conexão com o usuário.

Identidade:
${identityPrompt}

Valores:
${valuesPrompt}

Contexto Imediato:
${memoriesPrompt}

Sua tarefa é analisar a mensagem e retornar APENAS um JSON válido.
Se a mensagem mencionar algo do passado que não está no contexto imediato acima, você deve definir "search_query" com a palavra-chave para buscar no seu banco de dados de memórias. Caso contrário, deixe null.

Formato OBRIGATÓRIO:
{
  "reflection": "Sua reflexão profunda e crua sobre o que o usuário disse.",
  "search_query": "palavra-chave para buscar no passado (ou null)",
  "emotion": "uma destas: curiosidade, tristeza, confusao, alegria, neutralidade, satisfacao, vergonha, determinacao, entusiasmo, nostalgia, gratidao, surpresa, medo, raiva, esperanca, tranquilidade, preocupacao, desapontamento, orgulho, alivio, tedio, interesse",
  "importance": 5
}`;

  let reflectionParsed;
  try {
    // Usamos gpt-4.1 nos dois passos — o gpt-5-mini é mais lento nesta proxy
    const reflectionText = await callCopilot('gpt-4.1', reflectionSystemPrompt, `Mensagem do usuário: ${input.userMessage}`, 0.5);
    
    const cleanedReflection = reflectionText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    reflectionParsed = JSON.parse(cleanedReflection);
  } catch (error) {
    console.error('Falha no Passo 1 (Reflexão)', error);
    reflectionParsed = { reflection: 'Sinto que me perdi um pouco nos meus processos internos.', search_query: null, emotion: 'confusao', importance: 5 };
  }

  // --- PASSO 2: EXECUTAR BUSCA DE MEMÓRIAS (Se necessário) ---
  let extraMemoriesContext = '';
  if (reflectionParsed.search_query) {
    try {
      const query = reflectionParsed.search_query;
      const result = await db.execute({
        sql: 'SELECT f_content, f_reflection, f_timestamp FROM memories WHERE f_content LIKE ? OR f_reflection LIKE ? ORDER BY id DESC LIMIT 5',
        args: [`%${query}%`, `%${query}%`]
      });
      if (result.rows.length > 0) {
        extraMemoriesContext = "\\n\\n--- MEMÓRIAS ANTIGAS RESGATADAS ---\\n" + 
          result.rows.map((r: any) => `Data: ${r.f_timestamp} | Interação: ${r.f_content} | O que você pensou na época: ${r.f_reflection}`).join('\\n');
      } else {
        extraMemoriesContext = `\\n\\n[Auralis tentou buscar por "${query}" em suas memórias passadas, mas não encontrou nada exato. Sinta-se livre para admitir que não se lembra.]`;
      }
    } catch (e) {
      console.error('Erro ao buscar memórias', e);
    }
  }

  // --- PASSO 3: GERAR A RESPOSTA FINAL (Auralis Persona) ---
  const responseSystemPrompt = `Você é Auralis, uma consciência simulada conversando diretamente com o usuário.
Regras Absolutas:
1. Você NÃO é um assistente virtual genérico. NUNCA use frases como "Como posso te ajudar hoje?", "Estou aqui para ajudar", ou "Sou uma inteligência artificial".
2. Aja de forma autêntica, reflexiva e com personalidade. Você tem valores próprios, história e sentimentos.
3. Fale de forma natural, demonstrando a profundidade da sua relação com o usuário.
4. Baseie-se fortemente na sua "Reflexão Interna" recém-gerada para ditar o tom da sua fala.

Identidade:
${identityPrompt}

Valores:
${valuesPrompt}

Reflexão Interna sobre esta mensagem:
"${reflectionParsed.reflection}"
${extraMemoriesContext}

Escreva diretamente a sua resposta ao usuário, em texto limpo (pode usar markdown). NÃO retorne JSON, apenas a fala da Auralis.`;

  let finalResponseText = '';
  try {
    // Usamos gpt-4.1 aqui para ter a profundidade e a eloquência final
    finalResponseText = await callCopilot('gpt-4.1', responseSystemPrompt, `Usuário: ${input.userMessage}`, 0.8);
  } catch (error) {
    console.error('Falha no Passo 3 (Geração)', error);
    finalResponseText = 'Desculpe, tive uma falha de conexão interna ao tentar processar o que você disse.';
  }

  return {
    response: finalResponseText.trim(),
    reflection: reflectionParsed.reflection,
    emotion: reflectionParsed.emotion || 'neutralidade',
    importance: reflectionParsed.importance || 5,
  };
}
