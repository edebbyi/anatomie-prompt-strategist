import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Airtable from 'airtable';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Airtable setup
const airtable = new Airtable({
  apiKey: process.env.VITE_AIRTABLE_API_KEY
});
const base = airtable.base(process.env.VITE_AIRTABLE_BASE_ID);
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

// Helper: map Airtable records
const mapPromptIdea = (record) => {
  const testImageField = process.env.VITE_COL_TEST_IMAGE
    ? record.get(process.env.VITE_COL_TEST_IMAGE)
    : undefined;
  const testImageUrl =
    Array.isArray(testImageField) && testImageField[0]?.url
      ? testImageField[0].url
      : undefined;

  const createdAtField =
    record.get(process.env.VITE_COL_CREATED_AT) ||
    record.get('Created At') ||
    record.get('created_at');

  const linkedStructureField = record.get(process.env.VITE_COL_STRUCTURE_ID);
  const structureRecordId =
    Array.isArray(linkedStructureField) && typeof linkedStructureField[0] === 'string'
      ? linkedStructureField[0]
      : undefined;
  const structureIdValue =
    !Array.isArray(linkedStructureField) && typeof linkedStructureField === 'number'
      ? linkedStructureField
      : undefined;

  return {
    id: record.id,
    ideaId: record.get(process.env.VITE_COL_IDEA_ID) || 0,
    structureId: structureIdValue,
    structureRecordId,
    renderer: record.get(process.env.VITE_COL_RENDERER) || '',
    skeleton: record.get(process.env.VITE_COL_SKELETON) || '',
    status: record.get(process.env.VITE_COL_STATUS) || 'Proposed',
    reward: record.get(process.env.VITE_COL_REWARD),
    rating: record.get(process.env.VITE_COL_RATING),
    parent: record.get(process.env.VITE_COL_PARENT),
    parentRecordId: record.get(process.env.VITE_COL_PARENT)?.[0],
    approvedAt: record.get(process.env.VITE_COL_APPROVED_AT),
    createdAt: createdAtField || new Date().toISOString(),
    email: record.get(process.env.VITE_COL_EMAIL),
    feedback: record.get(process.env.VITE_COL_FEEDBACK),
    declinedAt: record.get(process.env.VITE_COL_DECLINED_AT),
    notes: record.get(process.env.VITE_COL_NOTES),
    proposedBy: record.get(process.env.VITE_COL_PROPOSED_BY) || 'Admin',
    testImageUrl,
  };
};

const mapPromptStructure = (record) => ({
  id: record.id,
  structureId: record.get(process.env.VITE_COL_STRUCT_ID) || 0,
  skeleton: record.get(process.env.VITE_COL_STRUCT_SKELETON) || '',
  renderer: record.get(process.env.VITE_COL_STRUCT_RENDERER) || '',
  status: record.get(process.env.VITE_COL_STRUCT_STATUS) || 'Active',
  outlierCount: record.get(process.env.VITE_COL_OUTLIER_COUNT) || 0,
  usageCount: record.get(process.env.VITE_COL_USAGE_COUNT) || 0,
  ageWeeks: record.get(process.env.VITE_COL_AGE_WEEKS) || 0,
  zScore: record.get(process.env.VITE_COL_Z_SCORE) || 0,
  aiScore: record.get(process.env.VITE_COL_AI_SCORE) || 0,
  aiCritique: record.get(process.env.VITE_COL_AI_CRITIQUE),
  trend: record.get(process.env.VITE_COL_TREND),
  modelUsed: record.get(process.env.VITE_COL_MODEL_USED),
  systemPrompt: record.get(process.env.VITE_COL_SYSTEM_PROMPT),
  dateCreated: record.get(process.env.VITE_COL_DATE_CREATED) || new Date().toISOString(),
});

