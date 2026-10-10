const {
  getCurrentWeather,
  getForecast,
} = require("./weatherService");

const DEFAULT_LOCATION = {
  latitude: 26.4499,
  longitude: 80.3319,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates the irrigation-relevant rain probability
 * from the next few forecast hours.
 *
 * We intentionally use the next 6 hours rather than
 * averaging the entire 7-day forecast.
 */
function calculateNextHoursRainProbability(
  forecast = [],
  hours = 6
) {
  if (!Array.isArray(forecast) || forecast.length === 0) {
    return null;
  }

  const values = forecast
    .slice(0, hours)
    .map((item) => Number(item?.rainProbability))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) /
      values.length
  );
}

/**
 * Convert weather + short-term forecast into
 * irrigation intelligence.
 */
function buildWeatherIntelligence(
  weather,
  forecast = []
) {
  const temperature = Number(weather?.temperature);
  const humidity = Number(weather?.humidity);

  const rainProbability =
    calculateNextHoursRainProbability(
      forecast,
      6
    );

  const safeTemperature = Number.isFinite(
    temperature
  )
    ? temperature
    : null;

  const safeHumidity = Number.isFinite(humidity)
    ? humidity
    : null;

  const safeRainProbability =
    Number.isFinite(rainProbability)
      ? clamp(rainProbability, 0, 100)
      : null;

  /* -----------------------------
     Rain risk
  ----------------------------- */

  let rainRisk = "UNKNOWN";

  if (safeRainProbability !== null) {
    if (safeRainProbability >= 60) {
      rainRisk = "HIGH";
    } else if (safeRainProbability >= 30) {
      rainRisk = "MEDIUM";
    } else {
      rainRisk = "LOW";
    }
  }

  /* -----------------------------
     Heat risk
  ----------------------------- */

  let heatRisk = "UNKNOWN";

  if (safeTemperature !== null) {
    if (safeTemperature > 35) {
      heatRisk = "HIGH";
    } else if (safeTemperature > 30) {
      heatRisk = "MEDIUM";
    } else {
      heatRisk = "LOW";
    }
  }

  /* -----------------------------
     Humidity
  ----------------------------- */

  let humidityLevel = "UNKNOWN";

  if (safeHumidity !== null) {
    if (safeHumidity < 30) {
      humidityLevel = "LOW";
    } else if (safeHumidity > 70) {
      humidityLevel = "HIGH";
    } else {
      humidityLevel = "NORMAL";
    }
  }

  /* -----------------------------
     Irrigation adjustment
  ----------------------------- */

  let irrigationAdjustment = "NORMAL";

  if (rainRisk === "HIGH") {
    irrigationAdjustment = "REDUCE";
  } else if (rainRisk === "MEDIUM") {
    irrigationAdjustment = "CAUTIOUS";
  }

  return {
    temperature: safeTemperature,
    humidity: safeHumidity,
    rainProbability: safeRainProbability,

    rainRisk,
    heatRisk,
    humidityLevel,

    irrigationAdjustment,

    forecastWindow: "NEXT_6_HOURS",

    source: weather?.source || "UNKNOWN",

    weatherTimestamp:
      weather?.timestamp || null,
  };
}

/**
 * Fetch current weather + forecast together.
 */
async function getWeatherIntelligence(
  latitude = DEFAULT_LOCATION.latitude,
  longitude = DEFAULT_LOCATION.longitude
) {
  const [weather, forecastResult] =
    await Promise.all([
      getCurrentWeather(
        latitude,
        longitude
      ),

      getForecast(
        latitude,
        longitude
      ),
    ]);

  const forecast =
    forecastResult?.forecast || [];

  const intelligence =
    buildWeatherIntelligence(
      weather,
      forecast
    );

  return {
    success: true,

    location: {
      latitude,
      longitude,
    },

    weather,

    forecast,

    intelligence,

    source: "Open-Meteo",

    updatedAt:
      new Date().toISOString(),
  };
}

module.exports = {
  getWeatherIntelligence,
  buildWeatherIntelligence,
  calculateNextHoursRainProbability,
};