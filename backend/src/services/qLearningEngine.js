const fs = require("fs");
const path = require("path");

const policyStore = require("./policyStore");

const ACTIONS = [
  {
    id: "NO_IRRIGATION",
    waterAmount: 0,
  },
  {
    id: "LOW_IRRIGATION",
    waterAmount: 10,
  },
  {
    id: "MEDIUM_IRRIGATION",
    waterAmount: 25,
  },
  {
    id: "HIGH_IRRIGATION",
    waterAmount: 40,
  },
];

const ALPHA = 0.1;
const GAMMA = 0.9;
const EPSILON = 0.2;

const TARGET_MOISTURE = 55;
const HEALTHY_MIN = 45;
const HEALTHY_MAX = 65;

const Q_TABLE_PATH = path.join(
  __dirname,
  "../data/qTable.json"
);

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeSensors(sensors = {}) {
  return {
    soilMoisture: clamp(
      toNumber(sensors.soilMoisture, 28),
      0,
      100
    ),

    temperature: clamp(
      toNumber(sensors.temperature, 34),
      -20,
      60
    ),

    humidity: clamp(
      toNumber(sensors.humidity, 46),
      0,
      100
    ),

    rainProbability: clamp(
      toNumber(sensors.rainProbability, 12),
      0,
      100
    ),
  };
}

/* =========================================================
   STATE REPRESENTATION
   ========================================================= */

function getSoilState(soilMoisture) {
  if (soilMoisture <= 20) {
    return "VERY_DRY";
  }

  if (soilMoisture <= 40) {
    return "DRY";
  }

  if (soilMoisture <= 60) {
    return "OPTIMAL";
  }

  if (soilMoisture <= 80) {
    return "WET";
  }

  return "VERY_WET";
}

function getTemperatureState(temperature) {
  if (temperature < 20) {
    return "COOL";
  }

  if (temperature <= 30) {
    return "NORMAL";
  }

  return "HOT";
}

function getRainState(rainProbability) {
  if (rainProbability < 20) {
    return "LOW";
  }

  if (rainProbability <= 60) {
    return "MEDIUM";
  }

  return "HIGH";
}

function getState(sensors = {}) {
  const normalized = normalizeSensors(sensors);

  const soil = getSoilState(
    normalized.soilMoisture
  );

  const temperature = getTemperatureState(
    normalized.temperature
  );

  const rain = getRainState(
    normalized.rainProbability
  );

  return {
    soil,
    temperature,
    rain,
    id: `${soil}_${temperature}_${rain}`,
  };
}

/* =========================================================
   Q-TABLE
   ========================================================= */

function createEmptyQValues() {
  return {
    NO_IRRIGATION: 0,
    LOW_IRRIGATION: 0,
    MEDIUM_IRRIGATION: 0,
    HIGH_IRRIGATION: 0,
  };
}

function readQTable() {
  try {
    if (!fs.existsSync(Q_TABLE_PATH)) {
      return {};
    }

    const raw = fs.readFileSync(
      Q_TABLE_PATH,
      "utf8"
    );

    if (!raw.trim()) {
      return {};
    }

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object"
      ? parsed
      : {};
  } catch (error) {
    console.warn(
      "AGRIMIND: Unable to read Q-table. Starting fresh.",
      error.message
    );

    return {};
  }
}

function writeQTable(qTable) {
  try {
    const directory = path.dirname(
      Q_TABLE_PATH
    );

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, {
        recursive: true,
      });
    }

    fs.writeFileSync(
      Q_TABLE_PATH,
      JSON.stringify(qTable, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.warn(
      "AGRIMIND: Unable to persist Q-table.",
      error.message
    );

    return false;
  }
}

function ensureState(qTable, stateId) {
  if (!qTable[stateId]) {
    qTable[stateId] = createEmptyQValues();
  }

  for (const action of ACTIONS) {
    if (
      typeof qTable[stateId][action.id] !==
      "number"
    ) {
      qTable[stateId][action.id] = 0;
    }
  }

  return qTable[stateId];
}

/* =========================================================
   ENVIRONMENT SIMULATION
   ========================================================= */

function calculateEvaporation(sensors) {
  const temperatureFactor =
    Math.max(
      0,
      sensors.temperature - 20
    ) * 0.12;

  const humidityFactor =
    Math.max(
      0,
      50 - sensors.humidity
    ) * 0.035;

  return clamp(
    0.5 +
      temperatureFactor +
      humidityFactor,
    0.2,
    6
  );
}

function calculateRainEffect(
  sensors
) {
  return clamp(
    sensors.rainProbability * 0.08,
    0,
    8
  );
}

function simulateNextState(
  sensors,
  action
) {
  const evaporation =
    calculateEvaporation(sensors);

  const rainEffect =
    calculateRainEffect(sensors);

  const irrigationEffect =
    action.waterAmount * 0.65;

  const nextMoisture = clamp(
    sensors.soilMoisture +
      irrigationEffect +
      rainEffect -
      evaporation,
    0,
    100
  );

  const nextHumidity = clamp(
    sensors.humidity +
      rainEffect * 0.8 -
      evaporation * 0.25,
    0,
    100
  );

  return normalizeSensors({
    ...sensors,
    soilMoisture: nextMoisture,
    humidity: nextHumidity,
  });
}

