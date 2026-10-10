import { useMemo, useState } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, BrainCircuit, CheckCircle2,
  Cloud, CloudRain, Droplets, Gauge, Leaf, MapPin, RefreshCw,
  Sprout, Thermometer, Waves, Zap, FlaskConical, ShieldCheck,
  CircleAlert, Sparkles, Wind, Sun, Clock3
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis
} from "recharts";
import { useFarm } from "../context/FarmContext";
import "./Dashboard.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=88";
const FIELD_IMAGE = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=85";
const LEAF_IMAGE = "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=700&q=85";

const asNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const titleCase = (v) => String(v || "Awaiting analysis").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function MetricCard({ icon: Icon, label, value, unit, status, tone = "green", progress, detail }) {
  return <article className={`ag-metric tone-${tone}`}>
    <div className="ag-metric-top"><span className="ag-metric-icon"><Icon size={21} strokeWidth={1.8}/></span><span className="ag-status-chip">{status}</span></div>
    <p>{label}</p><div className="ag-metric-value">{value}<small>{unit}</small></div>
    <div className="ag-progress"><span style={{ width: `${clamp(progress, 0, 100)}%` }}/></div>
    <small className="ag-metric-detail">{detail}</small>
  </article>;
}

function MiniWeather({ day, icon: Icon, temp, rain }) {
  return <div className="ag-weather-day"><span>{day}</span><Icon size={19} strokeWidth={1.7}/><b>{temp}°</b><small>{rain ?? "—"}% rain</small></div>;
}

