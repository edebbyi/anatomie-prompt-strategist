import { generatePromptIdeas } from './openai';
import {
  fetchTopPerformingStructures,
  fetchUnderexploredStructures,
  fetchSettings,
  createPromptIdea,
  fetchPromptIdeas,
  updateSettings
} from './airtable';
import { BatchGenerationResult } from '@/types/airtable';

export async function runDailyBatch(): Promise<BatchGenerationResult> {
  try {
    console.log('🚀 Starting daily batch generation...');

    // 1. Fetch settings
    const settings = await fetchSettings();

    if (!settings.batchEnabled) {
      throw new Error('Batch generation is disabled');
    }

    const targetBatchSize = settings.batchSize || 5;
    console.log(`Target batch size: ${targetBatchSize}`);

    // 2. Fetch top performing structures
    const topCount = parseInt(import.meta.env.VITE_TOP_STRUCTURES_COUNT || '10');
    const topStructures = await fetchTopPerformingStructures(topCount);
    console.log(`Fetched ${topStructures.length} top performers`);

    // 3. Fetch under-explored structures
    const exploreCount = parseInt(import.meta.env.VITE_EXPLORE_STRUCTURES_COUNT || '3');
    const underexplored = await fetchUnderexploredStructures(exploreCount);
    console.log(`Fetched ${underexplored.length} under-explored structures`);

    if (topStructures.length === 0) {
      throw new Error('No active structures found to analyze');
    }

    // 4. Generate ideas with OpenAI
    console.log('🤖 Calling OpenAI to generate ideas...');
    const result = await generatePromptIdeas(topStructures, underexplored);
    console.log(`Generated ${result.ideas.length} ideas`);

    // 5. Take only the batch size we need
    const ideasToCreate = result.ideas.slice(0, targetBatchSize);

    // 6. Write ideas to Airtable
    console.log(`💾 Writing ${ideasToCreate.length} ideas to Airtable...`);
    const createdIdeas = [];

    for (const idea of ideasToCreate) {
      try {
        const created = await createPromptIdea({
          skeleton: idea.skeleton,
          renderer: idea.renderer,
          // Airtable base expects "AI System" instead of "LLM"
          proposedBy: 'AI System',
          parentStructureId: idea.parentStructureId,
          rewardEstimate: idea.rewardEstimate,
          notes: idea.rationale
        });
        createdIdeas.push(created);
        console.log(`✅ Created idea ${created.ideaId}`);
      } catch (error) {
        console.error('Failed to create idea:', error);
      }
    }

    // 7. Check if we should send email
    if (settings.emailNotifications && createdIdeas.length >= targetBatchSize) {
      await sendBatchNotification(createdIdeas, settings.notificationEmail);
    }

    // Mark batch complete when all intended ideas were created
    if (
      settings.id &&
      import.meta.env.VITE_COL_BATCH_COMPLETE &&
      createdIdeas.length === ideasToCreate.length &&
      createdIdeas.length > 0
    ) {
      try {
        await updateSettings(settings.id, { batchComplete: true });
        console.log('✅ Marked batch as complete in Airtable');
      } catch (error) {
        console.error('Failed to mark batch as complete', error);
      }
    }

    console.log(`✨ Batch complete! Created ${createdIdeas.length} ideas`);

    return {
      ideas: result.ideas,
      totalGenerated: createdIdeas.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Batch generation failed:', error);
    throw error;
  }
}

async function sendBatchNotification(
  ideas: any[],
  email: string
): Promise<void> {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('No webhook URL configured, skipping email');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: import.meta.env.VITE_EMAIL_SUBJECT,
        ideas: ideas.map(idea => ({
          renderer: idea.renderer,
          skeleton: idea.skeleton.substring(0, 150) + '...',
          reward: idea.reward
        })),
        appUrl: import.meta.env.VITE_APP_URL
      })
    });

    if (!response.ok) {
      console.error('Failed to send email notification');
    } else {
      console.log('📧 Email notification sent');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Manual trigger for testing
export async function testBatchGeneration(): Promise<BatchGenerationResult> {
  return runDailyBatch();
}
