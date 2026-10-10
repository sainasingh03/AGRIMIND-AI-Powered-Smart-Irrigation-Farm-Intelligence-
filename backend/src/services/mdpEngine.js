const ACTIONS = {
  NO_IRRIGATION: 0,
  LOW_IRRIGATION: 10,
  MEDIUM_IRRIGATION: 25,
  HIGH_IRRIGATION: 40
};

function getSoilState(moisture) {
  if (moisture <= 20) return "VERY_DRY";
  if (moisture <= 40) return "DRY";
  if (moisture <= 60) return "OPTIMAL";
  if (moisture <= 80) return "WET";
  return "VERY_WET";
}

function getTemperatureState(temperature) {
  if (temperature < 20) return "COOL";
  if (temperature <= 30) return "NORMAL";
  return "HOT";
}

function getRainState(rainProbability) {
  if (rainProbability < 20) return "LOW_RAIN";
  if (rainProbability <= 60) return "MEDIUM_RAIN";
  return "HIGH_RAIN";
}

function getState(sensorData) {
  const soil = getSoilState(sensorData.soilMoisture);
  const temperature = getTemperatureState(sensorData.temperature);
  const rain = getRainState(sensorData.rainProbability);

  return {
    soil,
    temperature,
    rain,
    id: `${soil}_${temperature}_${rain}`
  };
}

function calculateReward(
  currentMoisture,
  waterAmount,
  rainProbability
) {
  const targetMoisture = 55;

  const moistureBefore = Math.abs(
    targetMoisture - currentMoisture
  );

  const moistureAfter = Math.min(
    100,
    currentMoisture + waterAmount * 0.55
  );

  const moistureAfterDistance = Math.abs(
    targetMoisture - moistureAfter
  );

  const healthReward = 30 - moistureAfterDistance;

  const waterPenalty = waterAmount * 0.35;

  const rainPenalty =
    rainProbability > 60
      ? waterAmount * 0.5
      : 0;

  const improvement =
    moistureBefore - moistureAfterDistance;

  const reward =
    healthReward +
    improvement -
    waterPenalty -
    rainPenalty;

  return Number(reward.toFixed(2));
}

function evaluateActions(sensorData) {
  const results = [];

  for (const [action, waterAmount] of Object.entries(ACTIONS)) {
    const reward = calculateReward(
      sensorData.soilMoisture,
      waterAmount,
      sensorData.rainProbability
    );

    results.push({
      action,
      waterAmount,
      reward
    });
  }

  return results;
}

function selectBestAction(sensorData) {
  const state = getState(sensorData);

  const actions = evaluateActions(sensorData);

  actions.sort((a, b) => b.reward - a.reward);

  const bestAction = actions[0];

  return {
    state,
    recommendedAction: bestAction.action,
    waterAmount: bestAction.waterAmount,
    expectedReward: bestAction.reward,
    alternatives: actions
  };
}

module.exports = {
  getState,
  calculateReward,
  evaluateActions,
  selectBestAction
};