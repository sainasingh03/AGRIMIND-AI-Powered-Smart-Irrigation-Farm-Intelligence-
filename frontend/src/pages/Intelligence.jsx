import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  GitBranch,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useFarm } from "../context/FarmContext";

import "./Intelligence.css";

function pretty(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value, digits = 2) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(digits);
}

function ActionBar({ name, value, selected }) {
  const numericValue = Number(value) || 0;

  return (
    <div className={`action-bar ${selected ? "selected" : ""}`}>
      <div className="action-bar-label">
        <span>{pretty(name)}</span>

        {selected && (
          <small>
            <CheckCircle2 size={11} />
            SELECTED
          </small>
        )}
      </div>

      <div className="action-bar-track">
        <span
          style={{
            width: `${Math.min(
              100,
              Math.max(4, Math.abs(numericValue) * 8)
            )}%`,
          }}
        />
      </div>

      <strong>{formatNumber(numericValue)}</strong>
    </div>
  );
}

export default function Intelligence() {
  const {
    sensors,
    currentState,
    recommendation,
    recommendedAction,
    waterAmount,
    policyConfidence,
    qLearningResult,
    policy,
    policyLoading,
    aiLoading,
    analyzeWithAI,
    fetchPolicy,
  } = useFarm();

  const action =
    recommendedAction ||
    recommendation?.action ||
    qLearningResult?.action ||
    "ANALYZING";

  const confidence = Math.min(
    100,
    Math.max(0, Number(policyConfidence) || 0)
  );

  const qValues =
    qLearningResult?.qValues ||
    recommendation?.qValues ||
    {};

  const state =
    currentState?.id ||
    currentState?.state ||
    currentState?.soil ||
    "STATE_PENDING";

  const episodes =
    qLearningResult?.training?.episodes ||
    qLearningResult?.trainingMetrics?.episodes ||
    40;

  const learningRate =
    qLearningResult?.parameters?.learningRate ??
    qLearningResult?.learningRate ??
    0.15;

  const gamma =
    qLearningResult?.parameters?.gamma ??
    qLearningResult?.gamma ??
    0.85;

  const epsilon =
    qLearningResult?.parameters?.epsilon ??
    qLearningResult?.epsilon ??
    0.1;

  const qEntries = Object.entries(qValues);

  return (
    <main className="intelligence-page">
      {/* HERO */}

      <section className="intelligence-hero">
        <div>
          <div className="intelligence-eyebrow">
            <span />
            AGRIMIND / DECISION INTELLIGENCE
          </div>

          <h1>
            The brain
            <br />
            <em>behind the water.</em>
          </h1>

          <p>
            AGRIMIND evaluates the current field state, simulates
            possible actions and learns which irrigation decision
            best balances crop health and water efficiency.
          </p>
        </div>

        <div className="intelligence-engine">
          <div className="engine-orb">
            <BrainCircuit size={27} />
          </div>

          <div>
            <span>DECISION ENGINE</span>
            <strong>Q-LEARNING + MDP</strong>
            <small>Adaptive policy active</small>
          </div>
        </div>
      </section>

      {/* CURRENT DECISION */}

      <section className="decision-command">
        <div className="command-main">
          <div className="command-icon">
            <Sparkles size={21} />
          </div>

          <div>
            <span>CURRENT RECOMMENDATION</span>
            <h2>{pretty(action)}</h2>

            <p>
              The policy selected this action from the available
              irrigation action space.
            </p>
          </div>
        </div>

        <div className="command-stats">
          <div>
            <span>WATER</span>
            <strong>
              {Number(waterAmount) || 0}
              <small>L</small>
            </strong>
          </div>

          <div>
            <span>CONFIDENCE</span>
            <strong>
              {confidence}
              <small>%</small>
            </strong>
          </div>

          <div>
            <span>STATE</span>
            <strong>{pretty(state)}</strong>
          </div>
        </div>
      </section>

      {/* STATE + MODEL */}

      <section className="intelligence-grid">
        <article className="intelligence-card state-card">
          <div className="intelligence-card-header">
            <div>
              <span>01 / ENVIRONMENT</span>
              <h2>Current state</h2>
            </div>

            <GitBranch size={19} />
          </div>

          <div className="state-visual">
            <div className="state-core">
              <div>
                <span>FIELD STATE</span>
                <strong>{pretty(state)}</strong>
              </div>
            </div>
          </div>

          <div className="sensor-state-grid">
            <div>
              <span>SOIL</span>
              <strong>
                {sensors?.soilMoisture ?? "—"}%
              </strong>
            </div>

            <div>
              <span>TEMP</span>
              <strong>
                {sensors?.temperature ?? "—"}°C
              </strong>
            </div>

            <div>
              <span>HUMIDITY</span>
              <strong>
                {sensors?.humidity ?? "—"}%
              </strong>
            </div>

            <div>
              <span>RAIN</span>
              <strong>
                {sensors?.rainProbability ?? "—"}%
              </strong>
            </div>
          </div>
        </article>

        <article className="intelligence-card action-space-card">
          <div className="intelligence-card-header">
            <div>
              <span>02 / ACTION SPACE</span>
              <h2>Policy evaluation</h2>
            </div>

            <Target size={19} />
          </div>

          <p className="card-description">
            Every available irrigation action is evaluated before
            the policy selects the current decision.
          </p>

          <div className="action-bars">
            {qEntries.length > 0 ? (
              qEntries.map(([name, value]) => (
                <ActionBar
                  key={name}
                  name={name}
                  value={value}
                  selected={name === action}
                />
              ))
            ) : (
              <>
                <ActionBar
                  name="NO_IRRIGATION"
                  value={0}
                  selected={action === "NO_IRRIGATION"}
                />

                <ActionBar
                  name="LOW_IRRIGATION"
                  value={0}
                  selected={action === "LOW_IRRIGATION"}
                />

                <ActionBar
                  name="MEDIUM_IRRIGATION"
                  value={0}
                  selected={action === "MEDIUM_IRRIGATION"}
                />

                <ActionBar
                  name="HIGH_IRRIGATION"
                  value={0}
                  selected={action === "HIGH_IRRIGATION"}
                />
              </>
            )}
          </div>
        </article>
      </section>

      {/* LEARNING ENGINE */}

      <section className="learning-section">
        <div className="learning-heading">
          <div>
            <span>03 / LEARNING ENGINE</span>
            <h2>How AGRIMIND learns</h2>
          </div>

          <button
            className="policy-refresh"
            onClick={async () => {
              await fetchPolicy?.();
            }}
            disabled={policyLoading}
          >
            <RefreshCw
              size={14}
              className={
                policyLoading
                  ? "intelligence-spin"
                  : ""
              }
            />

            Refresh policy
          </button>
        </div>

        <div className="learning-flow">
          <div className="learning-step">
            <div className="learning-number">01</div>

            <div className="learning-icon">
              <Database size={19} />
            </div>

            <h3>Observe</h3>

            <p>
              Sensor and environmental signals describe the
              current farm state.
            </p>
          </div>

          <ChevronRight className="learning-arrow" />

          <div className="learning-step">
            <div className="learning-number">02</div>

            <div className="learning-icon">
              <GitBranch size={19} />
            </div>

            <h3>Evaluate</h3>

            <p>
              Candidate irrigation actions are tested against
              the reward function.
            </p>
          </div>

          <ChevronRight className="learning-arrow" />

          <div className="learning-step">
            <div className="learning-number">03</div>

            <div className="learning-icon">
              <TrendingUp size={19} />
            </div>

            <h3>Learn</h3>

            <p>
              Q-values are updated from simulated future
              states and rewards.
            </p>
          </div>

          <ChevronRight className="learning-arrow" />

          <div className="learning-step learning-step-final">
            <div className="learning-number">04</div>

            <div className="learning-icon">
              <Zap size={19} />
            </div>

            <h3>Decide</h3>

            <p>
              The learned policy selects the action with the
              strongest expected value.
            </p>
          </div>
        </div>
      </section>

      {/* PARAMETERS */}

      <section className="parameters-section">
        <div className="parameters-intro">
          <span>04 / MODEL PARAMETERS</span>
          <h2>Learning configuration</h2>

          <p>
            These parameters control how aggressively the model
            explores, learns and discounts future rewards.
          </p>
        </div>

        <div className="parameter-grid">
          <div className="parameter">
            <span>EPISODES</span>
            <strong>{episodes}</strong>
            <small>training iterations</small>
          </div>

          <div className="parameter">
            <span>LEARNING RATE</span>
            <strong>{learningRate}</strong>
            <small>α / update strength</small>
          </div>

          <div className="parameter">
            <span>DISCOUNT FACTOR</span>
            <strong>{gamma}</strong>
            <small>γ / future reward</small>
          </div>

          <div className="parameter">
            <span>EXPLORATION</span>
            <strong>{epsilon}</strong>
            <small>ε / policy exploration</small>
          </div>
        </div>
      </section>

      {/* POLICY STATUS */}

      <section className="policy-status">
        <div className="policy-status-icon">
          <Cpu size={21} />
        </div>

        <div className="policy-status-copy">
          <span>POLICY MEMORY</span>
          <strong>
            {policy
              ? "Learned policy available"
              : "Policy awaiting training"}
          </strong>

          <p>
            Q-learning updates the policy from repeated simulated
            transitions rather than relying on a single fixed
            irrigation threshold.
          </p>
        </div>

        <div className="policy-status-confidence">
          <span>POLICY CONFIDENCE</span>

          <strong>{confidence}%</strong>

          <div>
            <span
              style={{
                width: `${confidence}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* TRAIN */}

      <section className="intelligence-footer-action">
        <div>
          <span>DECISION ENGINE</span>
          <h2>Re-evaluate the field</h2>

          <p>
            Run the current sensor state through MDP and
            Q-learning again to generate a fresh irrigation
            recommendation.
          </p>
        </div>

        <button
          onClick={() => analyzeWithAI?.()}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <>
              <RefreshCw
                size={15}
                className="intelligence-spin"
              />
              Learning...
            </>
          ) : (
            <>
              <BrainCircuit size={16} />
              Run AI decision
            </>
          )}
        </button>
      </section>
    </main>
  );
}