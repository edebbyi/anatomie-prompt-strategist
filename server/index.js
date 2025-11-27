import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

