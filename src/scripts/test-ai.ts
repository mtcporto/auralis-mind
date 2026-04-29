import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

const openai = createOpenAI({
  baseURL: 'https://copilot-mtcporto.vercel.app/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

const auralisModel = openai.chat('gpt-4.1');

async function test() {
  try {
    console.log('Sending request to proxy...');
    const result = await generateText({
      model: auralisModel,
      prompt: 'oi, tudo bem?',
    });
    console.log('Success:', result.text);
  } catch (error) {
    console.error('Error occurred:');
    console.error(error);
  }
}

test();
