import { NextRequest, NextResponse } from 'next/server';
import { generateAuralisResponse } from '@/ai/flows/generate-auralis-response';
import { addAuralisMemory } from '@/lib/auralisAPI';

export async function POST(req: NextRequest) {
  try {
    const { userMessage } = await req.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 });
    }

    const flowOutput = await generateAuralisResponse({ userMessage });

    // Save memory (non-blocking — don't await, let it run in background)
    addAuralisMemory({
      type: 'episodic',
      content: userMessage,
      reflection: flowOutput.reflection || 'Nenhuma reflexão específica.',
      emotion: (flowOutput.emotion || 'neutralidade').toLowerCase(),
      importance: flowOutput.importance,
    }).catch((err: unknown) => console.error('[api/chat] Failed to save memory:', err));

    return NextResponse.json({
      response: flowOutput.response,
      reflection: flowOutput.reflection,
      emotion: flowOutput.emotion,
      importance: flowOutput.importance,
    });
  } catch (error) {
    console.error('[api/chat] Error:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro inesperado. Tente novamente.' },
      { status: 500 }
    );
  }
}
