export interface CeremonyStep {
  id: string;
  name: string;
  notes: string;
}

export interface GenerateRequest {
  ceremonyOrder: CeremonyStep[];
  specialNotes: string;
  templateId: string;
  customTemplate?: string;
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
