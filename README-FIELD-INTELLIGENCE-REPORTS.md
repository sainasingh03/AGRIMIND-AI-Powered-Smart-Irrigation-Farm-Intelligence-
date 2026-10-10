# AGRIMIND Premium Field, Intelligence & Reports UI

This package upgrades the existing Field, Intelligence and Reports screens with a coordinated responsive visual system. It preserves the existing React page components and FarmContext integrations, and loads `src/premium-pages.css` after the existing stylesheets so the premium overrides take precedence.

## Apply to your project
1. Back up your existing `frontend/src` directory.
2. Copy the included `frontend/src/premium-pages.css` into your project at `frontend/src/premium-pages.css`.
3. In `frontend/src/main.jsx`, add `import "./premium-pages.css";` after the existing CSS imports. If you copy the included `main.jsx`, it already contains the import.
4. Start backend and frontend in separate terminals as usual.
5. Run `npm run build` from `frontend` to verify locally.

## Notes
- Existing API calls and page logic are intentionally preserved.
- The Field map uses external map tiles and needs internet access.
- Sensor telemetry should be labelled simulated unless real sensors are connected.
- CSS cannot fix backend weather-provider errors or incorrect decision-engine logic; those require checking the API response and backend service.
