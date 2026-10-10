const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FARM = {
  id: 'GVF-001', name: 'Green Valley Farm',
  location: { latitude: 26.4499, longitude: 80.3319, city: 'Kanpur', region: 'Uttar Pradesh' },
  crop: { name: 'Wheat', growthStage: 'Vegetative' },
  sensors: { soilMoisture: 28, temperature: 34, humidity: 46, rainProbability: 12 },
  irrigation: { tankLevel: 72, pumpStatus: 'OFF' },
  metadata: { sensorMode: 'SIMULATED', updatedAt: new Date().toISOString() }
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));
const num = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
let telemetry = { ...FARM.sensors, tankLevel: FARM.irrigation.tankLevel, updatedAt: new Date().toISOString(), source: 'SIMULATED' };
let lastWeatherPayload = null;
let lastWeatherAt = 0;
let weatherPromise = null;
let qTable = Object.create(null);
let learningSteps = 0;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

function normalizeSensors(raw = {}) {
  return {
    soilMoisture: clamp(num(raw.soilMoisture, telemetry.soilMoisture), 0, 100),
    temperature: clamp(num(raw.temperature, telemetry.temperature), -10, 60),
    humidity: clamp(num(raw.humidity, telemetry.humidity), 0, 100),
    rainProbability: clamp(num(raw.rainProbability, telemetry.rainProbability), 0, 100),
    tankLevel: clamp(num(raw.tankLevel, telemetry.tankLevel), 0, 100),
  };
}
function stateFor(s) {
  const soil = s.soilMoisture;
  const heat = s.temperature;
  const rain = s.rainProbability;
  if (soil >= 78) return 'WET';
  if (rain >= 70 && soil >= 30) return 'RAIN_EXPECTED';
  if (soil < 22 && heat >= 32 && rain < 45) return 'DRY_HOT';
  if (soil < 30 && rain < 45) return 'DRY';
  if (heat >= 38 && soil < 40) return 'HEAT_STRESS';
  if (soil >= 30 && soil <= 65) return 'OPTIMAL';
  return 'TRANSITIONAL';
}
function decide(raw) {
  const s = normalizeSensors(raw);
  const state = stateFor(s);
  let action = 'MONITOR'; let waterAmount = 0; let reason = 'Moisture is within the operating band; continue monitoring.';
  // Safety rules take precedence over the learned policy.
  if (s.soilMoisture >= 78) {
    action = 'STOP'; reason = 'Soil is already very wet. Do not add water.';
  } else if (s.rainProbability >= 70 && s.soilMoisture >= 30) {
    action = 'DELAY'; reason = 'High rain probability and non-critical soil moisture; delay and reassess.';
  } else if (s.tankLevel < 8) {
    action = 'ALERT_LOW_TANK'; reason = 'Water reserve is critically low. Refill before irrigation.';
  } else if (s.soilMoisture < 30 && s.rainProbability < 45) {
    action = 'IRRIGATE';
    // Estimated mm-equivalent per acre is intentionally conservative and capped.
    waterAmount = clamp(Math.round((34 - s.soilMoisture) * 1.2), 5, 25);
    if (s.tankLevel < 20) waterAmount = Math.min(waterAmount, 8);
    reason = `Soil moisture is ${s.soilMoisture}%, below the 30% trigger, and rain probability is ${s.rainProbability}%. Apply a measured irrigation dose and recheck.`;
  } else if (s.temperature >= 38 && s.soilMoisture < 40) {
    action = 'IRRIGATE'; waterAmount = clamp(Math.round((40 - s.soilMoisture) * 0.7), 5, 18);
    reason = 'Heat stress risk is elevated while soil moisture is low; use a smaller monitored dose.';
  }
  const confidence = action === 'MONITOR' ? 0.78 : action === 'IRRIGATE' ? 0.86 : 0.9;
  return { state, currentState: state, action, recommendedAction: action, waterAmount, confidence, reason,
    recommendation: { action, waterAmount, reason }, sensors: s, source: 'MDP_RULE_POLICY', simulated: true, createdAt: new Date().toISOString() };
}
function qLearn(raw) {
  const s = normalizeSensors(raw); const state = stateFor(s); const baseline = decide(s);
  const actions = ['IRRIGATE', 'MONITOR', 'DELAY', 'STOP'];
  if (!qTable[state]) qTable[state] = Object.fromEntries(actions.map(a => [a, 0]));
  // A small online tabular Q update with safety guardrails; it learns from a transparent reward model.
  const reward = (action) => {
    if (s.soilMoisture >= 78) return action === 'STOP' ? 10 : action === 'MONITOR' ? 2 : -15;
    if (s.rainProbability >= 70 && s.soilMoisture >= 30) return action === 'DELAY' ? 8 : action === 'STOP' ? 2 : -8;
    if (s.soilMoisture < 30 && s.rainProbability < 45) return action === 'IRRIGATE' ? 8 : action === 'MONITOR' ? -4 : -5;
    return action === 'MONITOR' ? 5 : action === 'IRRIGATE' ? -3 : 1;
  };
  const chosen = actions.reduce((best, a) => qTable[state][a] > qTable[state][best] ? a : best, actions[0]);
  const alpha = 0.25; qTable[state][chosen] += alpha * (reward(chosen) - qTable[state][chosen]); learningSteps += 1;
  // Safety constraints always override the exploration policy.
  const safeAction = (s.soilMoisture >= 78 || s.tankLevel < 8) ? baseline.action :
    (s.rainProbability >= 70 && s.soilMoisture >= 30) ? 'DELAY' :
    (s.soilMoisture < 30 && s.rainProbability < 45) ? 'IRRIGATE' : chosen;
  const selected = safeAction === baseline.action ? baseline : { ...baseline, action: safeAction, recommendedAction: safeAction,
    waterAmount: safeAction === 'IRRIGATE' ? baseline.waterAmount : 0,
    reason: safeAction === 'IRRIGATE' ? baseline.reason : `Learned policy selected ${safeAction}; safety constraints remain active.`,
    recommendation: { ...baseline.recommendation, action: safeAction, waterAmount: safeAction === 'IRRIGATE' ? baseline.waterAmount : 0 } };
  return { ...selected, source: 'ONLINE_TABULAR_Q_LEARNING', learningSteps, qValues: qTable[state], policyConfidence: Math.min(0.95, 0.65 + learningSteps * 0.002) };
}

