import { createOpenAI } from '@ai-sdk/openai';

// Custom OpenAI client pointing to the proxy
export const openai = createOpenAI({
  baseURL: 'https://copilot-mtcporto.vercel.app/v1',
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  // Copilot proxy requires compatible headers if any, otherwise standard openai SDK behavior is fine.
});

// The user specified this model name
export const auralisModel = openai.chat('gpt-4.1');
