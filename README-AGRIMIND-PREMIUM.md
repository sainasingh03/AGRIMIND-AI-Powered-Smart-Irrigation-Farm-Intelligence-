# AGRIMIND — Premium Smart Irrigation Dashboard

This package contains the AGRIMIND frontend refresh and the companion backend included in the repair bundle.

## Features
- Responsive premium dashboard inspired by the supplied reference
- Sidebar navigation on desktop; compact navigation on mobile
- Hero and field photography (remote Unsplash image URLs; internet required for photos)
- Sensor cards, weather panel, forecast panel, chart, decision panel, activity list
- MDP, Q-learning, refresh, explainable rule-based risk scan, and scenario controls wired to FarmContext
- Reveal/entry motion with reduced-motion accessibility support
- Explicit provenance labels: sensor values are simulated; chart history is illustrative unless real historical data is stored

## Start locally (Windows PowerShell)

Terminal 1:
```powershell
cd "C:\Users\saina\OneDrive\ドキュメント\Desktop\agrimind\backend"
npm install
npm run dev
```

Terminal 2:
```powershell
cd "C:\Users\saina\OneDrive\ドキュメント\Desktop\agrimind\frontend"
npm install
npm run dev
```

Open the Vite URL shown in Terminal 2. Test `http://127.0.0.1:5000/health` in a browser.

## Production build
Run inside `frontend`:
```powershell
npm run build
```

## Data and safety notes
- Real-time weather depends on the weather provider and backend availability. Cached or fallback values must not be interpreted as live observations.
- Sensor telemetry is simulated unless real sensor hardware is integrated.
- The dashboard's field agent is transparent threshold/rule-based detection, not a trained AI forecasting model.
- Q-learning quality depends on the backend implementation, reward design, training episodes and persisted Q-table. Validate recommendations against agronomic guidance before real use.
- No physical pump control is enabled by this UI package.
- The package has not been tested against your local machine or hardware. Verify all routes and UI actions before publishing or relying on decisions.
