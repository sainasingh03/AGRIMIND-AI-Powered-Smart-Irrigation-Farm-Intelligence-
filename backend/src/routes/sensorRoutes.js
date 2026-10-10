const express = require("express");

const farmData = require("../data/farmData");

const router = express.Router();

router.get("/telemetry", (req, res) => {
  res.json({
    success: true,
    mode: "SIMULATED",
    source: "DEMO_FARM_TELEMETRY",
    timestamp: new Date().toISOString(),

    telemetry: {
      soilMoisture: farmData.sensors.soilMoisture,
      temperature: farmData.sensors.temperature,
      humidity: farmData.sensors.humidity,
      rainProbability: farmData.sensors.rainProbability,

      tankLevel: farmData.irrigation.tankLevel,
      pumpStatus: farmData.irrigation.pumpStatus,
    },
  });
});

module.exports = router;