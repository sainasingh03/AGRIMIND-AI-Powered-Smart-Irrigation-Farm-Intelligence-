import {
  ArrowRight,
  BrainCircuit,
  CloudRain,
  Droplets,
  Gauge,
  GitBranch,
  Leaf,
  RefreshCw,
  Sparkles,
  Thermometer,
  Target,
  Waves,
} from "lucide-react";

import { useFarm } from "../context/FarmContext";

export default function MDPVisualizer() {
  const {
    farm,
    weather,
    mdpResult,
    transitionResult,
  } = useFarm();

  const sensors = farm?.sensors || {};

  const soilMoisture = Number(sensors.soilMoisture ?? 28);
  const temperature = Number(
    weather?.temperature ?? sensors.temperature ?? 34
  );
  const humidity = Number(
    weather?.humidity ?? sensors.humidity ?? 46
  );
  const rainProbability = Number(
    weather?.rainProbability ??
      sensors.rainProbability ??
      12
  );

  const state =
    mdpResult?.state ||
    mdpResult?.currentState ||
    {};

  const stateId =
    typeof state === "string"
      ? state
      : state?.id || buildStateId();

  const recommendation =
    mdpResult?.recommendation?.action ||
    mdpResult?.recommendedAction ||
    mdpResult?.action ||
    "NO_IRRIGATION";

  const evaluation =
    mdpResult?.evaluation ||
    transitionResult?.evaluation ||
    [];

  const transition =
    transitionResult?.transition ||
    transitionResult?.result ||
    null;

  function buildStateId() {
    const soil =
      soilMoisture <= 20
        ? "VERY_DRY"
        : soilMoisture <= 40
          ? "DRY"
          : soilMoisture <= 60
            ? "OPTIMAL"
            : soilMoisture <= 80
              ? "WET"
              : "VERY_WET";

    const temp =
      temperature < 20
        ? "COOL"
        : temperature <= 30
          ? "NORMAL"
          : "HOT";

    const rain =
      rainProbability < 20
        ? "LOW_RAIN"
        : rainProbability <= 60
          ? "MEDIUM_RAIN"
          : "HIGH_RAIN";

    return `${soil}_${temp}_${rain}`;
  }

  const nodes = [
    {
      label: "STATE",
      title: stateId,
      icon: <GitBranch size={16} />,
      type: "state",
    },
    {
      label: "ACTION",
      title: recommendation.replaceAll("_", " "),
      icon: <Target size={16} />,
      type: "action",
    },
    {
      label: "REWARD",
      title:
        evaluation.length > 0
          ? `${Number(
              evaluation[0]?.reward ??
                evaluation[0]?.score ??
                0
            ).toFixed(1)} pts`
          : "Calculated",
      icon: <Sparkles size={16} />,
      type: "reward",
    },
    {
      label: "NEXT STATE",
      title:
        transition?.nextState?.id ||
        transition?.nextState ||
        "Predicted",
      icon: <RefreshCw size={16} />,
      type: "next",
    },
  ];

  return (
    <section className="mdp-visualizer">
      <div className="mdp-header">
        <div>
          <div className="mdp-kicker">
            <span />
            DECISION MODEL
          </div>

          <h3>Markov Decision Process</h3>

          <p>
            AGRIMIND represents irrigation as a sequence of
            states, actions, rewards and predicted future states.
          </p>
        </div>

        <div className="mdp-header-icon">
          <BrainCircuit size={22} />
        </div>
      </div>

      <div className="mdp-sensors">
        <div className="mdp-sensor">
          <div className="mdp-sensor-icon">
            <Droplets size={15} />
          </div>

          <div>
            <span>SOIL</span>
            <strong>{soilMoisture}%</strong>
          </div>
        </div>

        <div className="mdp-sensor">
          <div className="mdp-sensor-icon">
            <Thermometer size={15} />
          </div>

          <div>
            <span>TEMP</span>
            <strong>{temperature}°C</strong>
          </div>
        </div>

        <div className="mdp-sensor">
          <div className="mdp-sensor-icon">
            <Waves size={15} />
          </div>

          <div>
            <span>HUMIDITY</span>
            <strong>{humidity}%</strong>
          </div>
        </div>

        <div className="mdp-sensor">
          <div className="mdp-sensor-icon">
            <CloudRain size={15} />
          </div>

          <div>
            <span>RAIN</span>
            <strong>{rainProbability}%</strong>
          </div>
        </div>
      </div>

      <div className="mdp-flow">
        {nodes.map((node, index) => (
          <div className="mdp-flow-group" key={node.label}>
            <div className={`mdp-node mdp-node-${node.type}`}>
              <div className="mdp-node-top">
                <div className="mdp-node-icon">
                  {node.icon}
                </div>

                <span>{node.label}</span>
              </div>

              <strong title={node.title}>
                {node.title}
              </strong>

              <div className="mdp-node-line">
                <i />
                <i />
                <i />
              </div>
            </div>

            {index < nodes.length - 1 && (
              <div className="mdp-connector">
                <ArrowRight size={15} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mdp-formula">
        <div className="mdp-formula-icon">
          <Gauge size={17} />
        </div>

        <div>
          <span>POLICY LOGIC</span>
          <p>
            <strong>Current state</strong>
            {" → "}
            <strong>Action</strong>
            {" → "}
            <strong>Reward</strong>
            {" → "}
            <strong>Next state</strong>
          </p>
        </div>
      </div>

      <div className="mdp-footer">
        <div className="mdp-footer-left">
          <Leaf size={13} />
          <span>
            The objective is to maintain healthy soil moisture
            while minimizing unnecessary water usage.
          </span>
        </div>

        <div className="mdp-engine">
          <span className="mdp-engine-dot" />
          MDP ENGINE
        </div>
      </div>
    </section>
  );
}