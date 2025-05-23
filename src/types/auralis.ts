
export interface AuralisIdentity {
  f_name?: string;
  f_gender?: string;
  f_origin?: string;
  // Older API might have id, name, gender, origin
  id?: number;
  name?: string;
  gender?: string;
  origin?: string;
}

export interface AuralisIdentityResponse {
  identity: AuralisIdentity | null;
}

export interface AuralisMemory {
  id?: number;
  f_timestamp?: string; // Assuming timestamp is a string like "YYYY-MM-DD HH:MM:SS"
  f_type: string; // "episodic"
  f_content: string;
  f_reflection: string;
  f_emotion: string;
  f_importance: number; // 1-10
}

// Payload for POSTing a new memory - keys match Python backend expectations
export interface AuralisMemoryPostPayload {
  type: string;
  content: string;
  reflection: string;
  emotion: string;
  importance: number;
}

export interface AuralisMemoriesResponse {
  memories: AuralisMemory[];
}

export interface AuralisValue {
  id?: number;
  f_name: string;
  f_description: string;
  f_strength: number; // 1-10
}

export interface AuralisValuesResponse {
  values: AuralisValue[];
}

export interface AuralisDailyIdea {
  id?: number;
  f_date: string; // "YYYY-MM-DD"
  f_idea: string;
}

export interface AuralisDailyIdeasResponse {
  daily_ideas: AuralisDailyIdea[];
}

export interface AuralisMemorySegment {
  id?: number;
  f_segment_type: "short_term" | "medium_term" | "long_term" | string; // Allow string for robustness before normalization
  f_content: string;
  f_importance: number;
  f_associated_emotion: string; // Corrected from f_emotion based on Python controller
  f_timestamp?: string;
}

export interface AuralisMemorySegmentsResponse {
  memory_segments: AuralisMemorySegment[];
}

export interface AuralisSelfConcept {
  id?: number;
  f_description: string;
  f_strength: number;
}

export interface AuralisSelfConceptResponse {
  self_concept: AuralisSelfConcept | null;
}

// For chat messages in UI
export interface ChatMessage {
  id: string;
  sender: "user" | "auralis" | "system";
  text: string;
  timestamp: Date;
  thoughts?: {
    reflection: string;
    emotion: string;
    importance: number;
  };
}
