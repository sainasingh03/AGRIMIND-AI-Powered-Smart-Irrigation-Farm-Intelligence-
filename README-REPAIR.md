# AGRIMIND integration repair

This patch bundle contains a frontend and a compatible local Express backend. Back up your project first.

## Why weather was failing
The pasted server log shows Open-Meteo HTTP 429: hourly API request limit exceeded. Repeated frontend retries were making this worse. The backend in this bundle makes one request for current + daily weather, caches it for 15 minutes, shares concurrent requests, and returns cached data marked `stale` if the provider temporarily rate-limits requests. If there is no cached observation and Open-Meteo is unavailable, the API returns a clear 503; it never labels made-up weather as live.

## Install backend
From the `backend` directory:

```powershell
npm install
npm run dev
```

Check `http://127.0.0.1:5000/health`.

## Install frontend
From the `frontend` directory in another terminal:

```powershell
npm install
npm run dev
```

The frontend uses `http://127.0.0.1:5000` by default. Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

## API routes
- `GET /health`
- `GET /api/irrigation/farm`
- `GET /api/sensor/telemetry`
- `POST /api/sensor/telemetry`
- `GET /api/irrigation/policy`
- `POST /api/irrigation/decision`
- `POST /api/irrigation/q-learning`
- `POST /api/irrigation/transitions`
- `GET /api/weather/current`
- `GET /api/weather/forecast`

## Decision/sensor truthfulness
- Soil moisture, tank level and telemetry are SIMULATED in this bundle. No physical sensors are connected.
- Weather comes from Open-Meteo and includes a source/timestamp; cached weather is marked stale.
- MDP endpoint uses explicit safety rules and interpretable state/action decisions.
- Q-learning endpoint performs online tabular updates using a transparent reward function, with safety constraints overriding unsafe actions. This is a demonstration learning agent, not a validated agronomic model.
- Irrigation decisions are recommendations only. They do not control a physical pump.

## Important
The backend provided here is a compatible replacement API because the original backend source files were not present in the uploaded `frontend.zip`. Back up the current backend before deciding whether to merge or replace it. Do not push `.env`, credentials, `node_modules`, or `dist` to GitHub.
