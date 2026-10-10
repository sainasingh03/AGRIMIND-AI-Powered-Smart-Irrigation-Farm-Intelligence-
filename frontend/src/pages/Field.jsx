import {
  Activity,
  Cloud,
  CloudRain,
  Droplets,
  Gauge,
  Layers3,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  RefreshCw,
  Satellite,
  Sprout,
  Thermometer,
  Wind,
} from "lucide-react";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";

import { useEffect, useMemo, useState } from "react";

import "leaflet/dist/leaflet.css";
import { useFarm } from "../context/FarmContext";
import "./Field.css";

const FIELD_CENTER = [26.4499, 80.3319];

const FIELD_BOUNDARY = [
  [26.4512, 80.3298],
  [26.4520, 80.3330],
  [26.4499, 80.3352],
  [26.4479, 80.3338],
  [26.4482, 80.3302],
];

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pretty(value) {
  if (!value) return "Awaiting analysis";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function MapRecenter() {
  const map = useMap();

  return (
    <button
      className="field-map-control"
      type="button"
      onClick={() => {
        map.flyTo(FIELD_CENTER, 16, {
          duration: 0.9,
        });
      }}
      title="Recenter field"
    >
      <LocateFixed size={16} />
    </button>
  );
}

function MapFullscreen() {
  const map = useMap();

  const toggleFullscreen = () => {
    const container = map.getContainer();

    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <button
      className="field-map-control field-map-fullscreen"
      type="button"
      onClick={toggleFullscreen}
      title="Fullscreen map"
    >
      <Maximize2 size={16} />
    </button>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  status,
}) {
  return (
    <div className="field-metric">
      <div className="field-metric-icon">
        <Icon size={17} />
      </div>

      <div className="field-metric-copy">
        <span>{label}</span>

        <strong>
          {value}
          {unit && <small>{unit}</small>}
        </strong>

        {status && <em>{status}</em>}
      </div>
    </div>
  );
}

export default function Field() {
  const {
    farm,
    sensors,
    weather,
    forecast,
    recommendation,
    recommendedAction,
    waterAmount,
    policyConfidence,
    systemStatus,
    backendOnline,
    fetchTelemetry,
    fetchWeather,
    fetchForecast,
    telemetryLoading,
    weatherLoading,
  } = useFarm();

  const [satellite, setSatellite] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const soilMoisture = number(
    sensors?.soilMoisture,
    28
  );

  const sensorTemperature = number(
    sensors?.temperature,
    34
  );

  const sensorHumidity = number(
    sensors?.humidity,
    46
  );

  const sensorRain = number(
    sensors?.rainProbability,
    12
  );

  const liveTemperature = number(
    weather?.temperature,
    sensorTemperature
  );

  const liveHumidity = number(
    weather?.humidity,
    sensorHumidity
  );

  const liveRain = number(
    weather?.rainProbability,
    sensorRain
  );

  const wind = number(weather?.windSpeed);

  const action =
    recommendedAction ||
    recommendation?.action ||
    "NO_IRRIGATION";

  const water = number(waterAmount);

  const confidence = Math.min(
    100,
    Math.max(0, number(policyConfidence))
  );

  const crop =
    farm?.crop?.name || "Wheat";

  const farmName =
    farm?.name || "Green Valley Farm";

  const farmId =
    farm?.id || "GVF-001";

  const fieldState = useMemo(() => {
    if (soilMoisture <= 20) return "Very dry";
    if (soilMoisture <= 40) return "Dry";
    if (soilMoisture <= 60) return "Optimal";
    if (soilMoisture <= 80) return "Wet";
    return "Very wet";
  }, [soilMoisture]);

  const rainState =
    liveRain >= 60
      ? "High rain risk"
      : liveRain >= 30
        ? "Moderate rain risk"
        : "Low rain risk";

  const heatState =
    liveTemperature > 35
      ? "Heat stress"
      : liveTemperature > 30
        ? "Warm"
        : "Normal";

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);

    try {
      await Promise.all([
        fetchTelemetry?.(),
        fetchWeather?.(),
        fetchForecast?.(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      fetchWeather?.();
      fetchForecast?.();
      fetchTelemetry?.();
    }, 120000);

    return () => clearInterval(timer);
  }, [
    fetchWeather,
    fetchForecast,
    fetchTelemetry,
  ]);

  return (
    <main className="field-page">

      {/* HERO */}
      <section className="field-hero">

        <div className="field-hero-grid" />

        <div className="field-hero-top">
          <div className="field-location-pill">
            <MapIcon size={15} />

            <span>
              {farmName} · {farmId}
            </span>

            <i />
          </div>

          <div className="field-hero-actions">
            <button
              className={`view-toggle ${
                satellite ? "active" : ""
              }`}
              onClick={() =>
                setSatellite(true)
              }
            >
              <Satellite size={15} />
              Satellite
            </button>

            <button
              className={`view-toggle ${
                !satellite ? "active" : ""
              }`}
              onClick={() =>
                setSatellite(false)
              }
            >
              <MapIcon size={15} />
              Map
            </button>
          </div>
        </div>

        <div className="field-hero-content">

          <div className="field-kicker">
            AGRIMIND / LIVING INTELLIGENCE
          </div>

          <h1>
            See the field.
            <br />
            <em>Understand what it needs.</em>
          </h1>

          <p>
            A spatial view of the active field combining
            environmental telemetry, live weather and
            AGRIMIND's irrigation policy.
          </p>

          <div className="field-hero-meta">

            <div>
              <span>ACTIVE CROP</span>
              <strong>{crop}</strong>
            </div>

            <div>
              <span>FIELD STATE</span>
              <strong>{fieldState}</strong>
            </div>

            <div>
              <span>DECISION ENGINE</span>
              <strong>MDP + Q-Learning</strong>
            </div>

          </div>
        </div>

        <div className="field-orbit">
          <div className="field-orbit-ring ring-one" />
          <div className="field-orbit-ring ring-two" />
          <div className="field-orbit-ring ring-three" />

          <div className="field-orbit-core">
            <Sprout size={28} />
          </div>
        </div>
      </section>

      {/* LIVE STRIP */}
      <section className="field-live-strip">

        <div className="field-live-status">
          <span
            className={
              backendOnline
                ? "live-dot"
                : "live-dot offline"
            }
          />

          <div>
            <span>SYSTEM</span>
            <strong>
              {backendOnline
                ? "AGRIMIND online"
                : "Backend offline"}
            </strong>
          </div>
        </div>

        <div className="field-live-source">
          <span>WEATHER SOURCE</span>
          <strong>
            {weather?.source || "Open-Meteo"}
          </strong>
        </div>

        <div className="field-live-source">
          <span>FIELD TELEMETRY</span>
          <strong>SIMULATED</strong>
        </div>

        <button
          className="field-refresh-button"
          onClick={handleRefresh}
          disabled={
            refreshing ||
            telemetryLoading ||
            weatherLoading
          }
        >
          <RefreshCw
            size={15}
            className={
              refreshing ||
              telemetryLoading ||
              weatherLoading
                ? "spin"
                : ""
            }
          />

          Refresh signals
        </button>

      </section>

      {/* MAP + SIDE PANEL */}
      <section className="field-map-section">

        <div className="field-section-heading">

          <div>
            <span>01 / SPATIAL INTELLIGENCE</span>

            <h2>
              The field,
              <em> right now.</em>
            </h2>

            <p>
              Field geometry, monitoring zones and
              environmental context.
            </p>
          </div>

          <div className="field-heading-tag">
            <Activity size={15} />
            LIVE FIELD VIEW
          </div>

        </div>

        <div className="field-map-layout">

          <div className="field-map-card">

            <MapContainer
              center={FIELD_CENTER}
              zoom={16}
              minZoom={12}
              maxZoom={19}
              scrollWheelZoom
              zoomControl={false}
              className="field-leaflet-map"
            >

              {satellite ? (
                <TileLayer
                  attribution="© Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              ) : (
                <TileLayer
                  attribution='© OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              )}

              <ZoomControl position="bottomright" />

              <Polygon
                positions={FIELD_BOUNDARY}
                pathOptions={{
                  color: "#b6d7bd",
                  weight: 2,
                  fillColor: "#9ac6a5",
                  fillOpacity: 0.2,
                }}
              >
                <Popup>
                  <strong>{farmName}</strong>
                  <br />
                  {crop} field
                  <br />
                  State: {fieldState}
                </Popup>
              </Polygon>

              <Circle
                center={[
                  26.4508,
                  80.3312,
                ]}
                radius={75}
                pathOptions={{
                  color: "#c7a96b",
                  weight: 1.5,
                  dashArray: "5 7",
                  fillOpacity: 0.06,
                }}
              />

              <Circle
                center={[
                  26.4490,
                  80.3330,
                ]}
                radius={65}
                pathOptions={{
                  color: "#79a486",
                  weight: 1.5,
                  dashArray: "4 6",
                  fillOpacity: 0.08,
                }}
              />

              <CircleMarker
                center={FIELD_CENTER}
                radius={9}
                pathOptions={{
                  color: "#f6f3ea",
                  weight: 3,
                  fillColor: "#1b4332",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <strong>AGRIMIND field node</strong>
                  <br />
                  Soil: {soilMoisture}%
                  <br />
                  State: {fieldState}
                </Popup>
              </CircleMarker>

              <MapRecenter />
              <MapFullscreen />

            </MapContainer>

            <div className="map-overlay-top">
              <div>
                <span>FIELD NODE</span>
                <strong>{farmId}</strong>
              </div>

              <div className="map-mode">
                {satellite ? (
                  <>
                    <Satellite size={13} />
                    SATELLITE
                  </>
                ) : (
                  <>
                    <MapIcon size={13} />
                    MAP
                  </>
                )}
              </div>
            </div>

            <div className="map-overlay-bottom">

              <div className="map-legend">
                <i className="legend-field" />
                Field boundary
              </div>

              <div className="map-legend">
                <i className="legend-zone" />
                Monitoring zone
              </div>

              <div className="map-legend">
                <i className="legend-node" />
                Decision node
              </div>

            </div>

          </div>

          {/* SIDE INTELLIGENCE */}
          <aside className="field-intelligence-card">

            <div className="field-card-label">
              FIELD INTELLIGENCE
            </div>

            <h3>
              What the field
              <br />
              is telling us.
            </h3>

            <div className="field-metrics">

              <Metric
                icon={Droplets}
                label="SOIL MOISTURE"
                value={soilMoisture}
                unit="%"
                status={fieldState}
              />

              <Metric
                icon={Thermometer}
                label="TEMPERATURE"
                value={liveTemperature.toFixed(1)}
                unit="°C"
                status={heatState}
              />

              <Metric
                icon={CloudRain}
                label="RAIN PROBABILITY"
                value={liveRain}
                unit="%"
                status={rainState}
              />

              <Metric
                icon={Wind}
                label="WIND"
                value={wind.toFixed(1)}
                unit=" km/h"
                status="Live weather"
              />

            </div>

            <div className="field-decision-mini">

              <div className="decision-mini-top">
                <span>POLICY DECISION</span>

                <div className="decision-live">
                  <i />
                  {systemStatus?.label ||
                    "LIVE SYSTEM"}
                </div>
              </div>

              <strong>
                {pretty(action)}
              </strong>

              <div className="decision-mini-bottom">

                <span>
                  <Droplets size={13} />
                  {water} L
                </span>

                <span>
                  <Gauge size={13} />
                  {confidence}% confidence
                </span>

              </div>

            </div>

          </aside>

        </div>
      </section>

      {/* ENVIRONMENT */}
      <section className="field-environment">

        <div className="field-section-heading compact">

          <div>
            <span>02 / ENVIRONMENTAL SIGNALS</span>

            <h2>
              The conditions
              <em> behind the decision.</em>
            </h2>
          </div>

        </div>

        <div className="environment-cards">

          <article className="environment-card">
            <div className="environment-icon">
              <Thermometer size={19} />
            </div>

            <span>LIVE TEMPERATURE</span>

            <strong>
              {liveTemperature.toFixed(1)}
              <small>°C</small>
            </strong>

            <div className="environment-bar">
              <i
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      liveTemperature * 1.8
                    )
                  )}%`,
                }}
              />
            </div>

            <p>
              Current atmospheric temperature
            </p>
          </article>

          <article className="environment-card">
            <div className="environment-icon">
              <Cloud size={19} />
            </div>

            <span>HUMIDITY</span>

            <strong>
              {liveHumidity}
              <small>%</small>
            </strong>

            <div className="environment-bar">
              <i
                style={{
                  width: `${liveHumidity}%`,
                }}
              />
            </div>

            <p>
              Relative humidity from weather service
            </p>
          </article>

          <article className="environment-card">
            <div className="environment-icon">
              <CloudRain size={19} />
            </div>

            <span>RAIN PROBABILITY</span>

            <strong>
              {liveRain}
              <small>%</small>
            </strong>

            <div className="environment-bar">
              <i
                style={{
                  width: `${liveRain}%`,
                }}
              />
            </div>

            <p>
              Forecast-aware irrigation signal
            </p>
          </article>

          <article className="environment-card">
            <div className="environment-icon">
              <Droplets size={19} />
            </div>

            <span>FIELD MOISTURE</span>

            <strong>
              {soilMoisture}
              <small>%</small>
            </strong>

            <div className="environment-bar">
              <i
                style={{
                  width: `${soilMoisture}%`,
                }}
              />
            </div>

            <p>
              Simulated field telemetry
            </p>
          </article>

        </div>
      </section>

      {/* DATA PROVENANCE */}
      <section className="field-provenance">

        <div className="provenance-mark">
          <Layers3 size={20} />
        </div>

        <div>
          <span>
            AGRIMIND / DATA PROVENANCE
          </span>

          <h3>
            Live weather.
            <br />
            Transparent telemetry.
          </h3>

          <p>
            Weather conditions are fetched from
            Open-Meteo. Soil moisture and field
            telemetry are currently simulated for the
            prototype and are clearly separated from
            external weather intelligence.
          </p>
        </div>

        <div className="provenance-list">

          <div>
            <i className="source-live" />
            <span>Open-Meteo</span>
            <strong>LIVE</strong>
          </div>

          <div>
            <i className="source-simulated" />
            <span>Field telemetry</span>
            <strong>SIMULATED</strong>
          </div>

          <div>
            <i className="source-map" />
            <span>
              {satellite
                ? "Esri World Imagery"
                : "OpenStreetMap"}
            </span>
            <strong>MAP</strong>
          </div>

        </div>

      </section>

      <footer className="field-footer">
        <span>AGRIMIND</span>
        <span>Living Intelligence</span>
        <span>MDP · Q-LEARNING · WEATHER INTELLIGENCE</span>
      </footer>

    </main>
  );
}