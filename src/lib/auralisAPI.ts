
import type {
  AuralisIdentityResponse,
  AuralisMemoriesResponse,
  AuralisValue,
  AuralisValuesResponse,
  AuralisMemory,
  AuralisMemoryPostPayload, // Import the new type
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
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText} - ${errorData}`);
    }
    if (response.status === 204) { // No Content
      return {} as T; // Or handle as appropriate for your types
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

interface GetMemoriesParams {
  limit?: number;
  order_by?: 'asc' | 'desc';
  // Add other query parameters if the API supports them
}

export async function getAuralisMemories(params?: GetMemoriesParams): Promise<AuralisMemoriesResponse> {
  let endpoint = '/memories';
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.order_by) {
      queryParams.append('order_by', params.order_by);
    }
    // Add other params here
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
  }
  return fetchAPI<AuralisMemoriesResponse>(endpoint);
}


export async function getAuralisValues(): Promise<AuralisValuesResponse> {
  return fetchAPI<AuralisValuesResponse>('/values');
}

// Update the function to accept AuralisMemoryPostPayload
export async function addAuralisMemory(memoryData: AuralisMemoryPostPayload): Promise<AuralisMemory> { // Return type might still be AuralisMemory if API returns the created object with f_ prefixes
  return fetchAPI<AuralisMemory>('/memories', { // Assuming API returns the full memory object (with f_ prefixes) after creation
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(memoryData), // memoryData now has non-prefixed keys
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
