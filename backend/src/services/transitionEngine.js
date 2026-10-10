const {
  ACTIONS,
  simulateEnvironment,
  getState,
  calculateReward
} = require("./qLearningEngine");


/* =========================================================
   STATE LABELS
========================================================= */

const STATE_LABELS = {
  VERY_DRY: "Very Dry",
  DRY: "Dry",
  OPTIMAL: "Optimal",
  WET: "Wet",
  VERY_WET: "Very Wet"
};


/* =========================================================
   GET STATE INFORMATION
========================================================= */

function getStateInfo(sensorData) {

  const state =
    getState(sensorData);

  const parts =
    state.split("_");

  const soil =
    parts[0];

  const temperature =
    parts[1];

  const rain =
    parts.slice(2).join("_");


  return {

    id: state,

    soilState: soil,

    soilLabel:
      STATE_LABELS[soil] ||
      soil,

    temperatureState:
      temperature,

    rainState:
      rain

  };
}


/* =========================================================
   CALCULATE TRANSITIONS
========================================================= */

function calculateTransitions(
  sensorData
) {

  const currentState =
    getStateInfo(
      sensorData
    );


  const transitions = [];


  Object.entries(
    ACTIONS
  ).forEach(
    ([action, waterAmount]) => {

      const nextSensors =
        simulateEnvironment(
          sensorData,
          action
        );


      const nextState =
        getStateInfo(
          nextSensors
        );


      const reward =
        calculateReward(
          sensorData,
          nextSensors,
          action
        );


      /*
        Simple deterministic
        transition probability.

        The environment simulator
        currently produces one
        deterministic next state.
      */

      transitions.push({

        fromState:
          currentState.id,

        fromStateLabel:
          currentState.soilLabel,

        action,

        waterAmount,

        reward,

        toState:
          nextState.id,

        toStateLabel:
          nextState.soilLabel,

        nextMoisture:
          nextSensors.soilMoisture,

        probability:
          1.0

      });

    }
  );


  return {

    currentState,

    transitions

  };
}


/* =========================================================
   BUILD STATE GRAPH
========================================================= */

function buildStateGraph(
  sensorData
) {

  const {
    currentState,
    transitions
  } =
    calculateTransitions(
      sensorData
    );


  const nodes = [];


  /*
    Add current state.
  */

  nodes.push({

    id:
      currentState.id,

    label:
      currentState.soilLabel,

    type:
      "current"

  });


  /*
    Add destination states.
  */

  transitions.forEach(
    (transition) => {

      const exists =
        nodes.some(
          (node) =>
            node.id ===
            transition.toState
        );


      if (!exists) {

        nodes.push({

          id:
            transition.toState,

          label:
            transition.toStateLabel,

          type:
            transition.toState ===
            currentState.id
              ? "current"
              : "transition"

        });

      }

    }
  );


  const edges =
    transitions.map(
      (transition) => ({

        id:
          `${transition.fromState}-${transition.action}`,

        source:
          transition.fromState,

        target:
          transition.toState,

        action:
          transition.action,

        waterAmount:
          transition.waterAmount,

        reward:
          transition.reward,

        probability:
          transition.probability

      })
    );


  return {

    nodes,

    edges,

    currentState:
      currentState.id

  };
}


/* =========================================================
   MAIN TRANSITION ANALYSIS
========================================================= */

function analyzeTransitions(
  sensorData
) {

  const result =
    calculateTransitions(
      sensorData
    );


  const graph =
    buildStateGraph(
      sensorData
    );


  return {

    algorithm:
      "MARKOV DECISION PROCESS",

    currentState:
      result.currentState,

    transitions:
      result.transitions,

    graph

  };
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  getStateInfo,

  calculateTransitions,

  buildStateGraph,

  analyzeTransitions

};