const {
  getStateTransitions
} = require("../controllers/transitionController");

const express = require("express");

const {
  getIrrigationDecision,
  getQLearningDecision,
  getFarmData,
  getPolicy
} = require("../controllers/irrigationController");

const router = express.Router();


/* =========================================================
   FARM DATA
========================================================= */

/*
  GET /api/irrigation/farm

  Returns:
  - Farm information
  - Crop information
  - Current sensor values
  - Irrigation status
*/

router.get(
  "/farm",
  getFarmData
);


/* =========================================================
   LEARNED POLICY
========================================================= */

/*
  GET /api/irrigation/policy

  Returns the persistent Q-learning
  policy and learned state-action values.
*/

router.get(
  "/policy",
  getPolicy
);


/* =========================================================
   CLASSICAL MDP DECISION
========================================================= */

/*
  POST /api/irrigation/decision

  Calculates the irrigation decision
  using the deterministic MDP reward model.

  Example body:

  {
    "soilMoisture": 28,
    "temperature": 34,
    "humidity": 46,
    "rainProbability": 12
  }
*/

router.post(
  "/decision",
  getIrrigationDecision
);


/* =========================================================
   Q-LEARNING DECISION
========================================================= */

/*
  POST /api/irrigation/q-learning

  Runs the reinforcement-learning
  irrigation engine.

  Example body:

  {
    "soilMoisture": 28,
    "temperature": 34,
    "humidity": 46,
    "rainProbability": 12,
    "episodes": 1000
  }
*/

router.post(
  "/q-learning",
  getQLearningDecision
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;
/* =========================================================
   MDP STATE TRANSITIONS
========================================================= */

/*
  POST /api/irrigation/transitions

  Returns the possible state transitions
  for every irrigation action.
*/

router.post(
  "/transitions",
  getStateTransitions
);