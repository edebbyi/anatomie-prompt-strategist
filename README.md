
# Anatomie Prompt Hub

Production workflow for reviewing and testing AI-generated fashion prompt ideas. An AI Prompt Strategist agent generates daily candidate structures; the team reviews, tests, and approves them for automated image generation. Frontend (Vite/React) lives on Netlify, backend (Express) lives on Render, and Airtable/Replicate/OpenAI are proxied through the backend so secrets stay server-side.

## Quick Start
```bash
npm install

# run backend (Express proxy on :3001)
npm run server

# run frontend (Vite dev server on :3000, configured to hit the backend)
npm run dev
```

## Deployment
- **Frontend (Netlify)**: Build command `npm run build`, publish directory `build` (see `netlify.toml`). Only `VITE_API_BASE` is required and should point to your Render backend (e.g., `https://your-backend.onrender.com`); all other secrets stay on the backend.
- **Backend (Render)**: Start command `npm run server`. Set Airtable/OpenAI/Replicate env vars in Render (same names as `.env`).

## Project Structure
```
├─ build/                   # Vite build output (publish this on Netlify)
├─ public/                  # Static assets (favicon, etc.)
├─ server/                  # Express backend proxy (Replicate, Airtable, batch)
│  └─ index.js
├─ src/
│  ├─ components/           # React UI (cards, modals, pages)
│  ├─ services/             # Frontend API clients (talk to backend)
│  ├─ types/                # Shared TypeScript types
│  └─ vite.config.ts
├─ netlify.toml             # Netlify build settings
├─ render.yaml              # Render service definition (backend)
├─ package.json             # Scripts and dependencies
└─ .env                     # Local dev env vars (not committed; copy to Render/Netlify)
```

## Scripts
- `npm run dev`        – Start Vite dev server (frontend).
- `npm run server`     – Start Express backend proxy.
- `npm run dev:all`    – Run backend and frontend together.
- `npm run build`      – Build frontend to `build/` for Netlify.
  