/* =========================================================
   REWARD FUNCTION
   ========================================================= */

function calculateReward(
  currentSensors,
  nextSensors,
  action
) {
  const currentDistance =
    Math.abs(
      TARGET_MOISTURE -
        currentSensors.soilMoisture
    );

  const nextDistance =
    Math.abs(
      TARGET_MOISTURE -
        nextSensors.soilMoisture
    );

  const moistureImprovement =
    currentDistance - nextDistance;

  let reward =
    moistureImprovement * 2;

  /* Healthy moisture */

  if (
    nextSensors.soilMoisture >=
      HEALTHY_MIN &&
    nextSensors.soilMoisture <=
      HEALTHY_MAX
  ) {
    reward += 8;
  }

  /* Dry soil */

  if (
    nextSensors.soilMoisture < 30
  ) {
    reward -= 5;
  }

  /* Overwatering */

  if (
    nextSensors.soilMoisture > 75
  ) {
    reward -= 10;
  }

  /* Water conservation */

  reward -=
    action.waterAmount * 0.08;

  /* Rain awareness */

  if (
    currentSensors.rainProbability >=
      60
  ) {
    if (action.waterAmount > 0) {
      reward -= 8;
    } else {
      reward += 5;
    }
  }

  /* High temperature */

  if (
    currentSensors.temperature > 35 &&
    action.waterAmount >= 25
  ) {
    reward += 2;
  }

  /* Excessive irrigation */

  if (
    action.id === "HIGH_IRRIGATION" &&
    currentSensors.soilMoisture > 45
  ) {
    reward -= 7;
  }

  return Number(
    reward.toFixed(4)
  );
}

/* =========================================================
   ACTION SELECTION
   ========================================================= */

function chooseAction(
  qValues,
  epsilon = EPSILON
) {
  const randomValue = Math.random();

  if (randomValue < epsilon) {
    const randomIndex =
      Math.floor(
        Math.random() *
          ACTIONS.length
      );

    return ACTIONS[randomIndex];
  }

  return ACTIONS.reduce(
    (best, action) => {
      const bestValue =
        qValues[best.id] ?? 0;

      const currentValue =
        qValues[action.id] ?? 0;

      return currentValue >
        bestValue
        ? action
        : best;
    },
    ACTIONS[0]
  );
}

/* =========================================================
   Q-LEARNING UPDATE
   ========================================================= */

function updateQValue({
  qTable,
  stateId,
  actionId,
  reward,
  nextStateId,
}) {
  const currentQValues =
    ensureState(
      qTable,
      stateId
    );

  const nextQValues =
    ensureState(
      qTable,
      nextStateId
    );

  const currentQ =
    currentQValues[actionId] ?? 0;

  const nextMaxQ =
    Math.max(
      ...ACTIONS.map(
        (action) =>
          nextQValues[action.id] ?? 0
      )
    );

  const updatedQ =
    currentQ +
    ALPHA *
      (reward +
        GAMMA * nextMaxQ -
        currentQ);

  currentQValues[actionId] =
    Number(
      updatedQ.toFixed(6)
    );

  return currentQValues[actionId];
}

/* =========================================================
   TRAINING
   ========================================================= */

function createTrainingEnvironment(
  baseSensors
) {
  const variation = () =>
    (Math.random() - 0.5) * 8;

  return normalizeSensors({
    soilMoisture:
      baseSensors.soilMoisture +
      variation(),

    temperature:
      baseSensors.temperature +
      variation() * 0.5,

    humidity:
      baseSensors.humidity +
      variation(),

    rainProbability:
      baseSensors.rainProbability +
      variation() * 2,
  });
}

function train(
  baseSensors = {},
  episodes = 100
) {
  const sensors =
    normalizeSensors(
      baseSensors
    );

  const qTable =
    readQTable();

  let totalReward = 0;
  let totalSteps = 0;

  const episodeRewards = [];

  for (
    let episode = 0;
    episode < episodes;
    episode++
  ) {
    let currentSensors =
      createTrainingEnvironment(
        sensors
      );

    let episodeReward = 0;

    for (
      let step = 0;
      step < 10;
      step++
    ) {
      const currentState =
        getState(
          currentSensors
        );

      const currentQValues =
        ensureState(
          qTable,
          currentState.id
        );

      const action =
        chooseAction(
          currentQValues,
          EPSILON
        );

      const nextSensors =
        simulateNextState(
          currentSensors,
          action
        );

      const nextState =
        getState(
          nextSensors
        );

      const reward =
        calculateReward(
          currentSensors,
          nextSensors,
          action
        );

      updateQValue({
        qTable,
        stateId:
          currentState.id,
        actionId:
          action.id,
        reward,
        nextStateId:
          nextState.id,
      });

      episodeReward += reward;
      totalReward += reward;
      totalSteps++;

      currentSensors =
        nextSensors;
    }

    episodeRewards.push(
      Number(
        episodeReward.toFixed(3)
      )
    );
  }

  const persisted =
    writeQTable(qTable);

  const averageReward =
    totalSteps > 0
      ? totalReward / totalSteps
      : 0;

  return {
    qTable,
    episodes,
    steps: totalSteps,
    averageReward:
      Number(
        averageReward.toFixed(3)
      ),
    lastEpisodeReward:
      episodeRewards.length
        ? episodeRewards[
            episodeRewards.length - 1
          ]
        : 0,
    persisted,
  };
}

