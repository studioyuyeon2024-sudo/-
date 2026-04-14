export interface CeremonyStep {
  id: string;
  name: string;
  notes: string;
}

export interface SampleScript {
  id: string;
  name: string;
  content: string;
}

export interface GenerateRequest {
  ceremonyOrder: CeremonyStep[];
  specialNotes: string;
  templateId: string;
  customTemplate?: string;
  styleProfile?: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  venue: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  defaultSteps: string[];
  content: string;
}

export interface StyleProfile {
  id: string;
  profile: string;
  sample_count: number;
  created_at: string;
}
