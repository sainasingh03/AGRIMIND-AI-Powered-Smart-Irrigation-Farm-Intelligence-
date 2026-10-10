import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Droplets,
  Gauge,
  Sparkles,
} from "lucide-react";

import { useFarm } from "../context/FarmContext";

function prettyAction(action) {
  if (!action) return "Awaiting decision";

  return String(action)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function getDecisionTone(action) {
  if (!action) return "neutral";

  if (
    action === "NO_IRRIGATION"
  ) {
    return "safe";
  }

  if (
    action === "HIGH_IRRIGATION"
  ) {
    return "critical";
  }

  return "active";
}

export default function DecisionCard() {
  const {
    recommendation,
    recommendedAction,
    waterAmount,
    policyConfidence,
    currentState,
    aiLoading,
    analyzeWithAI,
  } = useFarm();

  const action =
    recommendedAction ||
    recommendation?.action ||
    null;

  const water =
    Number(waterAmount) || 0;

  const confidence = Math.min(
    100,
    Math.max(
      0,
      Number(policyConfidence) || 0
    )
  );

  const tone =
    getDecisionTone(action);

  return (
    <article
      className={`decision-card decision-card-${tone}`}
    >
      <div className="decision-card-glow" />

      <div className="decision-card-header">

        <div className="decision-card-title">

          <div className="decision-card-orb">
            <BrainCircuit size={22} />
          </div>

          <div>
            <span className="decision-card-kicker">
              <span />
              AI DECISION ENGINE
            </span>

            <h3>
              Irrigation policy
            </h3>
          </div>

        </div>

        <div className="decision-card-live">
          <span />
          MDP + Q-LEARNING
        </div>

      </div>

      <div className="decision-card-main">

        <div className="decision-card-action">

          <span>
            RECOMMENDED ACTION
          </span>

          <strong>
            {prettyAction(action)}
          </strong>

          <p>
            {action
              ? "The policy selected this action from the current environmental state."
              : "Run the intelligence engine to generate a field decision."}
          </p>

        </div>

        <div className="decision-card-arrow">
          <ArrowRight size={20} />
        </div>

      </div>

      <div className="decision-card-stats">

        <div className="decision-stat">

          <div className="decision-stat-icon">
            <Droplets size={16} />
          </div>

          <div>
            <span>
              WATER
            </span>

            <strong>
              {water} L
            </strong>
          </div>

        </div>

        <div className="decision-stat">

          <div className="decision-stat-icon">
            <Gauge size={16} />
          </div>

          <div>
            <span>
              CONFIDENCE
            </span>

            <strong>
              {confidence}%
            </strong>
          </div>

        </div>

        <div className="decision-stat">

          <div className="decision-stat-icon">
            <CheckCircle2 size={16} />
          </div>

          <div>
            <span>
              STATE
            </span>

            <strong>
              {currentState?.id ||
                currentState ||
                "—"}
            </strong>
          </div>

        </div>

      </div>

      <div className="decision-confidence">

        <div className="decision-confidence-head">
          <span>
            POLICY CERTAINTY
          </span>

          <strong>
            {confidence}%
          </strong>
        </div>

        <div className="decision-confidence-track">
          <div
            style={{
              width: `${confidence}%`,
            }}
          />
        </div>

      </div>

      <button
        type="button"
        className="decision-run-button"
        onClick={() =>
          analyzeWithAI()
        }
        disabled={aiLoading}
      >
        <Sparkles size={16} />

        {aiLoading
          ? "Calculating policy..."
          : action
          ? "Recalculate decision"
          : "Generate AI decision"}

        <ArrowRight size={15} />

      </button>

    </article>
  );
}