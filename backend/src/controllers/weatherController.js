const farmData = require("../data/farmData");

const {
  getCurrentWeather: fetchCurrentWeather,
  getForecast: fetchForecast,
} = require("../services/weatherService");

function getCoordinates(req) {
  return {
    latitude:
      Number(req.query.latitude) ||
      Number(farmData.location.latitude),

    longitude:
      Number(req.query.longitude) ||
      Number(farmData.location.longitude),
  };
}

async function getCurrentWeather(
  req,
  res
) {
  try {
    const {
      latitude,
      longitude,
    } = getCoordinates(req);

    const weather =
      await fetchCurrentWeather(
        latitude,
        longitude
      );

    res.status(200).json(weather);
  } catch (error) {
    console.error(
      "Weather current error:",
      error
    );

    res.status(503).json({
      success: false,
      message:
        "Live weather is temporarily unavailable.",
      error: error.message,
    });
  }
}

async function getForecast(req, res) {
  try {
    const {
      latitude,
      longitude,
    } = getCoordinates(req);

    const forecast =
      await fetchForecast(
        latitude,
        longitude
      );

    res.status(200).json(forecast);
  } catch (error) {
    console.error(
      "Weather forecast error:",
      error
    );

    res.status(503).json({
      success: false,
      message:
        "Weather forecast is temporarily unavailable.",
      error: error.message,
    });
  }
}

module.exports = {
  getCurrentWeather,
  getForecast,
};