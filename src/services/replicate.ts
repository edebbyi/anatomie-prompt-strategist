/**
 * Replicate API Service
 * Handles image generation using Replicate's API for ImageFX (Imagen 4 Ultra) and Recraft models
 * Calls our backend API proxy to avoid CORS issues
 */

const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const API_BASE = rawBase.endsWith('/api')
  ? rawBase
  : `${rawBase.replace(/\/$/, '')}/api`;

export interface ReplicateImageFXInput {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface ReplicateRecraftInput {
  prompt: string;
  size?: '1024x1024' | '1365x1024' | '1024x1365' | '1536x1024' | '1024x1536' | '1820x1024' | '1024x1820' | '1024x2048' | '2048x1024' | '1434x1024' | '1024x1434' | '1024x1280' | '1280x1024' | '1024x1707' | '1707x1024';
  style?: 'any' | 'realistic_image' | 'digital_illustration' | 'vector_illustration' | 'icon';
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[]; // URL(s) to generated image(s)
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

/**
 * Generate an image using ImageFX (Google Imagen 4 Ultra)
 */
export async function generateImageFX(input: ReplicateImageFXInput): Promise<ReplicatePrediction> {
  const response = await fetch(`${API_BASE}/replicate/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      renderer: 'ImageFX',
      prompt: input.prompt,
      aspectRatio: input.aspect_ratio || '16:9',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`ImageFX generation failed: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Generate an image using Recraft V3
 */
export async function generateRecraft(input: ReplicateRecraftInput): Promise<ReplicatePrediction> {
  const response = await fetch(`${API_BASE}/replicate/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      renderer: 'Recraft',
      prompt: input.prompt,
      size: input.size || '1365x1024',
      style: input.style || 'any',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Recraft generation failed: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Generate an image based on renderer type
 */
export async function generateImage(
  renderer: string,
  prompt: string
): Promise<ReplicatePrediction> {
  const normalizedRenderer = renderer.toLowerCase();

  if (normalizedRenderer.includes('imagefx') || normalizedRenderer.includes('imagen')) {
    return generateImageFX({ prompt, aspect_ratio: '16:9' });
  } else if (normalizedRenderer.includes('recraft')) {
    return generateRecraft({ prompt, size: '1365x1024' });
  } else {
    throw new Error(`Unsupported renderer: ${renderer}. Only ImageFX and Recraft are supported.`);
  }
}

/**
 * Get the status of a prediction
 */
export async function getPredictionStatus(predictionId: string): Promise<ReplicatePrediction> {
  const response = await fetch(`${API_BASE}/replicate/prediction/${predictionId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to get prediction status: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel a running prediction
 */
export async function cancelPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const response = await fetch(`${API_BASE}/replicate/prediction/${predictionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to cancel prediction: ${error.error || response.statusText}`);
  }

  return response.json();
}
