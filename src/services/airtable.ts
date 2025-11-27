import Airtable, { FieldSet, Records } from 'airtable';
import { PromptIdea, PromptStructure, DailyBatchSettings } from '@/types/airtable';

// Initialize Airtable
const airtable = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY,
});

const base = airtable.base(import.meta.env.VITE_AIRTABLE_BASE_ID);

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 5 requests per second

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

// ============================================
// REWARD SCORE CALCULATION
// ============================================

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

// ============================================
// PROMPT IDEAS - READ
// ============================================

export async function fetchPromptIdeas(viewId: string): Promise<PromptIdea[]> {
  await rateLimit();

  try {
    const records = await base(import.meta.env.VITE_AIRTABLE_IDEAS_TABLE)
      .select({ view: viewId })
      .all();

    return records.map(mapRecordToPromptIdea);
  } catch (error) {
    console.error('Error fetching prompt ideas:', error);
    throw new Error('Failed to fetch prompt ideas from Airtable');
  }
}

export async function fetchPromptIdeasByDate(
  viewId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, PromptIdea[]>> {
  const ideas = await fetchPromptIdeas(viewId);

  // Filter by date if provided
  let filtered = ideas;
  if (startDate || endDate) {
    filtered = ideas.filter(idea => {
      const createdDate = new Date(idea.createdAt);
      if (startDate && createdDate < startDate) return false;
      if (endDate && createdDate > endDate) return false;
      return true;
    });
  }

  // Group by date using local timezone
  const grouped: Record<string, PromptIdea[]> = {};
  filtered.forEach(idea => {
    const createdDate = new Date(idea.createdAt);
    // Format date in local timezone as YYYY-MM-DD
    const year = createdDate.getFullYear();
    const month = String(createdDate.getMonth() + 1).padStart(2, '0');
    const day = String(createdDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
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
  await rateLimit();

  try {
    // Map to an allowed option in Airtable. Many bases use "AI System" instead of "LLM".
    const proposedByValue = data.proposedBy === 'LLM' ? 'AI System' : data.proposedBy;

    const record = await base(import.meta.env.VITE_AIRTABLE_IDEAS_TABLE).create({
      [import.meta.env.VITE_COL_SKELETON]: data.skeleton,
      [import.meta.env.VITE_COL_RENDERER]: data.renderer,
      [import.meta.env.VITE_COL_STATUS]: import.meta.env.VITE_STATUS_PROPOSED,
      [import.meta.env.VITE_COL_PROPOSED_BY]: proposedByValue,
      [import.meta.env.VITE_COL_REWARD]: data.rewardEstimate,
      [import.meta.env.VITE_COL_NOTES]: data.notes,
      // Parent link will be set if parentStructureId provided
      ...(data.parentStructureId && {
        [import.meta.env.VITE_COL_PARENT]: [await getStructureRecordId(data.parentStructureId)]
      })
    });

    return mapRecordToPromptIdea(record);
  } catch (error) {
    console.error('Error creating prompt idea:', error);
    throw new Error('Failed to create prompt idea in Airtable');
  }
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
  await rateLimit();

  try {
    const fields: FieldSet = {};

    if (updates.status) fields[import.meta.env.VITE_COL_STATUS] = updates.status;
    if (updates.rating !== undefined) fields[import.meta.env.VITE_COL_RATING] = updates.rating;
    if (updates.feedback) fields[import.meta.env.VITE_COL_FEEDBACK] = updates.feedback;
    // Airtable Date fields expect YYYY-MM-DD format
    if (updates.approvedAt) {
      const date = new Date(updates.approvedAt);
      fields[import.meta.env.VITE_COL_APPROVED_AT] = date.toISOString().split('T')[0];
    }
    if (updates.declinedAt) {
      const date = new Date(updates.declinedAt);
      fields[import.meta.env.VITE_COL_DECLINED_AT] = date.toISOString().split('T')[0];
    }
    if (updates.notes) fields[import.meta.env.VITE_COL_NOTES] = updates.notes;
    if (updates.testImageUrl && import.meta.env.VITE_COL_TEST_IMAGE) {
      // Airtable attachment fields expect an array of attachment objects
      fields[import.meta.env.VITE_COL_TEST_IMAGE] = [{ url: updates.testImageUrl }];
    }

    // Link to structure if structureId provided
    if (updates.structureId) {
      const structureRecordId = await getStructureRecordId(updates.structureId);
      fields[import.meta.env.VITE_COL_STRUCTURE_ID] = [structureRecordId];
    }

    console.log('Updating Airtable record:', recordId, 'with fields:', fields);

    const record = await base(import.meta.env.VITE_AIRTABLE_IDEAS_TABLE).update(
      recordId,
      fields
    );

    return mapRecordToPromptIdea(record);
  } catch (error: any) {
    console.error('Error updating prompt idea:', error);
    console.error('Error details:', error?.message, error?.statusCode, error?.error);
    throw new Error('Failed to update prompt idea in Airtable');
  }
}

// ============================================
// PROMPT STRUCTURES - READ
// ============================================

export async function fetchPromptStructures(viewId: string): Promise<PromptStructure[]> {
  await rateLimit();

  try {
    const records = await base(import.meta.env.VITE_AIRTABLE_STRUCTURES_TABLE)
      .select({ view: viewId })
      .all();

    return records.map(record => {
      const structure = mapRecordToPromptStructure(record);
      structure.rewardScore = calculateRewardScore(structure);
      return structure;
    });
  } catch (error) {
    console.error('Error fetching prompt structures:', error);
    throw new Error('Failed to fetch prompt structures from Airtable');
  }
}

export async function fetchTopPerformingStructures(limit: number = 10): Promise<PromptStructure[]> {
  const structures = await fetchPromptStructures(
    import.meta.env.VITE_VIEW_STRUCTURES_TOP_PERFORMERS
  );

  return structures
    .sort((a, b) => (b.rewardScore || 0) - (a.rewardScore || 0))
    .slice(0, limit);
}

export async function fetchUnderexploredStructures(limit: number = 3): Promise<PromptStructure[]> {
  const structures = await fetchPromptStructures(
    import.meta.env.VITE_VIEW_STRUCTURES_UNDEREXPLORED
  );

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
  await rateLimit();

  try {
    const ideaLinkCol =
      import.meta.env.VITE_COL_STRUCT_IDEA ||
      'Idea';

    // Debug log environment variables
    const requiredVars = [
      'VITE_COL_STRUCT_SKELETON',
      'VITE_COL_STRUCT_RENDERER',
      'VITE_COL_STRUCT_STATUS',
      'VITE_STATUS_ACTIVE',
      'VITE_AIRTABLE_STRUCTURES_TABLE'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const fields: FieldSet = {
      [import.meta.env.VITE_COL_STRUCT_SKELETON]: data.skeleton,
      [import.meta.env.VITE_COL_STRUCT_RENDERER]: data.renderer,
      [import.meta.env.VITE_COL_STRUCT_STATUS]: import.meta.env.VITE_STATUS_ACTIVE,
      // Note: Removed automated fields (outlier_count, usage_count, age_weeks, z_score, ai_score, ai_critique)
      // as they are managed by Airtable's automations
    };
    
    console.log('Creating structure with fields:', JSON.stringify(fields, null, 2));
    if (data.modelUsed) {
      fields[import.meta.env.VITE_COL_MODEL_USED] = data.modelUsed;
    }
    if (data.systemPrompt) {
      fields[import.meta.env.VITE_COL_SYSTEM_PROMPT] = data.systemPrompt;
    }

    if (data.sourceIdeaRecordId && ideaLinkCol) {
      fields[ideaLinkCol] = [data.sourceIdeaRecordId];
    }

    const tableName = import.meta.env.VITE_AIRTABLE_STRUCTURES_TABLE;
    if (!tableName) {
      throw new Error('VITE_AIRTABLE_STRUCTURES_TABLE environment variable is not set');
    }
    
    console.log(`Creating record in table: ${tableName}`);
    const record = await base(tableName).create(fields);

    return mapRecordToPromptStructure(record);
  } catch (error: any) {
    console.error('Error creating prompt structure:', error?.message || error);
    throw new Error(
      `Failed to create prompt structure in Airtable${
        error?.message ? `: ${error.message}` : ''
      }`
    );
  }
}

// ============================================
// SETTINGS - READ/WRITE
// ============================================

export async function fetchSettings(): Promise<DailyBatchSettings> {
  await rateLimit();

  try {
    const records = await base(import.meta.env.VITE_AIRTABLE_SETTINGS_TABLE)
      .select({
        view: import.meta.env.VITE_VIEW_SETTINGS_MAIN,
        maxRecords: 1
      })
      .all();

    if (records.length === 0) {
      throw new Error('No settings record found');
    }

    return mapRecordToSettings(records[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw new Error('Failed to fetch settings from Airtable');
  }
}

export async function updateSettings(
  recordId: string,
  updates: Partial<Omit<DailyBatchSettings, 'id'>>
): Promise<DailyBatchSettings> {
  await rateLimit();

  try {
    const fields: FieldSet = {};

    if (updates.batchSize !== undefined) {
      fields[import.meta.env.VITE_COL_BATCH_SIZE] = updates.batchSize;
    }
  if (updates.batchEnabled !== undefined) {
    fields[import.meta.env.VITE_COL_BATCH_ENABLED] = updates.batchEnabled;
  }
  if (updates.nextBatchTime !== undefined) {
    fields[import.meta.env.VITE_COL_NEXT_BATCH_TIME] = updates.nextBatchTime;
  }
  if (updates.emailNotifications !== undefined) {
    fields[import.meta.env.VITE_COL_EMAIL_NOTIFICATIONS] = updates.emailNotifications;
  }
  if (updates.notificationEmail !== undefined) {
    fields[import.meta.env.VITE_COL_NOTIFICATION_EMAIL] = updates.notificationEmail;
  }
  if (updates.batchComplete !== undefined && import.meta.env.VITE_COL_BATCH_COMPLETE) {
    fields[import.meta.env.VITE_COL_BATCH_COMPLETE] = updates.batchComplete;
  }

    const record = await base(import.meta.env.VITE_AIRTABLE_SETTINGS_TABLE).update(
      recordId,
      fields
    );

    return mapRecordToSettings(record);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings in Airtable');
  }
}

// ============================================
// HELPER FUNCTIONS - MAPPING
// ============================================

function mapRecordToPromptIdea(record: any): PromptIdea {
  const createdAtField =
    record.get(import.meta.env.VITE_COL_CREATED_AT) ||
    record.get('Created At') ||
    record.get('created_at');
  const linkedStructureField = record.get(import.meta.env.VITE_COL_STRUCTURE_ID);
  const structureRecordId =
    Array.isArray(linkedStructureField) && typeof linkedStructureField[0] === 'string'
      ? linkedStructureField[0]
      : undefined;
  const structureIdValue =
    !Array.isArray(linkedStructureField) && typeof linkedStructureField === 'number'
      ? linkedStructureField
      : undefined;
  const testImageField = import.meta.env.VITE_COL_TEST_IMAGE
    ? record.get(import.meta.env.VITE_COL_TEST_IMAGE)
    : undefined;
  const testImageUrl =
    Array.isArray(testImageField) && testImageField[0]?.url
      ? testImageField[0].url
      : undefined;
  return {
    id: record.id,
    ideaId: record.get(import.meta.env.VITE_COL_IDEA_ID) || 0,
    structureId: structureIdValue,
    structureRecordId,
    renderer: record.get(import.meta.env.VITE_COL_RENDERER) || '',
    skeleton: record.get(import.meta.env.VITE_COL_SKELETON) || '',
    status: record.get(import.meta.env.VITE_COL_STATUS) || 'Proposed',
    reward: record.get(import.meta.env.VITE_COL_REWARD),
    rating: record.get(import.meta.env.VITE_COL_RATING),
    parent: record.get(import.meta.env.VITE_COL_PARENT),
    parentRecordId: record.get(import.meta.env.VITE_COL_PARENT)?.[0],
    approvedAt: record.get(import.meta.env.VITE_COL_APPROVED_AT),
    createdAt: createdAtField || new Date().toISOString(),
    email: record.get(import.meta.env.VITE_COL_EMAIL),
    feedback: record.get(import.meta.env.VITE_COL_FEEDBACK),
    declinedAt: record.get(import.meta.env.VITE_COL_DECLINED_AT),
    notes: record.get(import.meta.env.VITE_COL_NOTES),
    testImageUrl,
    proposedBy: record.get(import.meta.env.VITE_COL_PROPOSED_BY) || 'Admin',
  };
}

function mapRecordToPromptStructure(record: any): PromptStructure {
  return {
    id: record.id,
    structureId: record.get(import.meta.env.VITE_COL_STRUCT_ID) || 0,
    skeleton: record.get(import.meta.env.VITE_COL_STRUCT_SKELETON) || '',
    renderer: record.get(import.meta.env.VITE_COL_STRUCT_RENDERER) || '',
    status: record.get(import.meta.env.VITE_COL_STRUCT_STATUS) || 'Active',
    outlierCount: record.get(import.meta.env.VITE_COL_OUTLIER_COUNT) || 0,
    usageCount: record.get(import.meta.env.VITE_COL_USAGE_COUNT) || 0,
    ageWeeks: record.get(import.meta.env.VITE_COL_AGE_WEEKS) || 0,
    zScore: record.get(import.meta.env.VITE_COL_Z_SCORE) || 0,
    aiScore: record.get(import.meta.env.VITE_COL_AI_SCORE) || 0,
    aiCritique: record.get(import.meta.env.VITE_COL_AI_CRITIQUE),
    trend: record.get(import.meta.env.VITE_COL_TREND),
    modelUsed: record.get(import.meta.env.VITE_COL_MODEL_USED),
    systemPrompt: record.get(import.meta.env.VITE_COL_SYSTEM_PROMPT),
    dateCreated: record.get(import.meta.env.VITE_COL_DATE_CREATED) || new Date().toISOString(),
  };
}

function mapRecordToSettings(record: any): DailyBatchSettings {
  const notificationEmailField = record.get(import.meta.env.VITE_COL_NOTIFICATION_EMAIL);
  const notificationEmail = Array.isArray(notificationEmailField)
    ? notificationEmailField
    : notificationEmailField || '';

  return {
    id: record.id,
    batchSize: record.get(import.meta.env.VITE_COL_BATCH_SIZE) || 5,
    batchEnabled: record.get(import.meta.env.VITE_COL_BATCH_ENABLED) || false,
    nextBatchTime: record.get(import.meta.env.VITE_COL_NEXT_BATCH_TIME),
    emailNotifications: record.get(import.meta.env.VITE_COL_EMAIL_NOTIFICATIONS) || false,
    notificationEmail,
    batchComplete: import.meta.env.VITE_COL_BATCH_COMPLETE
      ? record.get(import.meta.env.VITE_COL_BATCH_COMPLETE)
      : undefined,
  };
}

// ============================================
// HELPER FUNCTIONS - LOOKUPS
// ============================================

async function getStructureRecordId(structureId: number): Promise<string> {
  await rateLimit();

  const records = await base(import.meta.env.VITE_AIRTABLE_STRUCTURES_TABLE)
    .select({
      filterByFormula: `{${import.meta.env.VITE_COL_STRUCT_ID}} = ${structureId}`,
      maxRecords: 1
    })
    .all();

  if (records.length === 0) {
    throw new Error(`Structure with ID ${structureId} not found`);
  }

  return records[0].id;
}