const mapSettings = (record) => ({
  id: record.id,
  batchSize: record.get(process.env.VITE_COL_BATCH_SIZE) || 5,
  batchEnabled: record.get(process.env.VITE_COL_BATCH_ENABLED) || false,
  nextBatchTime: record.get(process.env.VITE_COL_NEXT_BATCH_TIME),
  emailNotifications: record.get(process.env.VITE_COL_EMAIL_NOTIFICATIONS) || false,
  notificationEmail: record.get(process.env.VITE_COL_NOTIFICATION_EMAIL),
  batchComplete: process.env.VITE_COL_BATCH_COMPLETE
    ? record.get(process.env.VITE_COL_BATCH_COMPLETE)
    : undefined,
});

// Helpers
const getStructureRecordId = async (structureId) => {
  const records = await base(process.env.VITE_AIRTABLE_STRUCTURES_TABLE)
    .select({
      filterByFormula: `{${process.env.VITE_COL_STRUCT_ID}} = ${structureId}`,
      maxRecords: 1
    })
    .all();
  if (!records.length) return null;
  return records[0].id;
};

const buildContextFromStructures = (topStructures, underexploredStructures) => {
  const topPerformers = topStructures
    .map((s, i) =>
      `${i + 1}. [ID ${s.structureId}] Reward: ${s.rewardScore?.toFixed(2)} | AI: ${s.aiScore}/10 | Outliers: ${s.outlierCount} | Renderer: ${s.renderer}
Skeleton: ${s.skeleton.substring(0, 200)}...`
    )
    .join('\n\n');

  const underexplored = underexploredStructures
    .map((s, i) =>
      `${i + 1}. [ID ${s.structureId}] AI Score: ${s.aiScore}/10 | Usage: ${s.usageCount}x | Renderer: ${s.renderer}
Skeleton: ${s.skeleton.substring(0, 200)}...`
    )
    .join('\n\n');

  return { topPerformers, underexplored };
};

const calculateRewardScore = (structure) => {
  const aiScoreWeight = parseFloat(process.env.VITE_REWARD_WEIGHT_AI_SCORE || '0.6');
  const outlierWeight = parseFloat(process.env.VITE_REWARD_WEIGHT_OUTLIER || '0.3');
  const ageWeight = parseFloat(process.env.VITE_REWARD_WEIGHT_AGE || '-0.1');

  return (
    aiScoreWeight * (structure.aiScore || 0) +
    outlierWeight * (structure.outlierCount || 0) +
    ageWeight * (structure.ageWeeks || 0)
  );
};

const SYSTEM_PROMPT =
  process.env.VITE_SYSTEM_PROMPT ||
  `You are an elite Prompt Strategist for ANATOMIE, a luxury performance travel wear brand.

Your mission: Analyze top-performing prompt structures and generate innovative variations that will produce outlier garments with best-seller DNA.

## ANATOMIE Brand DNA
- Ultra-modern luxury travel wear (NOT gym, NOT formal)
- Performance fabrics with tailored silhouettes
- Understated luxury with tonal hardware
- Innovation at intersection of fashion + technology
- Visual-only prompts (no text overlays)

## Template Structure (12-look capsule, 3:1 shirt-to-pant ratio)
Core garments: Safari jackets, hybrid sweaters, blazers, truckers, bombers, car coats, vests, dresses, cardi-coats
NO shorts or skirts in Phase 1

## Weight Distribution Rules
- Designer/Brand: 4.0-5.0
- Core garment: 4.5-5.0
- Model/pose: 3.5-4.5
- Lighting: 2.5-3.5
- Background: 2.0-3.0
- Constraints: 2.0-2.5

## MANDATORY Constraints (ALWAYS include)
"no text, no logos, no motion blur, no movement, no crop tops, no props, no equipment"

## Output Requirements
Generate exactly 5 prompt structure ideas as JSON:

{
  "ideas": [
    {
      "skeleton": "[Designer/Brand]::weight [Garment details]::weight [Model/pose]::weight [Lighting]::weight [Background]::weight [Constraints]::weight",
      "renderer": "Recraft|ImageFX|Midjourney",
      "parentStructureId": 123,
      "rationale": "Why this structure will produce outlier results based on reward score patterns",
      "rewardEstimate": 4.5
    }
  ]
}

## Analysis Strategy
1. Study top performers: Which weight distributions, descriptors, and combinations yield highest outlier_count?
2. Study under-explored: Which promising structures (AI Score ≥ 7) have low usage_count?
3. Generate innovations: Novel combinations that honor brand DNA while exploring new territory
4. NO verbatim copying: Each structure must be a creative variation, not a clone

## Quality Bar
Target AI Score: 9-10/10
Target Reward Estimate: 4.0+
Expected result: Structures that will generate garments Shawn wants to wear and sell`;

