const farmData =
  require("../data/farmData");

const {
  analyzeTransitions
} =
  require("../services/transitionEngine");


/* =========================================================
   MDP STATE TRANSITIONS
========================================================= */

function getStateTransitions(
  req,
  res
) {

  try {

    const sensors =
      req.body &&
      Object.keys(req.body).length > 0

        ? {

            soilMoisture:
              Number(
                req.body.soilMoisture
              ),

            temperature:
              Number(
                req.body.temperature
              ),

            humidity:
              Number(
                req.body.humidity
              ),

            rainProbability:
              Number(
                req.body.rainProbability
              )

          }

        : farmData.sensors;


    /* =========================================
       VALIDATION
    ========================================= */

    if (
      !isValidSensors(
        sensors
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid sensor values."

      });

    }


    /* =========================================
       ANALYZE MDP TRANSITIONS
    ========================================= */

    const result =
      analyzeTransitions(
        sensors
      );


    /* =========================================
       RESPONSE
    ========================================= */

    res.json({

      success: true,

      timestamp:
        new Date().toISOString(),

      farm: {

        id:
          farmData.id,

        name:
          farmData.name,

        crop:
          farmData.crop

      },

      sensors,

      ...result

    });

  } catch (error) {

    console.error(
      "Transition analysis error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to calculate MDP transitions."

    });

  }

}


/* =========================================================
   SENSOR VALIDATION
========================================================= */

function isValidSensors(
  sensors
) {

  const fields = [

    "soilMoisture",

    "temperature",

    "humidity",

    "rainProbability"

  ];


  for (
    const field
    of fields
  ) {

    if (

      typeof sensors[field] !==
        "number"

      ||

      !Number.isFinite(
        sensors[field]
      )

    ) {

      return false;

    }

  }


  if (

    sensors.soilMoisture < 0

    ||

    sensors.soilMoisture > 100

  ) {

    return false;

  }


  if (

    sensors.humidity < 0

    ||

    sensors.humidity > 100

  ) {

    return false;

  }


  if (

    sensors.rainProbability < 0

    ||

    sensors.rainProbability > 100

  ) {

    return false;

  }


  if (

    sensors.temperature < -20

    ||

    sensors.temperature > 70

  ) {

    return false;

  }


  return true;

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

  getStateTransitions

};