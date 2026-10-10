const farmData = {
  id: "GVF-001",

  name: "Green Valley Farm",

  location: {
    latitude: 26.4499,
    longitude: 80.3319
  },

  crop: {
    name: "Wheat",
    growthStage: "Vegetative"
  },

  sensors: {
    soilMoisture: 28,
    temperature: 34,
    humidity: 46,
    rainProbability: 12
  },

  irrigation: {
    tankLevel: 72,
    pumpStatus: "OFF"
  }
};

module.exports = farmData;