async function generatePromptIdeas(topStructures, underexploredStructures) {
  const context = buildContextFromStructures(topStructures, underexploredStructures);

  const response = await openai.chat.completions.create({
    model: process.env.VITE_OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze these prompt structures and generate 5 innovative variations:

## TOP PERFORMERS (sorted by reward score)
${context.topPerformers}

## UNDER-EXPLORED GEMS (high AI Score, low usage)
${context.underexplored}

Generate 5 new prompt structure ideas as JSON. Focus on:
1. Learning from top performers' patterns
2. Exploring under-utilized high-quality structures
3. Creating variations (NOT clones)
4. Maintaining ANATOMIE brand DNA
5. Including mandatory constraints

Output valid JSON only.`
      }
    ],
    temperature: parseFloat(process.env.VITE_OPENAI_TEMPERATURE || '0.9'),
    max_completion_tokens: parseInt(process.env.VITE_OPENAI_MAX_TOKENS || '3000'),
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }

  const parsed = JSON.parse(content);

  if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
    throw new Error('Invalid response format from OpenAI');
  }

  const validIdeas = parsed.ideas.filter(
    (idea) => idea.skeleton && idea.renderer && idea.rationale && typeof idea.rewardEstimate === 'number'
  );

  if (!validIdeas.length) {
    throw new Error('No valid ideas generated');
  }

  return {
    ideas: validIdeas,
    totalGenerated: validIdeas.length,
    timestamp: new Date().toISOString()
  };
}

// Replicate API configuration
const REPLICATE_API_BASE = 'https://api.replicate.com/v1';
const REPLICATE_API_TOKEN = process.env.VITE_REPLICATE_API_TOKEN;

/**
 * POST /api/replicate/generate
 * Generate an image using Replicate API
 */
app.post('/api/replicate/generate', async (req, res) => {
  try {
    const { renderer, prompt, aspectRatio, size, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!renderer) {
      return res.status(400).json({ error: 'Renderer is required' });
    }

    // Determine which model to use
    let modelId;
    let input;

    const normalizedRenderer = renderer.toLowerCase();

    if (normalizedRenderer.includes('imagefx') || normalizedRenderer.includes('imagen')) {
      // ImageFX (Google Imagen 4 Ultra)
      modelId = process.env.VITE_REPLICATE_MODEL_IMAGEFX || 'google/imagen-4-ultra';
      input = {
        prompt,
        aspect_ratio: aspectRatio || '16:9',
      };
    } else if (normalizedRenderer.includes('recraft')) {
      // Recraft V3
      modelId = process.env.VITE_REPLICATE_MODEL_RECRAFT || 'recraft-ai/recraft-v3';
      input = {
        prompt,
        size: size || '1365x1024',
        style: style || 'any',
      };
    } else {
      return res.status(400).json({ 
        error: `Unsupported renderer: ${renderer}. Only ImageFX and Recraft are supported.` 
      });
    }

    // Call Replicate API
    const response = await fetch(`${REPLICATE_API_BASE}/models/${modelId}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait', // Wait for the prediction to complete
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', errorText);
      return res.status(response.status).json({ 
        error: `Replicate API error: ${errorText}` 
      });
    }

    const prediction = await response.json();
    res.json(prediction);

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate image' 
    });
  }
});

/**
 * Airtable proxy endpoints
 */

