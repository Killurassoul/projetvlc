export type AIProvider = 'local' | 'gemini' | 'openai';

export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  subtitleUrl?: string;
  description: string;
  duration: string;
  year: string;
  rating: string;
  category: string;
  season?: number;
  episode?: number;
  seriesId?: string; // To group episodes
  progress?: number; // In seconds
  totalDuration?: number; // In seconds
  lastWatched?: number; // Timestamp
  isFavorite?: boolean;
  filePath?: string; // Simulated local path
  dateAdded?: number; // Timestamp
}

export interface LibraryState {
  items: VideoMetadata[];
  history: string[]; // List of video IDs
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Subtitle {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
  seconds: number;
}
