import type {
  AuralisIdentityResponse,
  AuralisMemoriesResponse,
  AuralisValue,
  AuralisValuesResponse,
  AuralisMemory,
  AuralisMemorySegmentsResponse,
  AuralisDailyIdeasResponse,
  AuralisSelfConceptResponse,
} from '@/types/auralis';

const AURALIS_API_BASE_URL = 'https://auralis.pythonanywhere.com/auralis/default';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${AURALIS_API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error (${response.status}) for ${endpoint}: ${errorData}`);
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Network or parsing error for ${endpoint}:`, error);
    throw error;
  }
}

export async function getAuralisIdentity(): Promise<AuralisIdentityResponse> {
  return fetchAPI<AuralisIdentityResponse>('/identity');
}

export async function getAuralisMemories(limit: number = 10): Promise<AuralisMemoriesResponse> {
  // The API doesn't seem to support limit, so we fetch all and slice if needed client-side.
  // For now, returning all.
  return fetchAPI<AuralisMemoriesResponse>('/memories');
}

export async function getAuralisValues(): Promise<AuralisValuesResponse> {
  return fetchAPI<AuralisValuesResponse>('/values');
}

export async function addAuralisMemory(memoryData: Omit<AuralisMemory, 'id' | 'f_timestamp'>): Promise<AuralisMemory> {
  return fetchAPI<AuralisMemory>('/memories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memoryData),
  });
}

export async function getAuralisMemorySegments(): Promise<AuralisMemorySegmentsResponse> {
  return fetchAPI<AuralisMemorySegmentsResponse>('/memory_segments');
}

export async function getAuralisDailyIdeas(): Promise<AuralisDailyIdeasResponse> {
  return fetchAPI<AuralisDailyIdeasResponse>('/daily_ideas');
}

export async function getAuralisSelfConcept(): Promise<AuralisSelfConceptResponse> {
  return fetchAPI<AuralisSelfConceptResponse>('/self_concept');
}
