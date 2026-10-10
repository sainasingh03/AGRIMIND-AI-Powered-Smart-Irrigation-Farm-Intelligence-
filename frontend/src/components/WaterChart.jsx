import {
  Droplets,
  TrendingDown,
  TrendingUp,
  Waves,
  CloudRain,
  Sparkles,
} from "lucide-react";

import { useMemo } from "react";
import { useFarm } from "../context/FarmContext";

export default function WaterChart() {
  const {
    farm,
    weather,
    qLearningResult,
    mdpResult,
  } = useFarm();

  const sensors = farm?.sensors || {};

  const soilMoisture = Number(sensors.soilMoisture ?? 28);
  const rainProbability = Number(
    weather?.rainProbability ??
      sensors.rainProbability ??
      12
  );

  const tankLevel = Number(
    farm?.irrigation?.tankLevel ?? 72
  );

  const waterAmount = Number(
    qLearningResult?.waterAmount ??
      mdpResult?.recommendation?.waterAmount ??
      10
  );

  const action =
    qLearningResult?.recommendedAction ||
    mdpResult?.recommendation?.action ||
    "LOW_IRRIGATION";

  const actionLabel = action
    .replaceAll("_", " ")
    .replace("IRRIGATION", "IRRIGATION");

  const waterStatus = useMemo(() => {
    if (tankLevel < 25) return "LOW";
    if (tankLevel < 50) return "MODERATE";
    return "HEALTHY";
  }, [tankLevel]);

  const forecastBars = [
    {
      label: "NOW",
      value: Math.max(8, soilMoisture),
      type: "soil",
    },
    {
      label: "+2H",
      value: Math.max(
        8,
        Math.min(100, soilMoisture + waterAmount * 0.45)
      ),
      type: "soil",
    },
    {
      label: "+4H",
      value: Math.max(
        8,
        Math.min(100, soilMoisture + waterAmount * 0.65)
      ),
      type: "soil",
    },
    {
      label: "+6H",
      value: Math.max(
        8,
        Math.min(100, soilMoisture + waterAmount * 0.8)
      ),
      type: "soil",
    },
    {
      label: "+8H",
      value: Math.max(
        8,
        Math.min(100, soilMoisture + waterAmount * 0.95)
      ),
      type: "soil",
    },
  ];

  const targetMoisture = 55;
  const moistureGap = Math.max(
    0,
    targetMoisture - soilMoisture
  );

  return (
    <section className="water-intelligence">
      <div className="water-header">
        <div>
          <div className="section-eyebrow">
            <Droplets size={13} />
            WATER INTELLIGENCE
          </div>

          <h2>
            Water, used
            <br />
            <em>with intent.</em>
          </h2>

          <p>
            AGRIMIND continuously balances soil demand,
            weather risk and available water before making
            an irrigation decision.
          </p>
        </div>

        <div className="water-status-pill">
          <span className="water-status-dot" />
          <span>RESOURCE {waterStatus}</span>
        </div>
      </div>

      <div className="water-grid">
        {/* Main chart */}
        <div className="water-chart-card">
          <div className="water-card-top">
            <div>
              <span className="mini-label">
                SOIL MOISTURE TRAJECTORY
              </span>

              <div className="water-number-row">
                <strong>{soilMoisture}%</strong>

                <span
                  className={
                    moistureGap > 0
                      ? "water-trend down"
                      : "water-trend up"
                  }
                >
                  {moistureGap > 0 ? (
                    <TrendingDown size={14} />
                  ) : (
                    <TrendingUp size={14} />
                  )}

                  {moistureGap > 0
                    ? `${moistureGap}% below target`
                    : "Target reached"}
                </span>
              </div>
            </div>

            <div className="target-badge">
              TARGET
              <strong>{targetMoisture}%</strong>
            </div>
          </div>

          <div className="water-chart">
            <div className="chart-target-line">
              <span>55%</span>
            </div>

            <div className="water-bars">
              {forecastBars.map((bar, index) => (
                <div
                  className="water-bar-column"
                  key={bar.label}
                >
                  <div className="water-bar-value">
                    {Math.round(bar.value)}%
                  </div>

                  <div className="water-bar-track">
                    <div
                      className={`water-bar-fill ${
                        index === 0 ? "current" : ""
                      }`}
                      style={{
                        height: `${bar.value}%`,
                      }}
                    >
                      <span />
                    </div>
                  </div>

                  <span className="water-bar-label">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="water-chart-footer">
            <div className="legend-item">
              <span className="legend-dot moisture" />
              <span>Predicted soil moisture</span>
            </div>

            <div className="legend-item">
              <span className="legend-line" />
              <span>Optimal target</span>
            </div>
          </div>
        </div>

        {/* Resource card */}
        <div className="water-resource-card">
          <div className="resource-orbit">
            <div className="resource-ring ring-one" />
            <div className="resource-ring ring-two" />

            <div className="resource-core">
              <Droplets size={23} />
              <strong>{tankLevel}%</strong>
              <span>RESERVE</span>
            </div>
          </div>

          <div className="resource-copy">
            <span className="mini-label">
              WATER RESERVE
            </span>

            <h3>
              {tankLevel >= 60
                ? "Comfortable reserve."
                : tankLevel >= 30
                  ? "Monitor reserve."
                  : "Conserve water."}
            </h3>

            <p>
              Current tank availability is considered
              alongside crop demand before every irrigation
              cycle.
            </p>
          </div>

          <div className="resource-meter">
            <div className="resource-meter-label">
              <span>Tank capacity</span>
              <strong>{tankLevel}%</strong>
            </div>

            <div className="resource-meter-track">
              <div
                className="resource-meter-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, tankLevel)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* AI decision */}
        <div className="water-decision-card">
          <div className="decision-icon">
            <Sparkles size={17} />
          </div>

          <div className="decision-content">
            <span className="mini-label">
              AI WATER DECISION
            </span>

            <h3>{actionLabel}</h3>

            <p>
              The current policy recommends approximately{" "}
              <strong>{waterAmount}L</strong> of water
              based on the present environmental state.
            </p>

            <div className="decision-meta">
              <span>
                <Droplets size={13} />
                {waterAmount} L
              </span>

              <span>
                <Waves size={13} />
                Soil {soilMoisture}%
              </span>
            </div>
          </div>
        </div>

        {/* Weather impact */}
        <div className="water-weather-card">
          <div className="weather-icon">
            <CloudRain size={19} />
          </div>

          <div>
            <span className="mini-label">
              WEATHER IMPACT
            </span>

            <h3>
              {rainProbability}% rain probability
            </h3>

            <p>
              {rainProbability >= 60
                ? "Rain risk is high. Irrigation should be reduced."
                : rainProbability >= 30
                  ? "Moderate rain risk. AGRIMIND is using a cautious policy."
                  : "Low rain risk. Soil demand remains the dominant signal."}
            </p>
          </div>
        </div>
      </div>

      <div className="water-insight">
        <div className="insight-mark">
          <Sparkles size={15} />
        </div>

        <div>
          <span>AGRIMIND INSIGHT</span>

          <p>
            The system is not simply asking{" "}
            <em>“Does the crop need water?”</em> — it is
            estimating{" "}
            <strong>when, how much and whether waiting
            creates a better outcome.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}