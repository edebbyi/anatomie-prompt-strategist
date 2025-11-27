# Quick Start Guide

## Running the Application

This application requires **two servers** to run:

1. **Backend API Server** (port 3001) - Proxies requests to Replicate API
2. **Frontend Dev Server** (port 3000) - React application

### Start Both Servers

**Option 1: Two Separate Terminals**

Terminal 1:
```bash
npm run server
```

Terminal 2:
```bash
npm run dev
```

**Option 2: Single Command (macOS/Linux)**

```bash
npm run dev:all
```

### Access the Application

Open your browser to: **http://localhost:3000**

## Testing Image Generation

1. Navigate to **"Today's Ideas"**
2. Click **"Test Live"** on any prompt idea
3. Click **"Generate Image"**
4. Wait 10-30 seconds for the image to generate
5. The generated image will appear!

## Troubleshooting

### "Failed to fetch" Error

**Problem:** The backend server is not running.

**Solution:** Make sure you run `npm run server` in a separate terminal.

### "Connection refused" Error

**Problem:** The backend server is not accessible.

**Solution:** 
- Check that the backend is running on port 3001
- Verify `VITE_API_BASE=http://localhost:3001/api` in your `.env` file

### No Ideas Showing

**Problem:** Timezone mismatch between Airtable and local time.

**Solution:** The app now uses local timezone dates. Make sure you have ideas created in Airtable for today's date.

### Replicate API Errors

**Problem:** Invalid API token or insufficient credits.

**Solution:**
- Check that `VITE_REPLICATE_API_TOKEN` is set correctly in `.env`
- Verify you have credits in your [Replicate account](https://replicate.com/account)

## Environment Variables

Make sure your `.env` file has these variables:

```bash
# Backend API
VITE_API_BASE=http://localhost:3001/api

# Replicate
VITE_REPLICATE_API_TOKEN=your-token-here
VITE_REPLICATE_MODEL_IMAGEFX=google/imagen-4-ultra
VITE_REPLICATE_MODEL_RECRAFT=recraft-ai/recraft-v3

# Airtable
VITE_AIRTABLE_API_KEY=your-key-here
VITE_AIRTABLE_BASE_ID=your-base-id-here
# ... (other Airtable variables)
```

## Project Structure

```
anatomie-prompt-strategist/
├── server/              # Backend API server
│   ├── index.js        # Express server
│   └── README.md       # Backend documentation
├── src/                # Frontend React app
│   ├── components/     # React components
│   ├── services/       # API services
│   │   ├── airtable.ts
│   │   └── replicate.ts
│   └── ...
├── docs/               # Documentation
│   └── REPLICATE_INTEGRATION.md
├── .env                # Environment variables
└── package.json        # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start frontend dev server (port 3000)
- `npm run server` - Start backend API server (port 3001)
- `npm run dev:all` - Start both servers (macOS/Linux)
- `npm run build` - Build frontend for production

## Next Steps

1. ✅ Both servers are running
2. ✅ Environment variables are configured
3. ✅ Replicate API integration is working
4. ✅ Local timezone dates are fixed

Now you can:
- Test prompt ideas with real image generation
- Rate and approve generated images
- Download generated images
- Track prompt performance

## Support

For more detailed information:
- Backend API: See `server/README.md`
- Replicate Integration: See `docs/REPLICATE_INTEGRATION.md`
- General Setup: See `SETUP.md`

