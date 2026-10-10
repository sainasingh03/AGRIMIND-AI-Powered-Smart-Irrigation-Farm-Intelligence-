const express = require("express");

const {
  getCurrentWeather,
  getForecast,
} = require("../controllers/weatherController");

const router = express.Router();

router.get("/current", getCurrentWeather);
router.get("/forecast", getForecast);

module.exports = router;