/* =========================================================
   POLICY
   ========================================================= */

function getBestAction(
  qValues
) {
  return ACTIONS.reduce(
    (best, action) => {
      const bestValue =
        qValues[best.id] ?? 0;

      const currentValue =
        qValues[action.id] ?? 0;

      return currentValue >
        bestValue
        ? action
        : best;
    },
    ACTIONS[0]
  );
}

function calculateConfidence(
  qValues
) {
  const values = ACTIONS.map(
    (action) =>
      Number(
        qValues[action.id] ?? 0
      )
  );

  const sorted = [
    ...values,
  ].sort((a, b) => b - a);

  const best = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;

  const spread =
    Math.abs(best - second);

  const magnitude =
    Math.abs(best) +
    Math.abs(second) +
    1;

  const confidence =
    0.5 +
    Math.min(
      0.49,
      spread / magnitude
    );

  return Number(
    confidence.toFixed(3)
  );
}

function buildPolicy(
  qTable
) {
  const policy = {};

  for (const stateId of Object.keys(
    qTable
  )) {
    const qValues =
      ensureState(
        qTable,
        stateId
      );

    const action =
      getBestAction(
        qValues
      );

    policy[stateId] = {
      action: action.id,
      waterAmount:
        action.waterAmount,
      confidence:
        calculateConfidence(
          qValues
        ),
    };
  }

  return policy;
}

/* =========================================================
   MAIN ANALYSIS
   ========================================================= */

function analyze(
  inputSensors = {}
) {
  const sensors =
    normalizeSensors(
      inputSensors
    );

  /*
   * Small training pass before analysis.
   * This allows the local policy to adapt to
   * the current environmental conditions.
   */

  const training =
    train(
      sensors,
      40
    );

  const qTable =
    training.qTable;

  const state =
    getState(
      sensors
    );

  const qValues =
    ensureState(
      qTable,
      state.id
    );

  const bestAction =
    getBestAction(
      qValues
    );

  const confidence =
    calculateConfidence(
      qValues
    );

  const policy =
    buildPolicy(
      qTable
    );

  /*
   * If all values are still identical,
   * provide a deterministic fallback
   * based on agricultural state.
   */

  const allValuesEqual =
    new Set(
      Object.values(
        qValues
      ).map((value) =>
        Number(value.toFixed(6))
      )
    ).size === 1;

  let recommendedAction =
    bestAction;

  if (allValuesEqual) {
    if (
      sensors.rainProbability >=
      60
    ) {
      recommendedAction =
        ACTIONS[0];
    } else if (
      sensors.soilMoisture <= 20
    ) {
      recommendedAction =
        ACTIONS[3];
    } else if (
      sensors.soilMoisture <= 40
    ) {
      recommendedAction =
        ACTIONS[2];
    } else if (
      sensors.soilMoisture <= 60
    ) {
      recommendedAction =
        ACTIONS[1];
    } else {
      recommendedAction =
        ACTIONS[0];
    }
  }

  return {
    state,

    currentState:
      state.id,

    recommendedAction:
      recommendedAction.id,

    action:
      recommendedAction.id,

    waterAmount:
      recommendedAction.waterAmount,

    qValues: {
      ...qValues,
    },

    policy: {
      action:
        recommendedAction.id,

      waterAmount:
        recommendedAction.waterAmount,

      confidence:
        confidence,

      state:
        state.id,

      statesLearned:
        Object.keys(
          qTable
        ).length,
    },

    training: {
      episodes:
        training.episodes,

      steps:
        training.steps,

      averageReward:
        training.averageReward,

      lastEpisodeReward:
        training.lastEpisodeReward,

      persisted:
        training.persisted,
    },

    parameters: {
      alpha: ALPHA,
      gamma: GAMMA,
      epsilon: EPSILON,
      targetMoisture:
        TARGET_MOISTURE,
      healthyRange: [
        HEALTHY_MIN,
        HEALTHY_MAX,
      ],
    },

    algorithm:
      "Q-LEARNING",
  };
}

/* =========================================================
   PUBLIC POLICY API
   ========================================================= */

function getPolicy() {
  const qTable =
    readQTable();

  return buildPolicy(
    qTable
  );
}

function getQTable() {
  return readQTable();
}

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  ACTIONS,

  getState,

  train,

  analyze,

  getPolicy,

  getQTable,

  calculateReward,

  simulateNextState,
};