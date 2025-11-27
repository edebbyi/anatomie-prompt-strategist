import { PromptIdea, PromptStructure, DailyBatchSettings } from '@/types/airtable';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

// ============================================
// PROMPT IDEAS - READ
// ============================================

export async function fetchPromptIdeas(viewId: string): Promise<PromptIdea[]> {
  const res = await fetch(`${API_BASE}/airtable/ideas?view=${encodeURIComponent(viewId)}`);
  if (!res.ok) throw new Error('Failed to fetch prompt ideas from backend');
  return res.json();
}

export async function fetchPromptIdeasByDate(
  viewId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, PromptIdea[]>> {
  const res = await fetch(`${API_BASE}/airtable/ideas/grouped?view=${encodeURIComponent(viewId)}`);
  if (!res.ok) throw new Error('Failed to fetch prompt ideas from backend');
  const grouped: Record<string, PromptIdea[]> = await res.json();

  // Optional date filtering on the client
  if (!startDate && !endDate) return grouped;

  const filtered: Record<string, PromptIdea[]> = {};
  Object.entries(grouped).forEach(([dateKey, ideas]) => {
    const createdDate = new Date(dateKey);
    if (startDate && createdDate < startDate) return;
    if (endDate && createdDate > endDate) return;
    filtered[dateKey] = ideas;
  });
  return filtered;
}

// ============================================
// PROMPT IDEAS - WRITE
// ============================================

export async function createPromptIdea(data: {
  skeleton: string;
  renderer: string;
  proposedBy: 'LLM' | 'Admin' | 'AI System';
  parentStructureId?: number;
  rewardEstimate?: number;
  notes?: string;
}): Promise<PromptIdea> {
  const res = await fetch(`${API_BASE}/airtable/ideas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create prompt idea via backend');
  return res.json();
}

export async function updatePromptIdea(
  recordId: string,
  updates: {
    status?: string;
    rating?: number;
    feedback?: string;
    structureId?: number;
    approvedAt?: string;
    declinedAt?: string;
    notes?: string;
    testImageUrl?: string;
  }
): Promise<PromptIdea> {
  const res = await fetch(`${API_BASE}/airtable/ideas/${recordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update prompt idea via backend');
  return res.json();
}

// ============================================
// PROMPT STRUCTURES - READ
// ============================================

export async function fetchPromptStructures(viewId: string): Promise<PromptStructure[]> {
  const res = await fetch(`${API_BASE}/airtable/structures?view=${encodeURIComponent(viewId)}`);
  if (!res.ok) throw new Error('Failed to fetch prompt structures via backend');
  const data: PromptStructure[] = await res.json();
  return data.map(structure => ({
    ...structure,
    rewardScore: calculateRewardScore(structure)
  }));
}

export async function fetchTopPerformingStructures(limit: number = 10): Promise<PromptStructure[]> {
  const structures = await fetchPromptStructures(import.meta.env.VITE_VIEW_STRUCTURES_TOP_PERFORMERS);
  return structures
    .sort((a, b) => (b.rewardScore || 0) - (a.rewardScore || 0))
    .slice(0, limit);
}

export async function fetchUnderexploredStructures(limit: number = 3): Promise<PromptStructure[]> {
  const structures = await fetchPromptStructures(import.meta.env.VITE_VIEW_STRUCTURES_UNDEREXPLORED);
  return structures
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, limit);
}

// ============================================
// PROMPT STRUCTURES - WRITE
// ============================================

export async function createPromptStructure(data: {
  skeleton: string;
  renderer: string;
  aiScore?: number;
  aiCritique?: string;
  sourceIdeaRecordId?: string;
  modelUsed?: string;
  systemPrompt?: string;
}): Promise<PromptStructure> {
  const res = await fetch(`${API_BASE}/airtable/structures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create prompt structure via backend');
  return res.json();
}

// ============================================
// SETTINGS - READ/WRITE
// ============================================

export async function fetchSettings(): Promise<DailyBatchSettings> {
  const res = await fetch(`${API_BASE}/airtable/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings via backend');
  return res.json();
}

export async function updateSettings(
  recordId: string,
  updates: Partial<Omit<DailyBatchSettings, 'id'>>
): Promise<DailyBatchSettings> {
  const res = await fetch(`${API_BASE}/airtable/settings/${recordId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update settings via backend');
  return res.json();
}

// ============================================
// Helper (reward score preserved)
// ============================================

// Small helper to avoid circular import issues
export function calculateRewardScore(structure: PromptStructure): number {
  const aiScoreWeight = parseFloat(import.meta.env.VITE_REWARD_WEIGHT_AI_SCORE || '0.6');
  const outlierWeight = parseFloat(import.meta.env.VITE_REWARD_WEIGHT_OUTLIER || '0.3');
  const ageWeight = parseFloat(import.meta.env.VITE_REWARD_WEIGHT_AGE || '-0.1');

  return (
    aiScoreWeight * structure.aiScore +
    outlierWeight * structure.outlierCount +
    ageWeight * structure.ageWeeks
  );
}
