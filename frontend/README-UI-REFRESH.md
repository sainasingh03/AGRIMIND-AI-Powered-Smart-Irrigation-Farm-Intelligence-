# AGRIMIND — premium dashboard refresh

This package is a UI/layout refresh for the existing React + Vite frontend. It preserves the existing FarmContext, backend, and Field / Intelligence / Reports pages.

## Install
1. Back up the current `frontend` directory.
2. Extract this package.
3. Copy the extracted `frontend/src` files into your project's `frontend/src`, replacing files when prompted.
4. Keep your existing `backend` directory and `.env` files.
5. From `frontend/`, run `npm install` and `npm run dev`.
6. In another terminal, start the backend from `backend/` using `npm run dev`.

## Main changes
- Rebuilt the Dashboard page into a responsive, three-column agritech dashboard.
- Added a fixed forest-green navigation sidebar on desktop and compact navigation on mobile.
- Added live/demo status, farm summary, metrics, weather panel, trend chart, decision panel, risk flags, scenario controls, forecast and activity panels.
- Added CSS for responsive layouts and consistent typography, spacing, cards, focus states, and buttons.
- Connected actions to existing FarmContext methods: `calculateMDP`, `analyzeWithAI`, `runScenario`, `refreshTelemetry`, and `refreshWeather`.

## Data honesty
- Weather and forecast values depend on the backend response and may be unavailable.
- Sensor values are simulated unless actual IoT devices are connected.
- Trend chart values are labelled illustrative until historical sensor data is connected.
- The Scout risk panel uses explicit threshold rules. It is a rule-based decision-support feature, not a trained predictive model or autonomous pump controller.
- The hero and field images use Unsplash URLs and require internet access.

## Verify locally
From `frontend/`:
```powershell
npm run build
npm run lint
```
Then test all four navigation destinations and the MDP, Q-learning, refresh, and scenario actions with the backend running.