async function getWeather() {
  const now = Date.now();
  // Cache a successful payload for 15 minutes; avoid duplicate simultaneous provider calls.
  if (lastWeatherPayload && now - lastWeatherAt < 15 * 60 * 1000) return { ...lastWeatherPayload, cacheAgeSeconds: Math.round((now-lastWeatherAt)/1000) };
  if (weatherPromise) return weatherPromise;
  weatherPromise = (async () => {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=26.4499&longitude=80.3319&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=7&timezone=Asia%2FKolkata';
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
      const data = await response.json();
      const current = data.current || {}; const daily = data.daily || {};
      lastWeatherPayload = {
        current: { temperature: current.temperature_2m, humidity: current.relative_humidity_2m, rain: current.rain, precipitation: current.precipitation, windSpeed: current.wind_speed_10m, weatherCode: current.weather_code,
          rainProbability: daily.precipitation_probability_max?.[0] ?? null, observedAt: current.time, source: 'Open-Meteo', stale: false },
        forecast: (daily.time || []).map((date, i) => ({ date, temperatureMax: daily.temperature_2m_max?.[i], temperatureMin: daily.temperature_2m_min?.[i], rainProbability: daily.precipitation_probability_max?.[i], weatherCode: daily.weather_code?.[i], source: 'Open-Meteo' })),
        source: 'Open-Meteo', stale: false, fetchedAt: new Date().toISOString()
      };
      lastWeatherAt = Date.now(); return lastWeatherPayload;
    } catch (error) {
      if (lastWeatherPayload) return { ...lastWeatherPayload, stale: true, warning: `${error.message}; returning cached weather.`, fetchedAt: new Date(lastWeatherAt).toISOString() };
      throw error;
    } finally { clearTimeout(timeout); weatherPromise = null; }
  })();
  return weatherPromise;
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'AGRIMIND API', time: new Date().toISOString(), weatherCache: Boolean(lastWeatherPayload), learningSteps }));
app.get('/api/irrigation/farm', (_req, res) => res.json({ ...FARM, sensors: telemetry, metadata: { ...FARM.metadata, updatedAt: telemetry.updatedAt } }));
app.get('/api/sensor/telemetry', (_req, res) => res.json({ ...telemetry, sensors: { ...telemetry }, source: 'SIMULATED', updatedAt: telemetry.updatedAt }));
app.post('/api/sensor/telemetry', (req, res) => {
  telemetry = { ...telemetry, ...normalizeSensors(req.body?.sensors || req.body || {}), updatedAt: new Date().toISOString(), source: 'SIMULATED' };
  res.json({ ok: true, ...telemetry });
});
app.get('/api/irrigation/policy', (_req, res) => res.json({ algorithm: 'MDP + online tabular Q-learning', states: ['DRY_HOT','DRY','RAIN_EXPECTED','WET','OPTIMAL','HEAT_STRESS','TRANSITIONAL'], actions: ['IRRIGATE','MONITOR','DELAY','STOP'], learningSteps, qTable }));
app.post('/api/irrigation/decision', (req, res) => res.json(decide(req.body?.sensors || req.body || telemetry)));
app.post('/api/irrigation/q-learning', (req, res) => res.json(qLearn(req.body?.sensors || req.body || telemetry)));
app.post('/api/irrigation/transitions', (req, res) => {
  const sensors = normalizeSensors(req.body?.sensors || req.body || {}); const decision = decide(sensors);
  res.json({ state: decision.state, currentState: decision.state, action: decision.action, recommendedAction: decision.action, reward: decision.action === 'IRRIGATE' ? 5 : decision.action === 'STOP' ? 3 : 1, nextState: stateFor({ ...sensors, soilMoisture: clamp(sensors.soilMoisture + (decision.action === 'IRRIGATE' ? decision.waterAmount * 0.5 : 0), 0, 100) }), decision, sensors, createdAt: new Date().toISOString() });
});
app.get('/api/weather/current', async (_req, res) => {
  try { const w = await getWeather(); res.json({ ...w.current, stale: w.stale, source: w.source, fetchedAt: w.fetchedAt, warning: w.warning }); }
  catch (e) { res.status(503).json({ error: 'Weather temporarily unavailable', message: e.message, stale: false, source: 'Open-Meteo' }); }
});
app.get('/api/weather/forecast', async (_req, res) => {
  try { const w = await getWeather(); res.json({ forecast: w.forecast, stale: w.stale, source: w.source, fetchedAt: w.fetchedAt, warning: w.warning }); }
  catch (e) { res.status(503).json({ error: 'Forecast temporarily unavailable', message: e.message, stale: false, source: 'Open-Meteo' }); }
});
app.use((err, _req, res, _next) => { console.error('API error:', err); res.status(500).json({ error: 'Internal server error', message: err.message }); });
app.listen(PORT, () => console.log(`AGRIMIND API listening on http://127.0.0.1:${PORT}\nHealth: /health\nWeather: cached Open-Meteo (15 min)\nSensors: simulated; MDP + tabular Q-learning enabled`));
