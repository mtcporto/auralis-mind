const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const dbUrl = process.env.TURSO_DATABASE_URL || 'libsql://auralis-mtcporto.aws-us-east-2.turso.io';
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const db = createClient({
  url: dbUrl,
  authToken: dbToken,
});

async function run() {
  console.log("Dropping existing tables (if any)...");
  try {
    await db.execute("DROP TABLE IF EXISTS identity");
    await db.execute("DROP TABLE IF EXISTS values_table");
    await db.execute("DROP TABLE IF EXISTS memories");
    await db.execute("DROP TABLE IF EXISTS self_concept");
    await db.execute("DROP TABLE IF EXISTS daily_ideas");
  } catch (e) { console.error("Drop error", e); }

  console.log("Creating tables...");
  
  await db.execute(`
    CREATE TABLE identity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      f_name TEXT,
      f_gender TEXT,
      f_origin TEXT,
      f_created_at TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE values_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      f_name TEXT,
      f_description TEXT,
      f_strength INTEGER,
      f_last_updated TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      f_user_id TEXT,
      f_type TEXT,
      f_timestamp TEXT,
      f_content TEXT,
      f_reflection TEXT,
      f_emotion TEXT,
      f_importance INTEGER
    )
  `);

  await db.execute(`
    CREATE TABLE self_concept (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      f_description TEXT,
      f_strength INTEGER,
      f_last_updated TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE daily_ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      f_date TEXT,
      f_idea TEXT
    )
  `);

  console.log("Loading data from pythonanywhere_data.json...");
  const dataPath = path.join(__dirname, 'pythonanywhere_data.json');
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (data.identity?.identity) {
      const iden = data.identity.identity;
      await db.execute({
        sql: 'INSERT INTO identity (f_name, f_gender, f_origin, f_created_at) VALUES (?, ?, ?, ?)',
        args: [iden.f_name || '', iden.f_gender || '', iden.f_origin || '', iden.f_created_at || new Date().toISOString()]
      });
    }

    if (data.values?.values) {
      for (const val of data.values.values) {
        await db.execute({
          sql: 'INSERT INTO values_table (f_name, f_description, f_strength, f_last_updated) VALUES (?, ?, ?, ?)',
          args: [val.f_name, val.f_description, val.f_strength, val.f_last_updated || new Date().toISOString()]
        });
      }
    }

    if (data.memories?.memories) {
      for (const mem of data.memories.memories) {
        await db.execute({
          sql: 'INSERT INTO memories (f_user_id, f_type, f_timestamp, f_content, f_reflection, f_emotion, f_importance) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: [mem.f_user_id || '', mem.f_type || '', mem.f_timestamp || '', mem.f_content || '', mem.f_reflection || '', mem.f_emotion || '', mem.f_importance || 0]
        });
      }
    }

    if (data.self_concept?.self_concept) {
      const sc = data.self_concept.self_concept;
      await db.execute({
        sql: 'INSERT INTO self_concept (f_description, f_strength, f_last_updated) VALUES (?, ?, ?)',
        args: [sc.f_description || '', sc.f_strength || 0, sc.f_last_updated || new Date().toISOString()]
      });
    }

    if (data.daily_ideas?.daily_ideas) {
      for (const di of data.daily_ideas.daily_ideas) {
        await db.execute({
          sql: 'INSERT INTO daily_ideas (f_date, f_idea) VALUES (?, ?)',
          args: [di.f_date || '', di.f_idea || '']
        });
      }
    }

    console.log("Data migrated successfully!");
  } else {
    console.log("No pythonanywhere_data.json found. Created empty tables.");
  }
}

run().catch(console.error);
