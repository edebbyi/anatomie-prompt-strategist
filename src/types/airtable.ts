export interface PromptIdea {
  id: string; // Airtable record ID
  ideaId: number;
  structureId?: number;
  structureRecordId?: string;
  renderer: string;
  skeleton: string;
  status: 'Proposed' | 'Pending' | 'Approved' | 'Declined';
  reward?: number;
  rating?: number;
  parent?: string[]; // Array of linked record IDs
  parentRecordId?: string;
  approvedAt?: string;
  createdAt: string;
  email?: string;
  feedback?: string;
  declinedAt?: string;
  notes?: string;
  testImageUrl?: string;
  proposedBy: 'LLM' | 'Admin';
}

export interface PromptStructure {
  id: string; // Airtable record ID
  structureId: number;
  skeleton: string;
  renderer: string;
  status: 'Active' | 'Archived';
  outlierCount: number;
  usageCount: number;
  ageWeeks: number;
  zScore: number;
  aiScore: number;
  aiCritique?: string;
  trend?: string;
  modelUsed?: string;
  systemPrompt?: string;
  dateCreated: string;
  rewardScore?: number; // Calculated
}

export interface DailyBatchSettings {
  id: string; // Airtable record ID
  batchSize: number;
  batchEnabled: boolean;
  nextBatchTime?: string;
  emailNotifications: boolean;
  notificationEmail: string | string[];
  batchComplete?: boolean;
}

export interface GeneratedIdea {
  skeleton: string;
  renderer: string;
  parentStructureId: number;
  rationale: string;
  rewardEstimate: number;
}

export interface BatchGenerationResult {
  ideas: GeneratedIdea[];
  totalGenerated: number;
  timestamp: string;
}
