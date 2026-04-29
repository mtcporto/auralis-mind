'use server';

import { db } from './db';
import type {
  AuralisIdentityResponse,
  AuralisMemoriesResponse,
  AuralisValue,
  AuralisValuesResponse,
  AuralisMemory,
  AuralisMemoryPostPayload,
  AuralisMemorySegmentsResponse,
  AuralisDailyIdeasResponse,
  AuralisSelfConceptResponse,
} from '@/types/auralis';

export async function getAuralisIdentity(): Promise<AuralisIdentityResponse> {
  const result = await db.execute("SELECT * FROM identity ORDER BY id DESC LIMIT 1");
  if (result.rows.length === 0) return { identity: null };
  const row = result.rows[0];
  return {
    identity: {
      id: Number(row.id),
      f_name: row.f_name as string,
      f_gender: row.f_gender as string,
      f_origin: row.f_origin as string,
    }
  };
}

interface GetMemoriesParams {
  limit?: number;
  order_by?: 'asc' | 'desc';
}

export async function getAuralisMemories(params?: GetMemoriesParams): Promise<AuralisMemoriesResponse> {
  const limit = params?.limit || 10;
  const order = params?.order_by?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  const result = await db.execute({
    sql: `SELECT * FROM memories ORDER BY id ${order} LIMIT ?`,
    args: [limit]
  });

  const memories: AuralisMemory[] = result.rows.map(row => ({
    id: Number(row.id),
    f_timestamp: row.f_timestamp as string,
    f_type: row.f_type as string,
    f_content: row.f_content as string,
    f_reflection: row.f_reflection as string,
    f_emotion: row.f_emotion as string,
    f_importance: Number(row.f_importance),
  }));

  return { memories };
}

export async function getAuralisValues(): Promise<AuralisValuesResponse> {
  const result = await db.execute("SELECT * FROM values_table");
  const values: AuralisValue[] = result.rows.map(row => ({
    id: Number(row.id),
    f_name: row.f_name as string,
    f_description: row.f_description as string,
    f_strength: Number(row.f_strength),
  }));
  return { values };
}

export async function addAuralisMemory(memoryData: AuralisMemoryPostPayload): Promise<AuralisMemory> {
  const timestamp = new Date().toISOString();
  const result = await db.execute({
    sql: `INSERT INTO memories (f_user_id, f_type, f_timestamp, f_content, f_reflection, f_emotion, f_importance) 
          VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: ['', memoryData.type, timestamp, memoryData.content, memoryData.reflection, memoryData.emotion, memoryData.importance]
  });
  
  const row = result.rows[0];
  return {
    id: Number(row.id),
    f_timestamp: row.f_timestamp as string,
    f_type: row.f_type as string,
    f_content: row.f_content as string,
    f_reflection: row.f_reflection as string,
    f_emotion: row.f_emotion as string,
    f_importance: Number(row.f_importance),
  };
}

export async function getAuralisMemorySegments(): Promise<AuralisMemorySegmentsResponse> {
  // Not implemented in turso migration as it wasn't requested in ENDPOINTS, returning empty for now
  return { memory_segments: [] };
}

export async function getAuralisDailyIdeas(): Promise<AuralisDailyIdeasResponse> {
  const result = await db.execute("SELECT * FROM daily_ideas ORDER BY id DESC");
  const daily_ideas = result.rows.map(row => ({
    id: Number(row.id),
    f_date: row.f_date as string,
    f_idea: row.f_idea as string,
  }));
  return { daily_ideas };
}

export async function getAuralisSelfConcept(): Promise<AuralisSelfConceptResponse> {
  const result = await db.execute("SELECT * FROM self_concept ORDER BY id DESC LIMIT 1");
  if (result.rows.length === 0) return { self_concept: null };
  const row = result.rows[0];
  return {
    self_concept: {
      id: Number(row.id),
      f_description: row.f_description as string,
      f_strength: Number(row.f_strength),
    }
  };
}