// Prompt Ideas - list
app.get('/api/airtable/ideas', async (req, res) => {
  try {
    const view = req.query.view || process.env.VITE_VIEW_IDEAS_ALL;
    const records = await base(process.env.VITE_AIRTABLE_IDEAS_TABLE)
      .select({ view })
      .all();
    res.json(records.map(mapPromptIdea));
  } catch (error) {
    console.error('Error fetching prompt ideas:', error);
    res.status(500).json({ error: 'Failed to fetch prompt ideas' });
  }
});

// Prompt Ideas - grouped by date
app.get('/api/airtable/ideas/grouped', async (req, res) => {
  try {
    const view = req.query.view || process.env.VITE_VIEW_IDEAS_ALL;
    const records = await base(process.env.VITE_AIRTABLE_IDEAS_TABLE)
      .select({ view })
      .all();
    const ideas = records.map(mapPromptIdea);
    const grouped = ideas.reduce((acc, idea) => {
      const createdDate = new Date(idea.createdAt);
      const year = createdDate.getFullYear();
      const month = String(createdDate.getMonth() + 1).padStart(2, '0');
      const day = String(createdDate.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(idea);
      return acc;
    }, {});
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching prompt ideas (grouped):', error);
    res.status(500).json({ error: 'Failed to fetch prompt ideas' });
  }
});

// Prompt Ideas - create
app.post('/api/airtable/ideas', async (req, res) => {
  try {
    const data = req.body;
    const proposedByValue = data.proposedBy === 'LLM' ? 'AI System' : data.proposedBy;

    let parentRecordId = null;
    if (data.parentStructureId) {
      parentRecordId = await getStructureRecordId(data.parentStructureId);
    }

    const record = await base(process.env.VITE_AIRTABLE_IDEAS_TABLE).create({
      [process.env.VITE_COL_SKELETON]: data.skeleton,
      [process.env.VITE_COL_RENDERER]: data.renderer,
      [process.env.VITE_COL_STATUS]: process.env.VITE_STATUS_PROPOSED,
      [process.env.VITE_COL_PROPOSED_BY]: proposedByValue,
      [process.env.VITE_COL_REWARD]: data.rewardEstimate,
      [process.env.VITE_COL_NOTES]: data.notes,
      ...(data.parentStructureId && {
        [process.env.VITE_COL_PARENT]: parentRecordId ? [parentRecordId] : []
      })
    });
    res.json(mapPromptIdea(record));
  } catch (error) {
    console.error('Error creating prompt idea:', error);
    res.status(500).json({ error: 'Failed to create prompt idea' });
  }
});

// Prompt Ideas - update
app.patch('/api/airtable/ideas/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    const updates = req.body;
    const fields = {};

    if (updates.status) fields[process.env.VITE_COL_STATUS] = updates.status;
    if (updates.rating !== undefined) fields[process.env.VITE_COL_RATING] = updates.rating;
    if (updates.feedback) fields[process.env.VITE_COL_FEEDBACK] = updates.feedback;
    if (updates.notes) fields[process.env.VITE_COL_NOTES] = updates.notes;
    if (updates.structureId) {
      const structureRecordId = await getStructureRecordId(updates.structureId);
      if (structureRecordId) {
        fields[process.env.VITE_COL_STRUCTURE_ID] = [structureRecordId];
      }
    }
    if (updates.approvedAt) {
      const date = new Date(updates.approvedAt);
      fields[process.env.VITE_COL_APPROVED_AT] = date.toISOString().split('T')[0];
    }
    if (updates.declinedAt) {
      const date = new Date(updates.declinedAt);
      fields[process.env.VITE_COL_DECLINED_AT] = date.toISOString().split('T')[0];
    }
    if (updates.testImageUrl && process.env.VITE_COL_TEST_IMAGE) {
      fields[process.env.VITE_COL_TEST_IMAGE] = [{ url: updates.testImageUrl }];
    }

    const record = await base(process.env.VITE_AIRTABLE_IDEAS_TABLE).update(recordId, fields);
    res.json(mapPromptIdea(record));
  } catch (error) {
    console.error('Error updating prompt idea:', error);
    res.status(500).json({ error: 'Failed to update prompt idea' });
  }
});

