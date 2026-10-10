import {
  Activity,
  Cloud,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  Radio,
  Server,
  Thermometer,
  Wifi,
  WifiOff,
} from "lucide-react";


import { useFarm } from "../context/FarmContext";
import "./MDPFlow.css";

function formatTime(value) {
  if (!value) return "Waiting";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Available";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusDot({ active = false }) {
  return (
    <span className={`system-status-dot ${active ? "active" : ""}`} />
  );
}

function TelemetryRow({
  icon: Icon,
  label,
  value,
  source,
  active = true,
}) {
  return (
    <div className="telemetry-row">
      <div className="telemetry-icon">
        <Icon size={15} />
      </div>

      <div className="telemetry-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="telemetry-source">
        <StatusDot active={active} />
        {source}
      </div>
    </div>
  );
}

export default function SystemStatus() {
  const {
    sensors,
    liveSensors,
    weather,
    backendOnline,
    systemStatus,
    telemetryUpdatedAt,
    weatherUpdatedAt,
  } = useFarm();

  const activeSensors = sensors || liveSensors || {};

  const soilMoisture = Number(activeSensors.soilMoisture);
  const temperature = Number(
    weather?.temperature ?? activeSensors.temperature
  );
  const humidity = Number(
    weather?.humidity ?? activeSensors.humidity
  );
  const rainProbability = Number(
    weather?.rainProbability ?? activeSensors.rainProbability
  );

  const safe = (value, suffix = "") => {
    if (!Number.isFinite(value)) return "—";
    return `${Math.round(value)}${suffix}`;
  };

  const systemOnline =
    backendOnline || systemStatus?.code === "LIVE";

  return (
    <div className="system-status">

      {/* SYSTEM HEADER */}
      <div className="system-status-header">
        <div className="system-status-identity">
          <div
            className={`system-status-orb ${
              systemOnline ? "online" : "offline"
            }`}
          >
            {systemOnline ? (
              <Wifi size={18} />
            ) : (
              <WifiOff size={18} />
            )}
          </div>

          <div>
            <span className="system-status-label">
              SYSTEM CONNECTION
            </span>

            <h3>
              {systemOnline
                ? "AGRIMIND online"
                : "AGRIMIND offline"}
            </h3>
          </div>
        </div>

        <div
          className={`system-status-badge ${
            systemOnline ? "online" : "offline"
          }`}
        >
          <StatusDot active={systemOnline} />
          {systemOnline ? "LIVE" : "OFFLINE"}
        </div>
      </div>

      {/* CONNECTION MATRIX */}
      <div className="system-status-matrix">

        <div className="system-status-node">
          <div className="node-icon">
            <Server size={15} />
          </div>

          <div>
            <span>API ENGINE</span>
            <strong>
              {systemOnline ? "CONNECTED" : "UNAVAILABLE"}
            </strong>
          </div>
        </div>

        <div className="system-status-node">
          <div className="node-icon">
            <Cpu size={15} />
          </div>

          <div>
            <span>AI POLICY</span>
            <strong>READY</strong>
          </div>
        </div>

        <div className="system-status-node">
          <div className="node-icon">
            <Database size={15} />
          </div>

          <div>
            <span>Q-TABLE</span>
            <strong>LOADED</strong>
          </div>
        </div>

      </div>

      {/* TELEMETRY */}
      <div className="system-status-section">

        <div className="system-status-section-title">
          <Activity size={14} />
          <span>ENVIRONMENT TELEMETRY</span>
        </div>

        <div className="telemetry-list">

          <TelemetryRow
            icon={Droplets}
            label="Soil moisture"
            value={safe(soilMoisture, "%")}
            source="SIM"
            active
          />

          <TelemetryRow
            icon={Thermometer}
            label="Temperature"
            value={safe(temperature, "°")}
            source={weather ? "LIVE" : "SIM"}
            active={Boolean(weather)}
          />

          <TelemetryRow
            icon={Cloud}
            label="Humidity"
            value={safe(humidity, "%")}
            source={weather ? "LIVE" : "SIM"}
            active={Boolean(weather)}
          />

          <TelemetryRow
            icon={CloudRain}
            label="Rain probability"
            value={safe(rainProbability, "%")}
            source={weather ? "LIVE" : "SIM"}
            active={Boolean(weather)}
          />

        </div>
      </div>

      {/* DATA SOURCES */}
      <div className="system-status-sources">

        <div className="source-line">
          <Radio size={13} />

          <span>
            Sensor telemetry
          </span>

          <strong>SIMULATED</strong>

          <small>
            {formatTime(telemetryUpdatedAt)}
          </small>
        </div>

        <div className="source-line">
          <Cloud size={13} />

          <span>
            Weather intelligence
          </span>

          <strong>
            {weather ? "OPEN-METEO" : "WAITING"}
          </strong>

          <small>
            {formatTime(weatherUpdatedAt)}
          </small>
        </div>

      </div>

      {/* FOOTNOTE */}
      <div className="system-status-note">
        <span className="system-note-mark">i</span>

        <p>
          AGRIMIND currently uses simulated farm telemetry.
          Weather conditions are fetched independently when
          available.
        </p>
      </div>

    </div>
  );
}