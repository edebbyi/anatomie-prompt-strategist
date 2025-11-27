Add these to your `.env` file:

```bash
# Backend API URL
VITE_API_BASE=http://localhost:3001/api

# Replicate API Token
VITE_REPLICATE_API_TOKEN=<your_replicate_api_token>

# Model IDs
VITE_REPLICATE_MODEL_IMAGEFX=google/imagen-4-ultra
VITE_REPLICATE_MODEL_RECRAFT=recraft-ai/recraft-v3
```

## Running the Application

You need to run **both** the frontend and backend servers:

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

### Option 2: Run Both Together (macOS/Linux)

```bash
npm run dev:all
```

The backend runs on `http://localhost:3001` and the frontend on `http://localhost:3000`.

## API Usage

### ImageFX (Imagen 4 Ultra)

**Endpoint:** `POST https://api.replicate.com/v1/models/google/imagen-4-ultra/predictions`

**Request Body:**
```json
{
  "input": {
    "prompt": "Your prompt text here",
    "aspect_ratio": "16:9"
  }
}
```

**Supported Aspect Ratios:**
- `1:1` - Square
- `16:9` - Landscape (default)
- `9:16` - Portrait
- `4:3` - Standard landscape
- `3:4` - Standard portrait

### Recraft V3

**Endpoint:** `POST https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions`

**Request Body:**
```json
{
  "input": {
    "prompt": "Your prompt text here",
    "size": "1365x1024",
    "style": "any"
  }
}
```

**Supported Sizes:**
- `1024x1024` - Square
- `1365x1024` - Landscape (default)
- `1024x1365` - Portrait
- `1536x1024` - Wide landscape
- `1024x1536` - Tall portrait
- `1820x1024` - Ultra-wide landscape
- `1024x1820` - Ultra-tall portrait
- `1024x2048` - Extra tall portrait
- `2048x1024` - Extra wide landscape
- `1434x1024` - Wide landscape
- `1024x1434` - Tall portrait
- `1024x1280` - Tall
- `1280x1024` - Wide
- `1024x1707` - Very tall portrait
- `1707x1024` - Very wide landscape

**Supported Styles:**
- `any` - No specific style (default)
- `realistic_image` - Photorealistic
- `digital_illustration` - Digital art
- `vector_illustration` - Vector graphics
- `icon` - Icon design

## Code Implementation

### Service Layer (`src/services/replicate.ts`)

The Replicate service provides these functions:

```typescript
// Generate image with ImageFX
generateImageFX(input: ReplicateImageFXInput): Promise<ReplicatePrediction>

// Generate image with Recraft
generateRecraft(input: ReplicateRecraftInput): Promise<ReplicatePrediction>

// Auto-detect renderer and generate
generateImage(renderer: string, prompt: string): Promise<ReplicatePrediction>

// Get prediction status
getPredictionStatus(predictionId: string): Promise<ReplicatePrediction>

// Cancel a running prediction
cancelPrediction(predictionId: string): Promise<ReplicatePrediction>
```

### Component Integration (`src/components/TestLiveModal.tsx`)

The `TestLiveModal` component uses the Replicate API when users click "Generate Image":

1. Detects the renderer type (ImageFX or Recraft)
2. Calls the appropriate Replicate API
3. Waits for the prediction to complete (using `Prefer: wait` header)
4. Displays the generated image
5. Allows download, rating, and approval

## How It Works

1. **User clicks "Test Live"** on a prompt idea card
2. **Modal opens** showing the prompt details
3. **User clicks "Generate Image"**
4. **API call is made** to Replicate based on the renderer type
5. **Loading state** shows while the image is being generated
6. **Image is displayed** when generation completes
7. **User can rate, download, or approve** the generated image

## Error Handling

If the Replicate API fails:
- An error toast notification is shown
- The app falls back to showing an example image
- The error is logged to the console for debugging

## Testing

To test the integration:

1. Make sure your `.env` file has the correct `VITE_REPLICATE_API_TOKEN`
2. Restart the dev server: `npm run dev`
3. Navigate to "Today's Ideas"
4. Click "Test Live" on any prompt idea
5. Click "Generate Image"
6. Wait for the image to generate (may take 10-30 seconds)

## API Limits

- Replicate has rate limits based on your account tier
- Each prediction costs credits based on the model used
- Check your [Replicate dashboard](https://replicate.com/account) for usage and billing

## Troubleshooting

### "Failed to generate image" error
- Check that your API token is valid
- Verify you have credits in your Replicate account
- Check the browser console for detailed error messages

### Image not displaying
- Check the network tab to see if the API call succeeded
- Verify the prediction status is "succeeded"
- Check that the output URL is accessible

### Slow generation
- Image generation can take 10-60 seconds depending on the model
- The `Prefer: wait` header makes the API wait for completion
- Consider implementing polling for long-running predictions
