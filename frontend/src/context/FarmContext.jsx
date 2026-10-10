import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * AGRIMIND — Farm Context
 * ---------------------------------------
 * Central state manager for:
 * - Farm information
 * - Simulated IoT sensor telemetry
 * - Current weather and forecast
 * - MDP irrigation decisions
 * - Q-learning recommendations
 * - Scenario simulation
 *
 * IMPORTANT:
 * Sensor values are simulated unless real hardware
 * is connected. Weather is retrieved from the backend.
 */

const FarmContext = createContext(null);

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
).replace(/\/+$/, "");

const REFRESH_INTERVALS = {
  telemetry: 15_000,
  weather: 15 * 60_000,
  policy: 60_000,
};

const DEFAULT_FARM = {
  id: "GVF-001",
  name: "Green Valley Farm",
  location: {
    latitude: 26.4499,
    longitude: 80.3319,
  },
  crop: {
    name: "Wheat",
    growthStage: "Vegetative",
  },
  sensors: {
    soilMoisture: 28,
    temperature: 34,
    humidity: 46,
    rainProbability: 12,
  },
  irrigation: {
    tankLevel: 72,
    pumpStatus: "OFF",
  },
};

const DEFAULT_SENSORS = {
  soilMoisture: 28,
  temperature: 34,
  humidity: 46,
  rainProbability: 12,
  tankLevel: 72,
};

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSensors = (input = {}) => ({
  soilMoisture: clamp(
    toNumber(input.soilMoisture, DEFAULT_SENSORS.soilMoisture),
    0,
    100
  ),
  temperature: clamp(
    toNumber(input.temperature, DEFAULT_SENSORS.temperature),
    -10,
    60
  ),
  humidity: clamp(
    toNumber(input.humidity, DEFAULT_SENSORS.humidity),
    0,
    100
  ),
  rainProbability: clamp(
    toNumber(input.rainProbability, DEFAULT_SENSORS.rainProbability),
    0,
    100
  ),
  tankLevel: clamp(
    toNumber(input.tankLevel, DEFAULT_SENSORS.tankLevel),
    0,
    100
  ),
});

const extractPayload = (response) => {
  if (response == null) return null;

  if (typeof response !== "object") return response;

  if (response.data && typeof response.data === "object") {
    return response.data;
  }

  return response;
};

const normalizeFarm = (payload) => {
  if (!payload || typeof payload !== "object") {
    return DEFAULT_FARM;
  }

  const source = extractPayload(payload);
  const sensors = normalizeSensors({
    ...DEFAULT_SENSORS,
    ...(source?.sensors || {}),
  });

  return {
    ...DEFAULT_FARM,
    ...source,
    location: {
      ...DEFAULT_FARM.location,
      ...(source.location || {}),
    },
    crop: {
      ...DEFAULT_FARM.crop,
      ...(source.crop || {}),
    },
    sensors,
    irrigation: {
      ...DEFAULT_FARM.irrigation,
      ...(source.irrigation || {}),
    },
  };
};

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    let payload = null;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = text ? { message: text } : null;
    }

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        `API request failed (${response.status})`;

      throw new Error(message);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function getErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "Request timed out.";
  }

  return error?.message || "Unable to connect to the AGRIMIND backend.";
}

function inferState(sensors) {
  const soil = sensors.soilMoisture;
  const temperature = sensors.temperature;
  const rain = sensors.rainProbability;

  if (soil < 25 && temperature >= 30 && rain < 40) {
    return "DRY_HOT_LOW_RAIN";
  }

  if (soil < 35 && rain >= 40) {
    return "DRY_RAIN_EXPECTED";
  }

  if (soil < 35) {
    return "DRY";
  }

  if (soil > 75) {
    return "WET";
  }

  if (temperature >= 35) {
    return "HOT";
  }

  return "OPTIMAL";
}

function buildFallbackDecision(sensors) {
  const normalized = normalizeSensors(sensors);
  const state = inferState(normalized);

  let action = "MONITOR";
  let waterAmount = 0;
  let reason = "Soil conditions are acceptable. Continue monitoring.";

  if (
    normalized.soilMoisture < 30 &&
    normalized.rainProbability < 40
  ) {
    action = "IRRIGATE";
    waterAmount = clamp(
      Math.round((35 - normalized.soilMoisture) * 2),
      10,
      40
    );
    reason = "Soil moisture is low and significant rain is not expected.";
  } else if (
    normalized.rainProbability >= 65 &&
    normalized.soilMoisture >= 25
  ) {
    action = "DELAY";
    waterAmount = 0;
    reason = "Rain is likely. Delay irrigation and reassess conditions.";
  } else if (normalized.soilMoisture >= 75) {
    action = "STOP";
    waterAmount = 0;
    reason = "Soil moisture is high. Avoid additional irrigation.";
  }

  return {
    state,
    currentState: state,
    action,
    recommendedAction: action,
    recommendation: {
      action,
      waterAmount,
      reason,
    },
    waterAmount,
    confidence: 0.6,
    reason,
    source: "LOCAL_HEURISTIC_FALLBACK",
    simulated: true,
    createdAt: new Date().toISOString(),
  };
}

