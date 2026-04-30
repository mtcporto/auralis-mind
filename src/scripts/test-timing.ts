import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

async function testDirect() {
  const url = 'https://copilot-mtcporto.vercel.app/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';
  
  const startTime = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0.7,
      messages: [
        { role: 'user', content: 'Oi, tudo bem?' }
      ]
    })
  });
  
  const text = await response.text();
  const endTime = Date.now();
  
  console.log(`[Direct Fetch] Time: ${endTime - startTime}ms`);
}

async function testAgentSteps() {
  const url = 'https://copilot-mtcporto.vercel.app/v1/chat/completions';
  const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';
  
  // Step 1: gpt-5-mini
  const start1 = Date.now();
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      temperature: 0.5,
      messages: [{ role: 'user', content: 'Reflection step test' }]
    })
  });
  const end1 = Date.now();
  console.log(`[Step 1 - gpt-5-mini] Time: ${end1 - start1}ms`);

  // Step 3: gpt-4.1
  const start3 = Date.now();
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0.8,
      messages: [{ role: 'user', content: 'Final response test' }]
    })
  });
  const end3 = Date.now();
  console.log(`[Step 3 - gpt-4.1] Time: ${end3 - start3}ms`);
}

async function run() {
  console.log('--- Testing Direct Call ---');
  await testDirect();
  console.log('\n--- Testing 2-Step Orchestration Call ---');
  await testAgentSteps();
}

run();
