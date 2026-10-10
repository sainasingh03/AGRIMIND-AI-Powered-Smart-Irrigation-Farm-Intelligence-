# AGRIMIND frontend redesign

This package is a UI/source update for the existing AGRIMIND React + Vite frontend. It preserves the existing pages and FarmContext integration, adds a screenshot-inspired responsive visual system, farm imagery, and a transparent rule-based field assistant.

## Run locally

1. Keep your existing backend folder and `.env` files.
2. Back up your current `frontend/src` folder.
3. Copy the files in this `frontend` folder over the matching files in your existing frontend project. Do not copy `node_modules` or `dist`.
4. In PowerShell:

```powershell
cd "C:\Users\saina\OneDrive\ドキュメント\Desktop\agrimind\frontend"
npm install
npm run dev
```

5. In another terminal, start your existing backend from its `backend` folder with `npm run dev`.
6. Run `npm run build` from the frontend folder before committing.

## Agent scope and data honesty

- The field assistant detects simple threshold-based moisture/heat/rain risk signals and estimates 24-hour moisture with a transparent heuristic. It is not a trained forecasting model or autonomous LLM agent.
- `Run irrigation analysis` calls the existing context's `analyzeWithAI` method, which attempts the configured backend endpoint and may use a local fallback if the endpoint fails.
- `Test dry-field scenario` uses simulated inputs; it does not change physical equipment.
- Soil moisture and tank telemetry are labelled simulated unless real hardware is connected. Weather/API status depends on backend responses.
- CSS uses a remote Unsplash image URL for the hero. A network connection is needed for that image; the rest of the UI still renders if the image is unavailable.

## Verify before claiming production-ready

- Start backend and verify `/health` and weather endpoints.
- Test MDP, Q-learning, and scenario actions in the browser.
- Check all four routes/pages at desktop and mobile widths.
- Run `npm run build` and inspect browser console/network errors.