function normalizeDecision(payload, sensors) {
  const source = extractPayload(payload) || {};
  const fallback = buildFallbackDecision(sensors);

  const recommendation =
    source.recommendation &&
    typeof source.recommendation === "object"
      ? source.recommendation
      : {};

  const action =
    source.recommendedAction ||
    source.action ||
    recommendation.action ||
    recommendation.recommendedAction ||
    fallback.action;

  const waterAmount = toNumber(
    source.waterAmount ??
      recommendation.waterAmount ??
      recommendation.waterLitres ??
      recommendation.water,
    fallback.waterAmount
  );

  const rawConfidence = toNumber(
    source.confidence ?? recommendation.confidence,
    fallback.confidence
  );

  const confidence =
    rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;

  const state =
    source.state ||
    source.currentState ||
    fallback.state;

  return {
    ...fallback,
    ...source,
    state,
    currentState: state,
    action,
    recommendedAction: action,
    waterAmount,
    confidence: clamp(confidence, 0, 1),
    recommendation: {
      ...fallback.recommendation,
      ...recommendation,
      action,
      waterAmount,
    },
  };
}

export function FarmProvider({ children }) {
  const [farm, setFarm] = useState(DEFAULT_FARM);

  const [liveSensors, setLiveSensors] = useState(DEFAULT_SENSORS);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [policy, setPolicy] = useState(null);

  const [mdpResult, setMdpResult] = useState(null);
  const [qLearningResult, setQLearningResult] = useState(null);

  const [lastScenario, setLastScenario] = useState(null);
  const [decisionHistory, setDecisionHistory] = useState([]);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [errors, setErrors] = useState({
    farm: null,
    telemetry: null,
    weather: null,
    forecast: null,
    policy: null,
    decision: null,
  });

  const mountedRef = useRef(false);
  const requestSequence = useRef(0);
  const inFlightRef = useRef({
    farm: false,
    telemetry: false,
    weather: false,
    forecast: false,
    policy: false,
  });

  const updateError = useCallback((key, message) => {
    setErrors((previous) => ({
      ...previous,
      [key]: message || null,
    }));
  }, []);

  const loadFarm = useCallback(async () => {
    if (inFlightRef.current.farm) return;
    inFlightRef.current.farm = true;

    try {
      const payload = await apiRequest("/api/irrigation/farm");
      const normalized = normalizeFarm(payload);

      setFarm(normalized);
      setLiveSensors((previous) =>
        normalizeSensors({
          ...previous,
          ...normalized.sensors,
          tankLevel:
            normalized.irrigation?.tankLevel ??
            previous.tankLevel,
        })
      );

      setBackendOnline(true);
      updateError("farm", null);
    } catch (error) {
      setBackendOnline(false);
      updateError("farm", getErrorMessage(error));

      // Keep the UI usable with explicitly simulated demo values.
    } finally {
      inFlightRef.current.farm = false;
      setLoading(false);
    }
  }, [updateError]);

  const loadTelemetry = useCallback(async () => {
    if (inFlightRef.current.telemetry) return;
    inFlightRef.current.telemetry = true;

    try {
      const payload = extractPayload(
        await apiRequest("/api/sensor/telemetry")
      );

      const sensorSource =
        payload?.sensors ||
        payload?.telemetry ||
        payload?.data ||
        payload;

      setLiveSensors((previous) => normalizeSensors({
        ...previous,
        ...sensorSource,
      }));
      setBackendOnline(true);
      updateError("telemetry", null);
    } catch (error) {
      updateError("telemetry", getErrorMessage(error));
    } finally {
      inFlightRef.current.telemetry = false;
    }
  }, [updateError]);

  const loadWeather = useCallback(async () => {
    if (inFlightRef.current.weather) return;
    inFlightRef.current.weather = true;
    try {
      const payload = await apiRequest("/api/weather/current");
      const data = extractPayload(payload);
      setWeather(data);
      setBackendOnline(true);
      updateError("weather", data?.stale ? "Weather provider temporarily rate-limited; showing last cached observation." : null);
    } catch (error) {
      updateError("weather", getErrorMessage(error));
    } finally {
      inFlightRef.current.weather = false;
    }
  }, [updateError]);

  const loadForecast = useCallback(async () => {
    if (inFlightRef.current.forecast) return;
    inFlightRef.current.forecast = true;
    try {
      const payload = extractPayload(await apiRequest("/api/weather/forecast"));
      const rows = Array.isArray(payload)
        ? payload
        : payload?.forecast || payload?.daily || payload?.data || [];
      setForecast(Array.isArray(rows) ? rows : []);
      updateError("forecast", payload?.stale ? "Forecast provider temporarily rate-limited; showing cached forecast." : null);
    } catch (error) {
      updateError("forecast", getErrorMessage(error));
    } finally {
      inFlightRef.current.forecast = false;
    }
  }, [updateError]);

  const loadPolicy = useCallback(async () => {
    if (inFlightRef.current.policy) return;
    inFlightRef.current.policy = true;

    try {
      const payload = await apiRequest("/api/irrigation/policy");
      setPolicy(extractPayload(payload));
      updateError("policy", null);
    } catch (error) {
      updateError("policy", getErrorMessage(error));
    } finally {
      inFlightRef.current.policy = false;
    }
  }, [updateError]);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      loadFarm(),
      loadTelemetry(),
      loadWeather(),
      loadForecast(),
      loadPolicy(),
    ]);
  }, [
    loadFarm,
    loadTelemetry,
    loadWeather,
    loadForecast,
    loadPolicy,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    refreshAll();

    const telemetryTimer = setInterval(
      loadTelemetry,
      REFRESH_INTERVALS.telemetry
    );

    const weatherTimer = setInterval(() => {
      loadWeather();
      loadForecast();
    }, REFRESH_INTERVALS.weather);

    const policyTimer = setInterval(
      loadPolicy,
      REFRESH_INTERVALS.policy
    );

    return () => {
      mountedRef.current = false;
      clearInterval(telemetryTimer);
      clearInterval(weatherTimer);
      clearInterval(policyTimer);
    };
  }, [refreshAll, loadTelemetry, loadWeather, loadForecast, loadPolicy]);

  const calculateMDP = useCallback(
    async (scenarioSensors = null) => {
      const baseSensors = scenarioSensors || lastScenario || liveSensors;
      const sensors = normalizeSensors({
        ...baseSensors,
        ...(weather && !scenarioSensors && !lastScenario ? {
          temperature: weather.temperature ?? weather.temperature_2m ?? baseSensors.temperature,
          humidity: weather.humidity ?? weather.relative_humidity_2m ?? baseSensors.humidity,
          rainProbability: weather.rainProbability ?? baseSensors.rainProbability,
        } : {}),
      });

      try {
        const result = await apiRequest("/api/irrigation/decision", {
          method: "POST",
          body: JSON.stringify({ sensors }),
        });

        const normalized = normalizeDecision(result, sensors);
        setMdpResult(normalized);
        updateError("decision", null);
        return normalized;
      } catch (error) {
        const fallback = buildFallbackDecision(sensors);
        setMdpResult(fallback);
        updateError("decision", getErrorMessage(error));
        return fallback;
      }
    },
    [lastScenario, liveSensors, weather, updateError]
  );

  const analyzeWithAI = useCallback(
    async (scenarioSensors = null, useLiveWeather = true) => {
      const sequence = ++requestSequence.current;
      const baseSensors = normalizeSensors(
        scenarioSensors || lastScenario || liveSensors
      );

      let sensors = { ...baseSensors };

      if (useLiveWeather && weather) {
        sensors = normalizeSensors({
          ...sensors,
          temperature:
            weather.temperature ??
            weather.temperature_2m ??
            sensors.temperature,
          humidity:
            weather.humidity ??
            weather.relative_humidity_2m ??
            sensors.humidity,
          rainProbability:
            weather.rainProbability ??
            weather.precipitation_probability ??
            sensors.rainProbability,
        });
      }

      setAiLoading(true);

      try {
        const result = await apiRequest(
          "/api/irrigation/q-learning",
          {
            method: "POST",
            body: JSON.stringify({ sensors }),
          }
        );

        const normalized = normalizeDecision(result, sensors);

        if (sequence === requestSequence.current) {
          setQLearningResult(normalized);
          setBackendOnline(true);
          updateError("decision", null);
          appendHistory(normalized, sensors, "Q_LEARNING");
        }

        return normalized;
      } catch (error) {
        const fallback = buildFallbackDecision(sensors);

        if (sequence === requestSequence.current) {
          setQLearningResult(fallback);
          updateError("decision", getErrorMessage(error));
          appendHistory(fallback, sensors, "LOCAL_HEURISTIC_FALLBACK");
        }

        return fallback;
      } finally {
        if (sequence === requestSequence.current) {
          setAiLoading(false);
        }
      }
    },
    [lastScenario, liveSensors, weather, updateError]
  );

  const appendHistory = (decision, sensors, source) => {
    setDecisionHistory((previous) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          state: decision.state,
          action: decision.action,
          waterAmount: decision.waterAmount,
          confidence: decision.confidence,
          source,
          sensors: { ...sensors },
        },
        ...previous,
      ].slice(0, 100)
    );
  };

  const runScenario = useCallback(
    async (scenarioInput = {}) => {
      const sensors = normalizeSensors({
        ...liveSensors,
        ...scenarioInput,
      });

      setScenarioLoading(true);
      setLastScenario(sensors);

      try {
        const [mdp, qLearning] = await Promise.all([
          calculateMDP(sensors),
          analyzeWithAI(sensors, false),
        ]);

        return { sensors, mdp, qLearning };
      } finally {
        setScenarioLoading(false);
      }
    },
    [liveSensors, calculateMDP, analyzeWithAI]
  );

  const resetScenario = useCallback(() => {
    setLastScenario(null);
    setMdpResult(null);
    setQLearningResult(null);
    updateError("decision", null);
  }, [updateError]);

  const refreshTelemetry = useCallback(
    () => loadTelemetry(),
    [loadTelemetry]
  );

  const refreshWeather = useCallback(
    async () => Promise.allSettled([loadWeather(), loadForecast()]),
    [loadWeather, loadForecast]
  );

  const activeSensors = useMemo(
    () => normalizeSensors(lastScenario || liveSensors),
    [lastScenario, liveSensors]
  );

  const activeDecision = qLearningResult || mdpResult;

  const currentState =
    activeDecision?.state ||
    activeDecision?.currentState ||
    inferState(activeSensors);

  const recommendation =
    activeDecision?.recommendation ||
    buildFallbackDecision(activeSensors).recommendation;

  const recommendedAction =
    activeDecision?.recommendedAction ||
    activeDecision?.action ||
    recommendation?.action ||
    "MONITOR";

  const waterAmount = toNumber(
    activeDecision?.waterAmount ??
      recommendation?.waterAmount,
    0
  );

  const policyConfidence = clamp(
    Math.round(
      toNumber(activeDecision?.confidence, 0.6) * 100
    ),
    0,
    100
  );

  const systemStatus = backendOnline
    ? "LIVE SYSTEM"
    : "DEMO MODE";

  const value = useMemo(
    () => ({
      // Farm
      farm,
      setFarm,

      // Sensor telemetry
      sensors: activeSensors,
      liveSensors,
      activeSensors,
      defaultSensors: DEFAULT_SENSORS,
      telemetryMode: "SIMULATED",
      telemetrySource: "Simulated IoT telemetry",
      refreshTelemetry,
      fetchTelemetry: refreshTelemetry,

      // Weather
      weather,
      forecast,
      refreshWeather,
      fetchWeather: loadWeather,
      weatherLoading: loading,
      fetchForecast: loadForecast,
      weatherSource: weather
        ? weather.source || "Backend weather service"
        : "Weather unavailable",

      // Policy
      policy,
      refreshPolicy: loadPolicy,

      // Decisions
      mdpResult,
      qLearningResult,
      recommendation,
      recommendedAction,
      waterAmount,
      currentState,
      policyConfidence,
      aiLoading,
      scenarioLoading,
      calculateMDP,
      analyzeWithAI,
      runScenario,
      resetScenario,

      // History
      decisionHistory,

      // System
      backendOnline,
      systemStatus,
      loading,
      errors,
      apiBase: API_BASE,
      refreshAll,
    }),
    [
      farm,
      activeSensors,
      liveSensors,
      refreshTelemetry,
      weather,
      forecast,
      refreshWeather,
      loadWeather,
      loadForecast,
      loading,
      loadPolicy,
      policy,
      mdpResult,
      qLearningResult,
      recommendation,
      recommendedAction,
      waterAmount,
      currentState,
      policyConfidence,
      aiLoading,
      scenarioLoading,
      calculateMDP,
      analyzeWithAI,
      runScenario,
      resetScenario,
      decisionHistory,
      backendOnline,
      systemStatus,
      loading,
      errors,
      refreshAll,
    ]
  );

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);

  if (!context) {
    throw new Error("useFarm must be used inside a FarmProvider.");
  }

  return context;
}

export default FarmContext;