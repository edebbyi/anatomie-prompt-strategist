import OpenAI from 'openai';
import { PromptStructure, GeneratedIdea, BatchGenerationResult } from '@/types/airtable';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for development
});

export const SYSTEM_PROMPT = `You are an elite Prompt Strategist for ANATOMIE, a luxury performance travel wear brand.

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

export async function generatePromptIdeas(
  topStructures: PromptStructure[],
  underexploredStructures: PromptStructure[]
): Promise<BatchGenerationResult> {
  try {
    // Build context from structures
    const context = buildContextFromStructures(topStructures, underexploredStructures);

    const response = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o',
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
      temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.9'),
      // max_tokens is not supported on some models; use max_completion_tokens instead
      max_completion_tokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '3000'),
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

    // Validate each idea
    const validIdeas = parsed.ideas.filter((idea: any) =>
      idea.skeleton &&
      idea.renderer &&
      idea.rationale &&
      typeof idea.rewardEstimate === 'number'
    );

    if (validIdeas.length === 0) {
      throw new Error('No valid ideas generated');
    }

    return {
      ideas: validIdeas,
      totalGenerated: validIdeas.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating prompt ideas:', error);
    throw new Error(`Failed to generate ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildContextFromStructures(
  topStructures: PromptStructure[],
  underexploredStructures: PromptStructure[]
): { topPerformers: string; underexplored: string } {
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
}
