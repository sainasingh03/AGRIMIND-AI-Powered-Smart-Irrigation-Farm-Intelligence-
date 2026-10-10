const farmData = require("../data/farmData");

const mdpEngine = require("../services/mdpEngine");
const qLearningEngine = require("../services/qLearningEngine");

const {
  getCurrentWeather,
} = require("../services/weatherService");

const DEFAULT_SENSORS = {
  soilMoisture: 28,
  temperature: 34,
  humidity: 46,
  rainProbability: 12,
};

function toNumber(value, fallback) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSensors(input = {}) {
  return {
    soilMoisture: clamp(
      toNumber(
        input.soilMoisture,
        DEFAULT_SENSORS.soilMoisture
      ),
      0,
      100
    ),

    temperature: clamp(
      toNumber(
        input.temperature,
        DEFAULT_SENSORS.temperature
      ),
      -20,
      60
    ),

    humidity: clamp(
      toNumber(
        input.humidity,
        DEFAULT_SENSORS.humidity
      ),
      0,
      100
    ),

    rainProbability: clamp(
      toNumber(
        input.rainProbability,
        DEFAULT_SENSORS.rainProbability
      ),
      0,
      100
    ),
  };
}

function getFarmSensors() {
  return normalizeSensors({
    ...DEFAULT_SENSORS,
    ...(farmData.sensors || {}),
  });
}

// -----------------------------------------------------
// GET /api/irrigation/farm
// -----------------------------------------------------

function getFarmData(req, res) {
  return res.status(200).json({
    success: true,
    farm: {
      ...farmData,
      sensors: getFarmSensors(),
    },
  });
}

// -----------------------------------------------------
// POST /api/irrigation/decision
// Basic MDP decision
// -----------------------------------------------------

function getIrrigationDecision(req, res) {
  try {
    const sensors = normalizeSensors(
      req.body?.sensors || getFarmSensors()
    );

    const state = mdpEngine.getState(sensors);

    const evaluation = mdpEngine.evaluateActions(
      sensors
    );

    const recommendation =
      mdpEngine.selectBestAction(evaluation);

    return res.status(200).json({
      success: true,
      algorithm: "MARKOV DECISION PROCESS",

      farmId: farmData.id,

      sensors,

      state,

      evaluation,

      recommendation,
    });
  } catch (error) {
    console.error(
      "AGRIMIND MDP decision error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to calculate irrigation decision.",
      error: error.message,
    });
  }
}

// -----------------------------------------------------
// POST /api/irrigation/q-learning
// Q-learning decision
// -----------------------------------------------------

async function getQLearningDecision(req, res) {
  try {
    let sensors;

    const useLiveWeather =
      req.body?.useLiveWeather !== false;

    // -------------------------------------------------
    // LIVE WEATHER MODE
    // -------------------------------------------------

    if (useLiveWeather) {
      const baseSensors = getFarmSensors();

      try {
        const weather = await getCurrentWeather(
          farmData.location.latitude,
          farmData.location.longitude
        );

        sensors = normalizeSensors({
          ...baseSensors,

          temperature:
            weather?.temperature ??
            baseSensors.temperature,

          humidity:
            weather?.humidity ??
            baseSensors.humidity,

          rainProbability:
            weather?.rainProbability ??
            baseSensors.rainProbability,
        });
      } catch (weatherError) {
        console.warn(
          "AGRIMIND: Live weather unavailable. Using farm sensor values.",
          weatherError.message
        );

        sensors = baseSensors;
      }
    }

    // -------------------------------------------------
    // CUSTOM SENSOR MODE
    // -------------------------------------------------

    else {
      sensors = normalizeSensors(
        req.body?.sensors || getFarmSensors()
      );
    }

    // -------------------------------------------------
    // RUN Q-LEARNING
    // -------------------------------------------------

    const result = qLearningEngine.analyze(
      sensors
    );

    return res.status(200).json({
      success: true,

      algorithm: "Q-LEARNING",

      farmId: farmData.id,

      sensors,

      ...result,
    });
  } catch (error) {
    console.error(
      "AGRIMIND Q-learning controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to run Q-learning analysis.",
      error: error.message,
    });
  }
}

// -----------------------------------------------------
// GET /api/irrigation/policy
// -----------------------------------------------------

function getPolicy(req, res) {
  try {
    const policy =
      typeof qLearningEngine.getPolicy === "function"
        ? qLearningEngine.getPolicy()
        : null;

    return res.status(200).json({
      success: true,
      algorithm: "Q-LEARNING",
      policy,
    });
  } catch (error) {
    console.error(
      "AGRIMIND policy error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve policy.",
      error: error.message,
    });
  }
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------

module.exports = {
  getFarmData,
  getIrrigationDecision,
  getQLearningDecision,
  getPolicy,
};