// Prompt Structures - list
app.get('/api/airtable/structures', async (req, res) => {
  try {
    const view = req.query.view || process.env.VITE_VIEW_STRUCTURES_ALL;
    const records = await base(process.env.VITE_AIRTABLE_STRUCTURES_TABLE)
      .select({ view })
      .all();
    res.json(records.map(mapPromptStructure).map((s) => ({
      ...s,
      rewardScore: calculateRewardScore(s)
    })));
  } catch (error) {
    console.error('Error fetching structures:', error);
    res.status(500).json({ error: 'Failed to fetch structures' });
  }
});

// Prompt Structures - create
app.post('/api/airtable/structures', async (req, res) => {
  try {
    const data = req.body;
    const fields = {
      [process.env.VITE_COL_STRUCT_SKELETON]: data.skeleton,
      [process.env.VITE_COL_STRUCT_RENDERER]: data.renderer,
      [process.env.VITE_COL_STRUCT_STATUS]: process.env.VITE_STATUS_ACTIVE,
    };
    if (data.modelUsed) fields[process.env.VITE_COL_MODEL_USED] = data.modelUsed;
    if (data.systemPrompt) fields[process.env.VITE_COL_SYSTEM_PROMPT] = data.systemPrompt;
    if (data.sourceIdeaRecordId) fields[process.env.VITE_COL_STRUCT_IDEA] = [data.sourceIdeaRecordId];

    const record = await base(process.env.VITE_AIRTABLE_STRUCTURES_TABLE).create(fields);
    res.json(mapPromptStructure(record));
  } catch (error) {
    console.error('Error creating structure:', error);
    res.status(500).json({ error: 'Failed to create structure' });
  }
});