export default function Dashboard() {
  const {
    farm, sensors = {}, weather, forecast = [], recommendation, recommendedAction,
    waterAmount, policyConfidence, currentState, backendOnline, aiLoading,
    scenarioLoading, calculateMDP, analyzeWithAI, runScenario, refreshAll,
    refreshTelemetry, refreshWeather, decisionHistory = [], errors = {}, loading
  } = useFarm();
  const [busyAction, setBusyAction] = useState("");
  const [agentOpen, setAgentOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [scenario, setScenario] = useState({ soilMoisture: asNum(sensors.soilMoisture, 28), temperature: asNum(sensors.temperature, 34), humidity: asNum(sensors.humidity, 46), rainProbability: asNum(sensors.rainProbability, 12), tankLevel: asNum(sensors.tankLevel, farm?.irrigation?.tankLevel ?? 72) });

  const soil = clamp(asNum(sensors.soilMoisture, 28), 0, 100);
  const temp = asNum(weather?.temperature ?? weather?.temperature_2m ?? sensors.temperature, 34);
  const humidity = clamp(asNum(weather?.humidity ?? weather?.relative_humidity_2m ?? sensors.humidity, 46), 0, 100);
  const rain = clamp(asNum(weather?.rainProbability ?? weather?.precipitation_probability ?? sensors.rainProbability, 12), 0, 100);
  const tank = clamp(asNum(farm?.irrigation?.tankLevel ?? sensors.tankLevel, 72), 0, 100);
  const farmName = farm?.name || "Green Valley Farm";
  const cropName = farm?.crop?.name || "Wheat";
  const action = recommendedAction || recommendation?.action || "MONITOR";
  const confidence = clamp(asNum(policyConfidence, 60), 0, 100);
  const actionText = titleCase(action);
  const reason = recommendation?.reason || recommendation?.explanation || (soil < 30 && rain < 40 ? "Soil moisture is below the preferred range and rain is unlikely soon." : rain > 65 ? "Rain probability is high; reassess before adding irrigation." : "Conditions are being monitored. The decision engine will update when new signals arrive.");

  const trendData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const base = soil;
    return { day: ["Oct 03", "Oct 04", "Oct 05", "Oct 06", "Oct 07", "Oct 08", "Today"][i], soil: clamp(Math.round(base + Math.sin(i * 1.05) * 8 - (6 - i) * 1.2), 0, 100), temperature: Math.round(temp + Math.cos(i * .85) * 4), humidity: clamp(Math.round(humidity + Math.sin(i * .9 + 1) * 12), 0, 100) };
  }), [soil, temp, humidity]);

  const weatherDays = useMemo(() => {
    const rows = Array.isArray(forecast) ? forecast : (forecast?.daily || forecast?.forecast || []);
    return rows.slice(0, 5).map((row, i) => ({ day: row.day || row.date || ["Today", "Tue", "Wed", "Thu", "Fri"][i], temp: Math.round(asNum(row.temperature_2m_max ?? row.maxTemp ?? row.temperature ?? row.temp, temp)), rain: Math.round(asNum(row.precipitation_probability_max ?? row.rainProbability ?? row.precipitation_probability, rain)), icon: asNum(row.precipitation_probability_max ?? row.rainProbability, rain) > 45 ? CloudRain : (i === 0 ? Sun : Cloud) }));
  }, [forecast, temp, rain]);
  const displayDays = weatherDays.length ? weatherDays : [{ day: "Today", temp: Math.round(temp), rain, icon: Sun }, { day: "Day 2", temp: Math.round(temp - 1), rain: Math.round(rain + 5), icon: Cloud }, { day: "Day 3", temp: Math.round(temp - 2), rain: Math.round(rain + 12), icon: CloudRain }, { day: "Day 4", temp: Math.round(temp + 1), rain: Math.max(0, rain - 5), icon: Sun }, { day: "Day 5", temp: Math.round(temp), rain, icon: Cloud }];

  const runAction = async (kind) => {
    setBusyAction(kind);
    try {
      if (kind === "mdp") await calculateMDP?.();
      else if (kind === "qlearning") await analyzeWithAI?.();
      else if (kind === "refresh") {
        if (refreshAll) await refreshAll();
        else await Promise.allSettled([refreshTelemetry?.(), refreshWeather?.()]);
      } else if (kind === "scenario") await runScenario?.(scenario);
    } catch (e) {
      console.error(`AGRIMIND ${kind} action failed`, e);
    } finally { setBusyAction(""); }
  };

  const risk = soil < 25 ? { label: "Critical moisture", text: "Soil is very dry. Check irrigation availability before watering.", tone: "danger" } : temp >= 36 ? { label: "Heat stress watch", text: "High temperature may accelerate water loss from the field.", tone: "warm" } : rain >= 65 ? { label: "Rain likely", text: "Consider delaying irrigation to avoid water waste.", tone: "blue" } : tank < 20 ? { label: "Low water reserve", text: "Tank reserve is low; confirm supply before applying the recommendation.", tone: "warm" } : { label: "Conditions monitored", text: "No critical threshold detected from the currently available signals.", tone: "green" };

  return <main className="ag-dashboard">
    <header className="ag-welcome-row">
      <div><div className="ag-overline">YOUR FARM COMMAND CENTRE <span className="ag-live-dot"/></div><h1>Good morning, Saina! <span>✳</span></h1><p>Let's make your farm smarter today.</p></div>
      <div className="ag-header-actions"><span className={`ag-connection ${backendOnline ? "is-online" : "is-offline"}`}><i/>{backendOnline ? "LIVE SYSTEM" : "DEMO MODE"}</span><button className="ag-round-btn" title="Refresh all signals" onClick={() => runAction("refresh")} disabled={busyAction === "refresh"}><RefreshCw size={17} className={busyAction === "refresh" ? "ag-spin" : ""}/></button><div className="ag-farm-select"><Sprout size={20}/><div><small>ACTIVE FARM</small><b>{farmName}</b></div><span>⌄</span></div></div>
    </header>

    <div className="ag-dashboard-grid">
      <section className="ag-hero-card" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,39,29,.92) 0%, rgba(5,39,29,.72) 38%, rgba(5,39,29,.05) 100%), url("${HERO_IMAGE}")` }}>
        <div className="ag-hero-copy"><span className="ag-hero-kicker"><Leaf size={14}/> AGRIMIND / LIVING INTELLIGENCE</span><h2>AI-powered irrigation<br/><em>for a sustainable tomorrow.</em></h2><p>Real-time signals <b>•</b> Smarter decisions <b>•</b> Better yields</p><button className="ag-hero-button" onClick={() => { window.location.hash = "#intelligence"; }}>Explore intelligence <ArrowUpRight size={16}/></button></div>
        <div className="ag-hero-stamp"><span>FIELD NOTE 001</span><b>Grow more.<br/>Waste less.</b><Leaf size={24}/></div>
        <div className="ag-hero-bottom"><span><MapPin size={13}/> {farm?.location?.name || "Kanpur, Uttar Pradesh"}</span><span><Sprout size={13}/> {cropName} · {farm?.crop?.growthStage || "Vegetative"}</span><span><Activity size={13}/> {backendOnline ? "Connected to API" : "Using available demo signals"}</span></div>
      </section>

      <aside className="ag-weather-card">
        <div className="ag-weather-head"><span className="ag-weather-sun"><Sun size={27}/></span><div><b>{weather?.location || "Kanpur, UP"}</b><small>{weather?.description || weather?.condition || "Current weather"}</small></div><span className="ag-weather-source">{weather?.source ? "LIVE" : "SIGNAL"}</span></div>
        <div className="ag-weather-main"><Cloud size={31}/><div><strong>{Math.round(temp)}°C</strong><small>{weather?.description || weather?.condition || "Conditions from available data"}</small></div></div>
        <div className="ag-weather-stats"><div><span>Humidity</span><b>{humidity}%</b></div><div><span>Rain probability</span><b>{rain}%</b></div></div>
        <div className="ag-weather-days">{displayDays.map((d, i) => <MiniWeather key={`${d.day}-${i}`} day={d.day} icon={d.icon} temp={d.temp} rain={d.rain}/>)}</div>
        {errors?.weather && <div className="ag-inline-note"><CircleAlert size={13}/> Weather refresh unavailable; showing last available signal.</div>}
      </aside>

      <section className="ag-metrics-row">
        <MetricCard icon={Sprout} label="Soil moisture" value={Math.round(soil)} unit="%" status={soil < 30 ? "LOW" : soil > 75 ? "HIGH" : "OPTIMAL"} tone={soil < 30 ? "rose" : "green"} progress={soil} detail="Simulated sensor telemetry"/>
        <MetricCard icon={Thermometer} label="Temperature" value={Math.round(temp)} unit="°C" status={temp >= 35 ? "HIGH" : "NORMAL"} tone={temp >= 35 ? "rose" : "green"} progress={(temp / 50) * 100} detail={weather?.source || "Weather signal"}/>
        <MetricCard icon={Droplets} label="Humidity" value={Math.round(humidity)} unit="%" status={humidity < 30 ? "LOW" : humidity > 80 ? "HIGH" : "OPTIMAL"} tone="mint" progress={humidity} detail="Relative humidity"/>
        <MetricCard icon={CloudRain} label="Rain probability" value={Math.round(rain)} unit="%" status={rain >= 60 ? "LIKELY" : "LOW"} tone="lilac" progress={rain} detail="Forecast signal"/>
        <MetricCard icon={Waves} label="Tank level" value={Math.round(tank)} unit="%" status={tank < 20 ? "LOW" : "GOOD"} tone="green" progress={tank} detail="Simulated tank telemetry"/>
      </section>

      <section className="ag-panel ag-farm-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">YOUR LAND</span><h3><Sprout size={18}/> Farm overview</h3></div><span className="ag-subtle-tag">{farm?.id || "GVF-001"}</span></div><div className="ag-farm-content"><div className="ag-farm-facts"><div className="ag-farm-place"><MapPin size={17}/><div><b>{farmName}</b><small>{farm?.location?.address || "Kanpur, Uttar Pradesh, India"}</small></div></div><div className="ag-fact-row"><span>Crop</span><b>{cropName}</b></div><div className="ag-fact-row"><span>Growth stage</span><b>{farm?.crop?.growthStage || "Vegetative"}</b></div><div className="ag-fact-row"><span>Farm size</span><b>{farm?.areaAcres || farm?.size || "5 Acres"}</b></div><div className="ag-fact-row"><span>Telemetry</span><b className="ag-text-green">Simulated</b></div></div><div className="ag-farm-photo" style={{ backgroundImage: `linear-gradient(0deg,rgba(4,37,25,.18),transparent 45%),url("${FIELD_IMAGE}")` }}><span><Leaf size={14}/> FIELD SNAPSHOT</span></div></div></section>

      <section className="ag-panel ag-decision-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">DECISION ENGINE</span><h3><BrainCircuit size={18}/> AI irrigation decision</h3></div><span className="ag-recommendation-badge"><Sparkles size={12}/> {aiLoading ? "ANALYSING" : "RECOMMENDATION"}</span></div><div className="ag-decision-banner"><span className="ag-decision-leaf"><Leaf size={24}/></span><div><small>RECOMMENDED ACTION</small><h4>{titleCase(action)}</h4><p>{aiLoading ? "Evaluating current field signals…" : "Based on the latest available conditions"}</p></div><span className="ag-decision-state">{titleCase(currentState?.id || currentState?.state || currentState || "MONITOR")}</span></div><div className="ag-decision-stats"><div><Droplets size={19}/><span>Water amount</span><b>{Math.round(asNum(waterAmount, 0))} <small>L/acre</small></b></div><div><Gauge size={19}/><span>Confidence</span><b>{confidence}%</b><div className="ag-confidence-track"><i style={{ width: `${confidence}%` }}/></div></div></div><div className={`ag-agent-insight tone-${risk.tone}`}><span><Sparkles size={18}/></span><div><b>{risk.label}</b><p>{reason || risk.text}</p></div></div><div className="ag-decision-actions"><button className="ag-button-primary" onClick={() => runAction("mdp")} disabled={!!busyAction || aiLoading}><Zap size={16}/>{busyAction === "mdp" ? "Running MDP…" : "Run MDP analysis"}</button><button className="ag-button-secondary" onClick={() => runAction("qlearning")} disabled={!!busyAction || aiLoading}><BrainCircuit size={16}/>{busyAction === "qlearning" || aiLoading ? "Learning…" : "Run Q-learning"}</button></div></section>

      <aside className="ag-panel ag-quick-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">CONTROL ROOM</span><h3><Zap size={18}/> Quick actions</h3></div></div><button className="ag-quick-action" onClick={() => setAgentOpen(v => !v)}><span className="ag-quick-icon"><Sparkles size={17}/></span><span><b>Field AI agent</b><small>Detect risks & explain signals</small></span><ArrowRight size={15}/></button><button className="ag-quick-action" onClick={() => setScenarioOpen(v => !v)}><span className="ag-quick-icon pink"><FlaskConical size={17}/></span><span><b>Simulate scenario</b><small>Test changed field conditions</small></span><ArrowRight size={15}/></button><button className="ag-quick-action" onClick={() => runAction("refresh")} disabled={busyAction === "refresh"}><span className="ag-quick-icon blue"><RefreshCw size={17}/></span><span><b>Refresh signals</b><small>Request latest available data</small></span><ArrowRight size={15}/></button><button className="ag-quick-action" onClick={() => { window.location.hash = "#reports"; }}><span className="ag-quick-icon gold"><Activity size={17}/></span><span><b>View reports</b><small>Decision history & trends</small></span><ArrowRight size={15}/></button><div className="ag-quote-card" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,244,235,.96),rgba(255,244,235,.35)),url("${LEAF_IMAGE}")` }}><em>Every drop<br/>counts.</em><span>Smarter water. Healthier crops.</span></div></aside>

      {agentOpen && <section className="ag-panel ag-agent-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">EXPLAINABLE FIELD AGENT</span><h3><Sparkles size={18}/> Field risk scan</h3></div><button className="ag-close-button" onClick={() => setAgentOpen(false)}>Close</button></div><div className="ag-agent-result"><div className={`ag-risk-icon tone-${risk.tone}`}><ShieldCheck size={22}/></div><div><b>{risk.label}</b><p>{risk.text}</p><small>Rule-based scan · not a trained predictive model</small></div></div><div className="ag-agent-grid"><div><span>Soil moisture</span><b>{soil}%</b><small>{soil < 30 ? "Below preferred range" : "Within monitored range"}</small></div><div><span>Heat signal</span><b>{Math.round(temp)}°C</b><small>{temp >= 35 ? "Heat-stress watch" : "No high-heat threshold"}</small></div><div><span>Rain signal</span><b>{rain}%</b><small>{rain >= 60 ? "Consider delaying irrigation" : "Low rain probability"}</small></div><div><span>Water reserve</span><b>{tank}%</b><small>{tank < 20 ? "Check supply" : "Reserve available"}</small></div></div></section>}

      {scenarioOpen && <section className="ag-panel ag-scenario-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">DIGITAL TWIN</span><h3><FlaskConical size={18}/> Scenario lab</h3></div><button className="ag-close-button" onClick={() => setScenarioOpen(false)}>Close</button></div><p className="ag-scenario-intro">These inputs are simulated. Run a scenario to see how the decision engine responds.</p><div className="ag-scenario-inputs">{[["soilMoisture","Soil moisture",0,100,"%"],["temperature","Temperature",-10,60,"°C"],["humidity","Humidity",0,100,"%"],["rainProbability","Rain probability",0,100,"%"],["tankLevel","Tank level",0,100,"%"]].map(([key,label,min,max,unit]) => <label key={key}><span>{label} <b>{scenario[key]}{unit}</b></span><input type="range" min={min} max={max} value={scenario[key]} onChange={e => setScenario(s => ({...s,[key]:Number(e.target.value)}))}/></label>)}</div><button className="ag-button-primary" onClick={() => runAction("scenario")} disabled={!!busyAction || scenarioLoading}><Zap size={16}/>{scenarioLoading || busyAction === "scenario" ? "Processing scenario…" : "Run scenario"}</button></section>}

      <section className="ag-panel ag-chart-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">SIGNAL HISTORY</span><h3><Activity size={18}/> Sensor trends</h3></div><span className="ag-subtle-tag">7-point illustrative trend</span></div><div className="ag-chart-legend"><span><i className="legend-soil"/>Soil moisture</span><span><i className="legend-temp"/>Temperature</span><span><i className="legend-hum"/>Humidity</span></div><div className="ag-chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 12, right: 5, left: -22, bottom: 0 }}><defs><linearGradient id="soilFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f9560" stopOpacity={0.18}/><stop offset="100%" stopColor="#2f9560" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e9ece5" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="day" tick={{fontSize:10,fill:"#839087"}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:"#839087"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{borderRadius:12,border:"1px solid #e6e9e1",fontSize:12}}/><Area type="monotone" dataKey="soil" name="Soil moisture (%)" stroke="#2e8b57" strokeWidth={2.5} fill="url(#soilFill)"/><Area type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#e36b8c" strokeWidth={2} fill="transparent"/><Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#9b82c7" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div><p className="ag-chart-footnote">Only current values are connected to your context. Earlier points are illustrative until historical telemetry storage is configured.</p></section>

      <section className="ag-panel ag-forecast-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">WEATHER WINDOW</span><h3><CloudRain size={18}/> Forecast outlook</h3></div><span className="ag-subtle-tag">{weather?.source || "Available weather signal"}</span></div><div className="ag-forecast-grid">{displayDays.slice(0,5).map((d,i) => <MiniWeather key={`forecast-${d.day}-${i}`} day={d.day} icon={d.icon} temp={d.temp} rain={d.rain}/>)}</div>{errors?.forecast && <p className="ag-chart-footnote">Forecast unavailable. Values shown here are fallback estimates, not verified forecasts.</p>}</section>

      <section className="ag-panel ag-activity-panel"><div className="ag-panel-heading"><div><span className="ag-section-label">DECISION MEMORY</span><h3><Clock3 size={18}/> Recent activity</h3></div><span className="ag-subtle-tag">Latest first</span></div>{decisionHistory.length ? <div className="ag-activity-list">{decisionHistory.slice(0,4).map((item,i) => <div className="ag-activity-item" key={item.id || i}><span className="ag-activity-dot"/><div><b>{titleCase(item.action)} decision evaluated</b><small>{titleCase(item.state)} · {Math.round(asNum(item.waterAmount))} L/acre</small></div><time>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "recent"}</time></div>)}</div> : <div className="ag-empty-activity"><Activity size={21}/><p>No decision history yet.</p><small>Run MDP or Q-learning to record the first event.</small></div>}<div className="ag-system-foot"><span className={backendOnline ? "dot-on" : "dot-off"}/>{backendOnline ? "Backend connected" : "Backend unavailable — fallback recommendations may be used"}<span className="ag-system-foot-right">{loading ? "Connecting…" : "Auto-refresh enabled"}</span></div></section>
    </div>
    <footer className="ag-dashboard-footer"><div><span className="ag-footer-mark"><Leaf size={17}/></span><b>AGRIMIND</b><span>Living intelligence for water-wise farming.</span></div><small>Prototype · Sensor data is simulated unless hardware is connected.</small></footer>
  </main>;
}
