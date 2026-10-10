import {
  Activity,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Download,
  Droplets,
  Gauge,
  Leaf,
  RefreshCw,
  Sprout,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useFarm } from "../context/FarmContext";

import "./Reports.css";

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pretty(value) {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  detail,
  trend,
}) {
  return (
    <article className="report-stat-card">
      <div className="report-stat-icon">
        <Icon size={18} />
      </div>

      <span>{label}</span>

      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>

      <div className="report-stat-bottom">
        {trend && (
          <span className={trend.type}>
            {trend.type === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}

            {trend.text}
          </span>
        )}

        <small>{detail}</small>
      </div>
    </article>
  );
}

export default function Reports() {
  const {
    farm,
    sensors,
    weather,
    recommendation,
    recommendedAction,
    waterAmount,
    policyConfidence,
    qLearningResult,
    fetchTelemetry,
    fetchWeather,
    fetchForecast,
    telemetryLoading,
    weatherLoading,
  } = useFarm();

  const [generating, setGenerating] = useState(false);
  const [reportDate] = useState(new Date());

  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(
        "agrimind_decision_history"
      );

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const action =
    recommendedAction ||
    recommendation?.action ||
    qLearningResult?.action ||
    "NO_IRRIGATION";

  const water = number(waterAmount);

  const confidence = Math.min(
    100,
    Math.max(0, number(policyConfidence))
  );

  const soilMoisture = number(
    sensors?.soilMoisture
  );

  const tankLevel = number(
    farm?.irrigation?.tankLevel,
    72
  );

  const rainProbability = number(
    weather?.rainProbability ??
      sensors?.rainProbability
  );

  const cropName =
    farm?.crop?.name || "Wheat";

  const farmName =
    farm?.name || "Green Valley Farm";

  const todayDecision = useMemo(
    () => ({
      id: Date.now(),
      time: new Date().toISOString(),
      action,
      water,
      confidence,
      soilMoisture,
      temperature: number(
        weather?.temperature ??
          sensors?.temperature
      ),
      humidity: number(
        weather?.humidity ??
          sensors?.humidity
      ),
      rainProbability,
    }),
    [
      action,
      water,
      confidence,
      soilMoisture,
      weather,
      sensors,
      rainProbability,
    ]
  );

  useEffect(() => {
    if (!action || action === "ANALYZING") {
      return;
    }

    setHistory((current) => {
      const last = current[0];

      if (
        last &&
        last.action === todayDecision.action &&
        last.water === todayDecision.water &&
        Math.abs(
          new Date(last.time).getTime() -
            new Date(todayDecision.time).getTime()
        ) < 60000
      ) {
        return current;
      }

      const updated = [
        todayDecision,
        ...current,
      ].slice(0, 12);

      localStorage.setItem(
        "agrimind_decision_history",
        JSON.stringify(updated)
      );

      return updated;
    });
  }, [todayDecision, action]);

  const totalWater = history.reduce(
    (sum, item) => sum + number(item.water),
    0
  );

  const irrigationDecisions =
    history.filter(
      (item) =>
        item.action !== "NO_IRRIGATION"
    ).length;

  const avgConfidence =
    history.length > 0
      ? Math.round(
          history.reduce(
            (sum, item) =>
              sum + number(item.confidence),
            0
          ) / history.length
        )
      : confidence;

  const handleRefresh = async () => {
    await Promise.all([
      fetchTelemetry?.(),
      fetchWeather?.(),
      fetchForecast?.(),
    ]);
  };

  const handleGenerateReport = () => {
    setGenerating(true);

    setTimeout(() => {
      const report = `
AGRIMIND — FIELD INTELLIGENCE REPORT
=====================================

Farm: ${farmName}
Crop: ${cropName}
Generated: ${reportDate.toLocaleString("en-IN")}

CURRENT ENVIRONMENT
-------------------
Soil Moisture: ${soilMoisture}%
Temperature: ${number(
        weather?.temperature ??
          sensors?.temperature
      )}°C
Humidity: ${number(
        weather?.humidity ??
          sensors?.humidity
      )}%
Rain Probability: ${rainProbability}%
Tank Level: ${tankLevel}%

CURRENT AI DECISION
-------------------
Action: ${pretty(action)}
Water: ${water} L
Policy Confidence: ${confidence}%
Algorithm: MDP + Q-Learning

DECISION HISTORY
----------------
Recorded decisions: ${history.length}
Irrigation decisions: ${irrigationDecisions}
Total recommended water: ${totalWater} L
Average confidence: ${avgConfidence}%

DATA SOURCES
------------
Weather: ${weather?.source || "Open-Meteo"}
Field telemetry: Simulated prototype telemetry
Satellite imagery: Esri World Imagery
      `.trim();

      const blob = new Blob(
        [report],
        { type: "text/plain" }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        `AGRIMIND_Report_${Date.now()}.txt`;

      link.click();

      URL.revokeObjectURL(url);

      setGenerating(false);
    }, 700);
  };

  return (
    <main className="reports-page">
      <section className="reports-hero">
        <div>
          <div className="reports-eyebrow">
            <span />
            AGRIMIND / FIELD REPORTS
          </div>

          <h1>
            Decisions,
            <br />
            <em>with evidence.</em>
          </h1>

          <p>
            A transparent record of field conditions,
            irrigation decisions and the intelligence behind
            every recommendation.
          </p>
        </div>

        <div className="report-date-card">
          <CalendarDays size={18} />

          <div>
            <span>REPORT DATE</span>
            <strong>
              {formatDate(reportDate)}
            </strong>
          </div>
        </div>
      </section>

      <section className="report-header-card">
        <div className="report-farm">
          <div className="report-farm-icon">
            <Sprout size={22} />
          </div>

          <div>
            <span>ACTIVE FARM</span>
            <h2>{farmName}</h2>
            <small>
              {farm?.id || "GVF-001"} · {cropName}
            </small>
          </div>
        </div>

        <div className="report-header-actions">
          <button
            className="report-refresh"
            onClick={handleRefresh}
            disabled={
              telemetryLoading ||
              weatherLoading
            }
          >
            <RefreshCw
              size={14}
              className={
                telemetryLoading ||
                weatherLoading
                  ? "report-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            className="report-download"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <RefreshCw
                size={14}
                className="report-spin"
              />
            ) : (
              <Download size={14} />
            )}

            {generating
              ? "Generating..."
              : "Export report"}
          </button>
        </div>
      </section>

      <section className="report-summary">
        <StatCard
          icon={Droplets}
          label="CURRENT WATER"
          value={water}
          unit="L"
          detail="AI recommendation"
          trend={{
            type: "down",
            text: "Decision based",
          }}
        />

        <StatCard
          icon={Gauge}
          label="SOIL MOISTURE"
          value={soilMoisture}
          unit="%"
          detail="Current field signal"
        />

        <StatCard
          icon={BrainCircuit}
          label="POLICY CONFIDENCE"
          value={confidence}
          unit="%"
          detail="Q-learning output"
          trend={{
            type: "up",
            text: "Model signal",
          }}
        />

        <StatCard
          icon={Waves}
          label="TANK LEVEL"
          value={tankLevel}
          unit="%"
          detail="Simulated telemetry"
        />
      </section>

      <section className="report-main-grid">
        <article className="report-decision-card">
          <div className="report-card-heading">
            <div>
              <span>AI DECISION</span>
              <h2>Current recommendation</h2>
            </div>

            <CheckCircle2 size={19} />
          </div>

          <div className="report-decision-action">
            <span>SELECTED ACTION</span>

            <strong>
              {pretty(action)}
            </strong>

            <p>
              Selected by the AGRIMIND decision engine
              after evaluating the current environment.
            </p>
          </div>

          <div className="report-decision-details">
            <div>
              <span>WATER VOLUME</span>
              <strong>{water} L</strong>
            </div>

            <div>
              <span>CONFIDENCE</span>
              <strong>{confidence}%</strong>
            </div>

            <div>
              <span>SOIL</span>
              <strong>{soilMoisture}%</strong>
            </div>

            <div>
              <span>RAIN</span>
              <strong>{rainProbability}%</strong>
            </div>
          </div>
        </article>

        <article className="report-model-card">
          <div className="report-card-heading">
            <div>
              <span>MODEL</span>
              <h2>Decision intelligence</h2>
            </div>

            <BarChart3 size={19} />
          </div>

          <div className="model-row">
            <span>Algorithm</span>
            <strong>MDP + Q-Learning</strong>
          </div>

          <div className="model-row">
            <span>Current state</span>
            <strong>
              {pretty(
                qLearningResult?.state ||
                  qLearningResult?.currentState ||
                  "Pending"
              )}
            </strong>
          </div>

          <div className="model-row">
            <span>Learning episodes</span>
            <strong>
              {qLearningResult?.training
                ?.episodes ||
                qLearningResult?.trainingMetrics
                  ?.episodes ||
                40}
            </strong>
          </div>

          <div className="model-row">
            <span>Policy status</span>

            <strong className="model-live">
              <i />
              Active
            </strong>
          </div>

          <div className="model-note">
            <Activity size={14} />

            <p>
              AGRIMIND evaluates future states and reward
              outcomes instead of using a single fixed
              irrigation threshold.
            </p>
          </div>
        </article>
      </section>

      <section className="environment-report">
        <div className="report-section-title">
          <span>FIELD CONDITIONS</span>
          <h2>Environmental snapshot</h2>
        </div>

        <div className="environment-grid">
          <div>
            <span>TEMPERATURE</span>
            <strong>
              {number(
                weather?.temperature ??
                  sensors?.temperature
              ).toFixed(1)}
              °C
            </strong>
          </div>

          <div>
            <span>HUMIDITY</span>
            <strong>
              {number(
                weather?.humidity ??
                  sensors?.humidity
              )}
              %
            </strong>
          </div>

          <div>
            <span>RAIN PROBABILITY</span>
            <strong>
              {rainProbability}%
            </strong>
          </div>

          <div>
            <span>WIND</span>
            <strong>
              {number(
                weather?.windSpeed
              ).toFixed(1)}{" "}
              km/h
            </strong>
          </div>

          <div>
            <span>CLOUD COVER</span>
            <strong>
              {number(weather?.clouds)}%
            </strong>
          </div>

          <div>
            <span>PRECIPITATION</span>
            <strong>
              {number(
                weather?.precipitation
              ).toFixed(1)}{" "}
              mm
            </strong>
          </div>
        </div>
      </section>

      <section className="history-section">
        <div className="report-section-title history-title">
          <div>
            <span>DECISION MEMORY</span>
            <h2>Recent policy decisions</h2>
          </div>

          <span className="history-count">
            {history.length} records
          </span>
        </div>

        {history.length === 0 ? (
          <div className="empty-history">
            <BrainCircuit size={24} />

            <strong>
              No decision history yet
            </strong>

            <p>
              Run the AI decision engine to begin
              building AGRIMIND's decision memory.
            </p>
          </div>
        ) : (
          <div className="history-table">
            <div className="history-table-head">
              <span>TIME</span>
              <span>FIELD STATE</span>
              <span>ACTION</span>
              <span>WATER</span>
              <span>CONFIDENCE</span>
            </div>

            {history.map((item) => (
              <div
                className="history-row"
                key={item.id}
              >
                <span>
                  {new Date(
                    item.time
                  ).toLocaleTimeString(
                    "en-IN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>

                <span>
                  {item.soilMoisture}% soil
                </span>

                <strong>
                  {pretty(item.action)}
                </strong>

                <span>
                  {number(item.water)} L
                </span>

                <span className="history-confidence">
                  {number(item.confidence)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="report-footer-card">
        <div className="report-footer-icon">
          <Leaf size={21} />
        </div>

        <div>
          <span>
            AGRIMIND / LIVING INTELLIGENCE
          </span>

          <h2>
            Better irrigation starts with better
            decisions.
          </h2>

          <p>
            This report combines environmental
            intelligence, simulated field telemetry and
            learned policy outputs. Simulated telemetry
            should be replaced with physical IoT sensor
            data before production deployment.
          </p>
        </div>
      </section>
    </main>
  );
}