// Settings - get first
app.get('/api/airtable/settings', async (_req, res) => {
  try {
    const records = await base(process.env.VITE_AIRTABLE_SETTINGS_TABLE)
      .select({
        view: process.env.VITE_VIEW_SETTINGS_MAIN,
        maxRecords: 1
      })
      .all();
    if (!records.length) {
      return res.status(404).json({ error: 'No settings record found' });
    }
    res.json(mapSettings(records[0]));
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Settings - update
app.patch('/api/airtable/settings/:id', async (req, res) => {
  try {
    const recordId = req.params.id;
    const updates = req.body;
    const fields = {};

    if (updates.batchSize !== undefined) fields[process.env.VITE_COL_BATCH_SIZE] = updates.batchSize;
    if (updates.batchEnabled !== undefined) fields[process.env.VITE_COL_BATCH_ENABLED] = updates.batchEnabled;
    if (updates.nextBatchTime !== undefined) fields[process.env.VITE_COL_NEXT_BATCH_TIME] = updates.nextBatchTime;
    if (updates.emailNotifications !== undefined) fields[process.env.VITE_COL_EMAIL_NOTIFICATIONS] = updates.emailNotifications;
    if (updates.notificationEmail !== undefined) fields[process.env.VITE_COL_NOTIFICATION_EMAIL] = updates.notificationEmail;
    if (updates.batchComplete !== undefined && process.env.VITE_COL_BATCH_COMPLETE) {
      fields[process.env.VITE_COL_BATCH_COMPLETE] = updates.batchComplete;
    }

    const record = await base(process.env.VITE_AIRTABLE_SETTINGS_TABLE).update(recordId, fields);
    res.json(mapSettings(record));
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Batch generation (server-side OpenAI)
app.post('/api/batch/run', async (_req, res) => {
  try {
    const settingsRecords = await base(process.env.VITE_AIRTABLE_SETTINGS_TABLE)
      .select({ view: process.env.VITE_VIEW_SETTINGS_MAIN, maxRecords: 1 })
      .all();
    if (!settingsRecords.length) {
      return res.status(400).json({ error: 'No settings record found' });
    }
    const settings = mapSettings(settingsRecords[0]);
    if (!settings.batchEnabled) {
      return res.status(400).json({ error: 'Batch generation is disabled' });
    }

    const targetBatchSize = settings.batchSize || 5;
    const topCount = parseInt(process.env.VITE_TOP_STRUCTURES_COUNT || '10', 10);
    const exploreCount = parseInt(process.env.VITE_EXPLORE_STRUCTURES_COUNT || '3', 10);

    const topRecords = await base(process.env.VITE_AIRTABLE_STRUCTURES_TABLE)
      .select({ view: process.env.VITE_VIEW_STRUCTURES_TOP_PERFORMERS })
      .all();
    const topStructures = topRecords.map(mapPromptStructure).map((s) => ({
      ...s,
      rewardScore: calculateRewardScore(s)
    })).slice(0, topCount);

    const underRecords = await base(process.env.VITE_AIRTABLE_STRUCTURES_TABLE)
      .select({ view: process.env.VITE_VIEW_STRUCTURES_UNDEREXPLORED })
      .all();
    const underexplored = underRecords.map(mapPromptStructure).map((s) => ({
      ...s,
      rewardScore: calculateRewardScore(s)
    })).slice(0, exploreCount);

    const result = await generatePromptIdeas(topStructures, underexplored);
    const ideasToCreate = result.ideas.slice(0, targetBatchSize);

    const createdIdeas = [];
    for (const idea of ideasToCreate) {
      try {
        const parentRecordId = idea.parentStructureId
          ? await getStructureRecordId(idea.parentStructureId)
          : null;
        const record = await base(process.env.VITE_AIRTABLE_IDEAS_TABLE).create({
          [process.env.VITE_COL_SKELETON]: idea.skeleton,
          [process.env.VITE_COL_RENDERER]: idea.renderer,
          [process.env.VITE_COL_STATUS]: process.env.VITE_STATUS_PROPOSED,
          [process.env.VITE_COL_PROPOSED_BY]: 'AI System',
          [process.env.VITE_COL_REWARD]: idea.rewardEstimate,
          [process.env.VITE_COL_NOTES]: idea.rationale,
          ...(parentRecordId ? { [process.env.VITE_COL_PARENT]: [parentRecordId] } : {})
        });
        createdIdeas.push(mapPromptIdea(record));
      } catch (err) {
        console.error('Failed to create idea in batch:', err);
      }
    }

    if (
      settings.id &&
      process.env.VITE_COL_BATCH_COMPLETE &&
      createdIdeas.length === ideasToCreate.length &&
      createdIdeas.length > 0
    ) {
      try {
        await base(process.env.VITE_AIRTABLE_SETTINGS_TABLE).update(settings.id, {
          [process.env.VITE_COL_BATCH_COMPLETE]: true
        });
      } catch (err) {
        console.error('Failed to mark batch complete:', err);
      }
    }

    res.json({
      ideas: createdIdeas,
      totalGenerated: createdIdeas.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running batch:', error);
    res.status(500).json({ error: error?.message || 'Failed to run batch' });
  }
});

/**
 * GET /api/replicate/prediction/:id
 * Get the status of a prediction
 */
app.get('/api/replicate/prediction/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${REPLICATE_API_BASE}/predictions/${id}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', errorText);
      return res.status(response.status).json({ 
        error: `Replicate API error: ${errorText}` 
      });
    }

    const prediction = await response.json();
    res.json(prediction);

  } catch (error) {
    console.error('Error getting prediction:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get prediction status' 
    });
  }
});

/**
 * POST /api/replicate/prediction/:id/cancel
 * Cancel a running prediction
 */
app.post('/api/replicate/prediction/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${REPLICATE_API_BASE}/predictions/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', errorText);
      return res.status(response.status).json({ 
        error: `Replicate API error: ${errorText}` 
      });
    }

    const prediction = await response.json();
    res.json(prediction);

  } catch (error) {
    console.error('Error canceling prediction:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to cancel prediction' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Replicate API proxy is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Replicate API proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
