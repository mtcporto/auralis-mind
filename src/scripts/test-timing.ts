import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@libsql/client';

config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function run() {
  // Test 1: DB calls (simulating what Auralis does)
  const t0 = Date.now();
  await Promise.all([
    db.execute("SELECT * FROM identity ORDER BY id DESC LIMIT 1"),
    db.execute("SELECT * FROM values_table"),
    db.execute({ sql: "SELECT * FROM memories ORDER BY id DESC LIMIT 8", args: [] }),
  ]);
  console.log(`[DB - 3 queries parallel] Time: ${Date.now() - t0}ms`);

  // Test 2: Single LLM call
  const t1 = Date.now();
  const res = await fetch('https://copilot-mtcporto.vercel.app/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy-key'}` },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0.8,
      messages: [{ role: 'user', content: 'oi tudo bem?' }]
    })
  });
  await res.json();
  console.log(`[LLM - gpt-4.1] Time: ${Date.now() - t1}ms`);

  // Test 3: Second LLM call (warm)
  const t2 = Date.now();
  const res2 = await fetch('https://copilot-mtcporto.vercel.app/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy-key'}` },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0.8,
      messages: [{ role: 'user', content: 'oi tudo bem?' }]
    })
  });
  await res2.json();
  console.log(`[LLM - gpt-4.1 again] Time: ${Date.now() - t2}ms`);
}

run().catch(console.error);
