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
  goldenExamples?: Record<string, string>;
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
  sample_hash: string;
  golden_examples: Record<string, string>;
  created_at: string;
}

export interface StepTemplate {
  id: string;
  step_name: string;
  label: string;
  content: string;
  created_at: string;
}

export interface StepOption {
  source: string;
  sourceName: string;
  content: string;
}

export interface ArchivedScript {
  id: string;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  venue: string;
  ceremony_order: CeremonyStep[];
  script: string;
  created_at: string;
}
