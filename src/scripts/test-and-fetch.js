const fs = require('fs');
const path = require('path');

const API_BASE = 'https://auralis.pythonanywhere.com/auralis/default';
const ENDPOINTS = [
  'identity',
  'values',
  'memories?limit=100', // getting more memories
  'self_concept',
  'daily_ideas'
];

async function migrateData() {
  const data = {};
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(`${API_BASE}/${ep}`);
      const json = await res.json();
      const keyName = ep.split('?')[0];
      data[keyName] = json;
      console.log(`Fetched ${keyName} successfully`);
    } catch (e) {
      console.error(`Failed to fetch ${ep}:`, e);
    }
  }
  
  fs.writeFileSync(path.join(__dirname, 'pythonanywhere_data.json'), JSON.stringify(data, null, 2));
  console.log('Saved to pythonanywhere_data.json');
}

async function testCopilotAPI() {
  const proxy = 'https://copilot-mtcporto.vercel.app/v1';
  
  console.log('\n--- Testing /v1/chat/completions ---');
  try {
    const chatRes = await fetch(`${proxy}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [{role: 'user', content: 'Say "hello world" in lowercase.'}]
      })
    });
    console.log(`Status: ${chatRes.status}`);
    const text = await chatRes.text();
    console.log(`Response: ${text.substring(0, 200)}`);
  } catch(e) { console.error('Chat error:', e.message); }

  console.log('\n--- Testing /v1/completions ---');
  try {
    const compRes = await fetch(`${proxy}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        prompt: 'Say "hello world" in lowercase.',
        max_tokens: 10
      })
    });
    console.log(`Status: ${compRes.status}`);
    const text = await compRes.text();
    console.log(`Response: ${text.substring(0, 200)}`);
  } catch(e) { console.error('Comp error:', e.message); }
}

async function run() {
  await testCopilotAPI();
  await migrateData();
}

run();
