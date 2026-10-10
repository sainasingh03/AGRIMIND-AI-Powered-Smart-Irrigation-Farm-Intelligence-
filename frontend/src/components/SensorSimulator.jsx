import {
  Activity,
  Check,
  Droplets,
  Gauge,
  RotateCcw,
  Sparkles,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

import { useMemo, useState } from "react";
import { useFarm } from "../context/FarmContext";
import "./SensorSimulator.css";

const PRESETS = {
  dry: {
    label: "Dry field",
    soilMoisture: 18,
    temperature: 35,
    humidity: 38,
    rainProbability: 8,
  },
  normal: {
    label: "Normal",
    soilMoisture: 55,
    temperature: 28,
    humidity: 58,
    rainProbability: 18,
  },
  rain: {
    label: "Rain approaching",
    soilMoisture: 42,
    temperature: 27,
    humidity: 72,
    rainProbability: 78,
  },
  heat: {
    label: "Heat stress",
    soilMoisture: 24,
    temperature: 42,
    humidity: 30,
    rainProbability: 6,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function getSoilState(value) {
  if (value <= 20) return "Very dry";
  if (value <= 40) return "Dry";
  if (value <= 60) return "Optimal";
  if (value <= 80) return "Wet";
  return "Very wet";
}

function getHeatState(value) {
  if (value < 20) return "Cool";
  if (value <= 30) return "Normal";
  if (value <= 35) return "Warm";
  return "Hot";
}

function getRainState(value) {
  if (value < 20) return "Low chance";
  if (value < 60) return "Moderate";
  return "High chance";
}

function Slider({
  icon: Icon,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}) {
  const percentage =
    ((value - min) / (max - min)) * 100;

  return (
    <div className="twin-slider">
      <div className="twin-slider-top">
        <div className="twin-slider-label">
          <span className="twin-slider-icon">
            <Icon size={16} />
          </span>

          <div>
            <span>{label}</span>
            <small>SIMULATED SIGNAL</small>
          </div>
        </div>

        <strong>
          {value}
          <small>{unit}</small>
        </strong>
      </div>

      <div className="twin-range">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
          style={{
            "--range-progress": `${percentage}%`,
          }}
        />

        <div className="twin-range-labels">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function SensorSimulator() {
  const {
    runScenario,
    scenarioLoading,
    recommendation,
    recommendedAction,
    waterAmount,
    policyConfidence,
  } = useFarm();

  const [scenario, setScenario] = useState({
    soilMoisture: 28,
    temperature: 34,
    humidity: 46,
    rainProbability: 12,
  });

  const [saved, setSaved] = useState(false);

  const applyPreset = (preset) => {
    setScenario({
      soilMoisture: preset.soilMoisture,
      temperature: preset.temperature,
      humidity: preset.humidity,
      rainProbability: preset.rainProbability,
    });
  };

  const updateValue = (key, value) => {
    setScenario((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const reset = () => {
    setScenario({
      soilMoisture: 28,
      temperature: 34,
      humidity: 46,
      rainProbability: 12,
    });

    setSaved(false);
  };

  const evaluate = async () => {
    await runScenario?.(scenario);
  };

  const saveScenario = () => {
    localStorage.setItem(
      "agrimind_last_scenario",
      JSON.stringify({
        ...scenario,
        savedAt: new Date().toISOString(),
      })
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  const action =
    recommendedAction ||
    recommendation?.action ||
    "Awaiting decision";

  const confidence = Math.round(
    Number(policyConfidence) || 0
  );

  const analysis = useMemo(
    () => ({
      soil: getSoilState(scenario.soilMoisture),
      heat: getHeatState(scenario.temperature),
      rain: getRainState(scenario.rainProbability),
    }),
    [scenario]
  );

  return (
    <section className="sensor-simulator">
      <div className="twin-background-orb twin-orb-one" />
      <div className="twin-background-orb twin-orb-two" />

      <div className="twin-header">
        <div>
          <div className="twin-eyebrow">
            <span className="twin-live-dot" />
            DIGITAL TWIN / DECISION LAB
          </div>

          <h2>
            Test the
            <em> intelligence.</em>
          </h2>

          <p>
            Change environmental conditions and watch
            AGRIMIND's irrigation policy respond.
          </p>
        </div>

        <div className="twin-header-status">
          <Activity size={15} />
          Scenario mode
        </div>
      </div>

      <div className="twin-warning">
        <Zap size={16} />

        <span>
          These controls simulate field telemetry.
          They are not physical IoT readings.
        </span>
      </div>

      <div className="twin-presets">
        <span className="twin-section-label">
          QUICK SCENARIO
        </span>

        <div className="twin-preset-list">
          {Object.entries(PRESETS).map(
            ([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="twin-layout">
        <div className="twin-controls">
          <Slider
            icon={Droplets}
            label="Soil moisture"
            value={scenario.soilMoisture}
            min={0}
            max={100}
            unit="%"
            onChange={(value) =>
              updateValue("soilMoisture", value)
            }
          />

          <Slider
            icon={Thermometer}
            label="Temperature"
            value={scenario.temperature}
            min={-10}
            max={50}
            unit="°C"
            onChange={(value) =>
              updateValue("temperature", value)
            }
          />

          <Slider
            icon={Waves}
            label="Humidity"
            value={scenario.humidity}
            min={0}
            max={100}
            unit="%"
            onChange={(value) =>
              updateValue("humidity", value)
            }
          />

          <Slider
            icon={Wind}
            label="Rain probability"
            value={scenario.rainProbability}
            min={0}
            max={100}
            unit="%"
            onChange={(value) =>
              updateValue("rainProbability", value)
            }
          />

          <div className="twin-actions">
            <button
              className="twin-reset"
              onClick={reset}
              type="button"
            >
              <RotateCcw size={15} />
              Reset
            </button>

            <button
              className="twin-save"
              onClick={saveScenario}
              type="button"
            >
              {saved ? (
                <Check size={15} />
              ) : (
                <Gauge size={15} />
              )}
              {saved ? "Saved" : "Save scenario"}
            </button>

            <button
              className="twin-evaluate"
              onClick={evaluate}
              disabled={scenarioLoading}
              type="button"
            >
              <Sparkles size={16} />

              {scenarioLoading
                ? "Evaluating..."
                : "Evaluate with AI"}
            </button>
          </div>
        </div>

        <aside className="twin-preview">
          <div className="twin-preview-header">
            <div>
              <span>FIELD STATE</span>
              <strong>
                {analysis.soil}
              </strong>
            </div>

            <div className="twin-state-pulse">
              <span />
              LIVE SIMULATION
            </div>
          </div>

          <div className="twin-signal-grid">
            <div className="twin-signal">
              <Droplets size={17} />
              <span>SOIL</span>
              <strong>
                {scenario.soilMoisture}%
              </strong>
            </div>

            <div className="twin-signal">
              <Thermometer size={17} />
              <span>HEAT</span>
              <strong>
                {analysis.heat}
              </strong>
            </div>

            <div className="twin-signal">
              <Waves size={17} />
              <span>HUMIDITY</span>
              <strong>
                {scenario.humidity}%
              </strong>
            </div>

            <div className="twin-signal">
              <Wind size={17} />
              <span>RAIN</span>
              <strong>
                {analysis.rain}
              </strong>
            </div>
          </div>

          <div className="twin-policy">
            <div className="twin-policy-top">
              <div>
                <span>POLICY OUTPUT</span>
                <strong>{action}</strong>
              </div>

              <Sparkles size={19} />
            </div>

            <div className="twin-policy-metrics">
              <div>
                <span>ESTIMATED WATER</span>
                <strong>
                  {Number(waterAmount) || 0}
                  <small>L</small>
                </strong>
              </div>

              <div>
                <span>CONFIDENCE</span>
                <strong>
                  {confidence}
                  <small>%</small>
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}