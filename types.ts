export enum AppView {
  EDITOR = 'EDITOR',
  SETTINGS = 'SETTINGS',
}

// FIX: Define and export GeolocationState interface.
export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

// FIX: Define and export GroundingSource interface.
export interface GroundingSource {
  uri: string;
  title: string;
}

// FIX: Define and export ChatMessage interface.
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: GroundingSource[];
}
