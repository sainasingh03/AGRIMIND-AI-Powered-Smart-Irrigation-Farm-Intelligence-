import { useMemo, useState } from "react";
import { Activity, BrainCircuit, CheckCircle2, CircleAlert, Droplets, Leaf, Play, RefreshCw, ShieldCheck, Sparkles, Sprout, ThermometerSun, CloudRain } from "lucide-react";
import { useFarm } from "../context/FarmContext";

const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;

export default function AgriAgent() {
  const { sensors = {}, weather, forecast = [], backendOnline, recommendation, recommendedAction, policyConfidence, analyzeWithAI, runScenario, aiLoading, scenarioLoading, refreshAll, errors = {} } = useFarm();
  const [notice, setNotice] = useState("");
  const soil = n(sensors.soilMoisture, 28);
  const temp = n(weather?.temperature ?? weather?.temperature_2m ?? sensors.temperature, 30);
  const rain = n(weather?.rainProbability ?? weather?.precipitation_probability ?? sensors.rainProbability, 0);
  const humidity = n(weather?.humidity ?? weather?.relative_humidity_2m ?? sensors.humidity, 45);
  const findings = useMemo(() => {
    const out = [];
    if (soil < 25) out.push({ tone: "danger", title: "Dry-soil stress detected", detail: `Soil moisture is ${soil}%. Root-zone moisture is below the 25% watch threshold.` });
    else if (soil < 35) out.push({ tone: "warn", title: "Moisture trending low", detail: `At ${soil}%, the field may need irrigation soon. Recheck before applying water.` });
    else if (soil > 75) out.push({ tone: "warn", title: "Over-watering risk", detail: `Soil moisture is ${soil}%; avoid irrigation until moisture falls.` });
    else out.push({ tone: "good", title: "Soil moisture within watch range", detail: `Current reading is ${soil}%. Continue monitoring the trend.` });
    if (rain >= 65) out.push({ tone: "warn", title: "Rain-aware delay suggested", detail: `${rain}% rain probability may make immediate irrigation unnecessary.` });
    if (temp >= 35 && soil < 40) out.push({ tone: "danger", title: "Heat + low moisture combination", detail: `${temp}°C with low soil moisture can increase crop water stress.` });
    return out;
  }, [soil, rain, temp]);
  const predicted = useMemo(() => {
    // Transparent heuristic forecast, not a trained model. Approximate 24-hour moisture change.
    const evapLoss = Math.max(1, (temp - 20) * 0.22 + (100 - humidity) * 0.025);
    const rainGain = rain >= 60 ? 5 : rain >= 35 ? 2 : 0;
    return Math.max(0, Math.min(100, Math.round((soil - evapLoss + rainGain) * 10) / 10));
  }, [soil, temp, humidity, rain]);
  const runAgent = async () => {
    setNotice("");
    try {
      if (typeof analyzeWithAI === "function") await analyzeWithAI();
      setNotice("Analysis finished. The recommendation panel now reflects the latest available engine response; fallback decisions are labelled in the app.");
    } catch (e) { setNotice(e?.message || "Analysis could not complete. Check backend connectivity."); }
  };
  const refresh = async () => {
    try { if (typeof refreshAll === "function") await refreshAll(); setNotice("Refresh requested. Values update when connected services respond."); }
    catch (e) { setNotice(e?.message || "Refresh failed."); }
  };
  const runDryScenario = async () => {
    try { if (typeof runScenario === "function") await runScenario({ soilMoisture: Math.max(5, soil - 12), temperature: temp, humidity, rainProbability: rain }); setNotice("Dry-field scenario evaluated. Scenario inputs are simulated and do not change real farm hardware."); }
    catch (e) { setNotice(e?.message || "Scenario could not be evaluated."); }
  };
  const health = [
    { label: "Backend API", ok: Boolean(backendOnline), detail: backendOnline ? "Connected" : "Offline / fallback mode" },
    { label: "Weather signal", ok: Boolean(weather), detail: weather ? "Data received" : "No weather response" },
    { label: "Forecast", ok: Array.isArray(forecast) && forecast.length > 0, detail: forecast?.length ? `${forecast.length} forecast records` : "No forecast records" },
    { label: "Sensor provenance", ok: true, detail: "Simulated telemetry — no physical sensor claimed" },
  ];
  return <section className="agent-panel" aria-labelledby="agent-heading">
    <div className="agent-head"><div className="agent-icon"><BrainCircuit size={23}/></div><div className="agent-title"><span className="eyebrow">AGRIMIND AUTOPILOT · ASSISTANT</span><h2 id="agent-heading">Field intelligence agent</h2><p>Detects risk signals, estimates short-term moisture and helps you test the next action.</p></div><span className={`agent-connection ${backendOnline ? "is-live" : "is-demo"}`}><i/>{backendOnline ? "API connected" : "Local analysis"}</span></div>
    <div className="agent-grid"><div className="agent-findings"><div className="agent-subhead"><Sparkles size={16}/> Detected signals <span>{findings.length} findings</span></div>{findings.map((f, i) => <article className={`agent-finding ${f.tone}`} key={`${f.title}-${i}`}><div className="finding-mark">{f.tone === "good" ? <CheckCircle2 size={17}/> : <CircleAlert size={17}/>}</div><div><strong>{f.title}</strong><p>{f.detail}</p></div></article>)}</div>
      <div className="agent-prediction"><div className="agent-subhead"><Activity size={16}/> 24-hour outlook <span>heuristic estimate</span></div><div className="prediction-number">{predicted}<small>%</small></div><p>Estimated soil moisture if no irrigation is applied. Weather effects are simplified; this is not a trained forecasting model.</p><div className="prediction-track"><span style={{width:`${predicted}%`}}/></div><div className="prediction-meta"><span>Now <b>{soil}%</b></span><span>Rain chance <b>{rain}%</b></span></div></div>
      <div className="agent-actions"><div className="agent-subhead"><ShieldCheck size={16}/> Agent actions</div><button onClick={runAgent} disabled={aiLoading}><BrainCircuit size={16}/>{aiLoading ? "Analyzing…" : "Run irrigation analysis"}<Play size={14}/></button><button onClick={runDryScenario} disabled={scenarioLoading}><ThermometerSun size={16}/>{scenarioLoading ? "Testing scenario…" : "Test dry-field scenario"}</button><button onClick={refresh}><RefreshCw size={16}/> Refresh connected data</button><div className="agent-provenance"><Leaf size={15}/><span>Suggested action: <b>{String(recommendedAction || recommendation?.action || "Awaiting analysis").replaceAll("_", " ")}</b><br/>Policy confidence: <b>{n(policyConfidence, 0)}%</b></span></div></div>
    </div>
    <div className="agent-health"><div className="agent-subhead"><Activity size={15}/> Connection & data checks</div><div className="health-grid">{health.map(item => <div className="health-item" key={item.label}><span className={item.ok ? "health-dot ok" : "health-dot"}/><div><b>{item.label}</b><small>{item.detail}</small></div></div>)}</div>{Object.values(errors).some(Boolean) && <p className="agent-error-note">One or more service requests have failed. Review the connection status above before relying on a recommendation.</p>}</div>
    {notice && <div className="agent-notice" role="status">{notice}</div>}
  </section>;
}
