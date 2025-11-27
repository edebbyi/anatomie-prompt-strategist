import { BatchGenerationResult } from '@/types/airtable';

const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api`;

export async function runDailyBatch(): Promise<BatchGenerationResult> {
  const res = await fetch(`${API_BASE}/batch/run`, { method: 'POST' });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Batch generation failed: ${errorText || res.statusText}`);
  }
  return res.json();
}

// Manual trigger for testing
export async function testBatchGeneration(): Promise<BatchGenerationResult> {
  return runDailyBatch();
}
