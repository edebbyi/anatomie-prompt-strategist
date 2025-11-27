# Backend API Server

This is a simple Express.js backend server that acts as a proxy for the Replicate API.

## Why Do We Need This?

The Replicate API cannot be called directly from the browser due to CORS (Cross-Origin Resource Sharing) restrictions. This backend server:

1. Receives requests from the frontend
2. Adds the Replicate API authentication token
3. Forwards requests to Replicate's API
4. Returns the results to the frontend

## Running the Server

```bash
npm run server
```

The server will start on `http://localhost:3001`

## API Endpoints

### POST /api/replicate/generate

Generate an image using Replicate.

**Request Body:**
```json
{
  "renderer": "ImageFX" | "Recraft",
  "prompt": "Your prompt text",
  "aspectRatio": "16:9",  // For ImageFX only
  "size": "1365x1024",    // For Recraft only
  "style": "any"          // For Recraft only
}
```

**Response:**
```json
{
  "id": "prediction-id",
  "status": "succeeded",
  "output": "https://replicate.delivery/image-url.jpg"
}
```

### GET /api/replicate/prediction/:id

Get the status of a prediction.

**Response:**
```json
{
  "id": "prediction-id",
  "status": "processing" | "succeeded" | "failed",
  "output": "https://replicate.delivery/image-url.jpg"
}
```

### POST /api/replicate/prediction/:id/cancel

Cancel a running prediction.

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Replicate API proxy is running"
}
```

## Environment Variables

The server reads these from your `.env` file:

- `VITE_REPLICATE_API_TOKEN` - Your Replicate API token
- `VITE_REPLICATE_MODEL_IMAGEFX` - ImageFX model ID (default: `google/imagen-4-ultra`)
- `VITE_REPLICATE_MODEL_RECRAFT` - Recraft model ID (default: `recraft-ai/recraft-v3`)
- `PORT` - Server port (default: `3001`)

## Deployment

For production, you'll need to deploy this backend server to a hosting service like:

- **Vercel** (with serverless functions)
- **Netlify** (with serverless functions)
- **Railway**
- **Render**
- **Heroku**
- **AWS Lambda**

Make sure to:
1. Set the `VITE_API_BASE` environment variable in your frontend to point to your deployed backend
2. Set all required environment variables in your hosting service
3. Enable CORS for your frontend domain

