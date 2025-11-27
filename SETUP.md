# Prompt Strategist Dashboard - Setup Guide

## Prerequisites

1. **Airtable Account** with:
   - Personal Access Token (with `data.records:read`, `data.records:write`, `schema.bases:read` scopes)
   - Base ID: `appW8hvRj3lUrgEH2`
   
2. **OpenAI API Key** with GPT-4o access

3. **n8n Instance** (optional, for email notifications)

## Step 1: Create Airtable Views

### In "Prompt Ideas" Table:

1. **All** - No filters, sort by Created At (desc)
2. **Proposed** - Filter: Status = "Proposed", sort by Created At (desc)
3. **Pending** - Filter: Status = "Pending"
4. **Approved** - Filter: Status = "Approved", sort by Approved At (desc)
5. **Declined** - Filter: Status = "Declined"
6. **This Week** - Filter: Created At is within "this week"
7. **Today** - Filter: Created At is "today"

### In "Prompt Structures" Table:

1. **Active** - Filter: Status = "Active"
2. **All** - No filters
3. **Top Performers** - Filter: Status = "Active", AI Score ≥ 8, sort by formula field (Reward Score) desc
4. **Recraft** - Filter: Renderer = "Recraft", Status = "Active"
5. **ImageFX** - Filter: Renderer = "ImageFX", Status = "Active"
6. **Under-explored** - Filter: usage_count < 5, AI Score ≥ 7

### In "Daily Batch Settings" Table:

1. **Main** - No filters (there should only be one record)

## Step 2: Get View IDs

For each view created above:

1. Click on the view in Airtable
2. Look at the URL: `https://airtable.com/appW8hvRj3lUrgEH2/tblXXX/viwYYYYYYYYYYYYYY`
3. Copy the `viw...` part (that's the View ID)
4. Paste into your `.env` file

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env` and fill in:
```bash
# Required
VITE_AIRTABLE_API_KEY=pat...
VITE_AIRTABLE_BASE_ID=appW8hvRj3lUrgEH2
VITE_OPENAI_API_KEY=sk-proj-...

# View IDs (from Step 2)
VITE_VIEW_IDEAS_PROPOSED=viw...
VITE_VIEW_STRUCTURES_TOP_PERFORMERS=viw...
# ... etc
```

## Step 4: Install & Run
```bash
npm install
npm run dev
```

## Step 5: Test Batch Generation

1. Navigate to Settings page
2. Enable "Batch Generation"
3. Set batch size (recommended: 5)
4. Click "Run Batch Now"

## Troubleshooting

**No ideas appearing?**
- Check View IDs are correct
- Verify Airtable API key has correct permissions
- Check browser console for errors

**Batch generation fails?**
- Verify OpenAI API key
- Check you have GPT-4o access
- Ensure you have Active structures in Airtable

**Can't approve ideas?**
- Check Status column in Ideas table matches env var exactly
- Verify linked record fields are configured correctly
