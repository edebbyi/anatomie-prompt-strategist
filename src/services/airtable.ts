import { PromptIdea, PromptStructure, DailyBatchSettings } from '@/types/airtable';

const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api`;

// ============================================
// PROMPT IDEAS - READ
// ============================================

export async function fetchPromptIdeas(status?: 'Proposed' | 'Pending' | 'Approved'): Promise<PromptIdea[]> {
  const url = status
    ? `${API_BASE}/airtable/ideas?status=${encodeURIComponent(status.toLowerCase())}`
    : `${API_BASE}/airtable/ideas`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prompt ideas from backend');
  return res.json();
}

export async function fetchPromptIdeasByDate(
  status?: 'Proposed' | 'Pending' | 'Approved',
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, PromptIdea[]>> {
  const url = status
    ? `${API_BASE}/airtable/ideas?status=${encodeURIComponent(status.toLowerCase())}`
    : `${API_BASE}/airtable/ideas`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prompt ideas from backend');
  const ideas: PromptIdea[] = await res.json();

  // Filter by date if provided, then group by local date (YYYY-MM-DD) like before
  const filtered = ideas.filter((idea) => {
    const createdDate = new Date(idea.createdAt);
    if (startDate && createdDate < startDate) return false;
    if (endDate && createdDate > endDate) return false;
    return true;
  });

  const grouped: Record<string, PromptIdea[]> = {};
  filtered.forEach((idea) => {
    const createdDate = new Date(idea.createdAt);
    const year = createdDate.getFullYear();
    const month = String(createdDate.getMonth() + 1).padStart(2, '0');
    const day = String(createdDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(idea);
  });

  return grouped;
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
  const url = viewId
    ? `${API_BASE}/airtable/structures?view=${encodeURIComponent(viewId)}`
    : `${API_BASE}/airtable/structures`;
  const res = await fetch(url);
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
