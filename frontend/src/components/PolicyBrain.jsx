import {
  BrainCircuit,
  ChevronRight,
  Database,
  GitBranch,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { useFarm } from "../context/FarmContext";

function pretty(value) {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function confidence(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      number <= 1
        ? number * 100
        : number
    )
  );
}

export default function PolicyBrain() {
  const {
    policy,
    qLearningResult,
    policyConfidence,
    fetchPolicy,
    policyLoading,
  } = useFarm();

  const qValues =
    qLearningResult?.qValues ||
    {};

  const entries =
    Object.entries(qValues);

  const currentAction =
    qLearningResult?.recommendedAction ||
    qLearningResult?.action ||
    "NO_IRRIGATION";

  const currentState =
    qLearningResult?.state ||
    qLearningResult?.currentState ||
    "WAITING";

  const training =
    qLearningResult?.training ||
    qLearningResult?.trainingMetrics ||
    {};

  const episodes =
    training?.episodes ??
    qLearningResult?.episodes ??
    40;

  const learningRate =
    training?.learningRate ??
    qLearningResult?.parameters?.learningRate ??
    0.15;

  const exploration =
    training?.epsilon ??
    qLearningResult?.parameters?.epsilon ??
    0.1;

  const gamma =
    training?.gamma ??
    qLearningResult?.parameters?.gamma ??
    0.85;

  const displayedConfidence =
    confidence(
      qLearningResult?.confidence ??
        policyConfidence
    );

  const sortedActions =
    entries
      .map(([action, value]) => ({
        action,
        value: Number(value) || 0,
      }))
      .sort(
        (a, b) =>
          b.value - a.value
      );

  const bestValue =
    sortedActions[0]?.value ?? 0;

  return (
    <section className="policy-brain">

      <div className="policy-brain-header">

        <div>

          <span className="section-kicker">
            <span className="kicker-dot" />
            POLICY BRAIN
          </span>

          <h2>
            The decision behind
            <br />
            the decision.
          </h2>

          <p>
            AGRIMIND does not simply trigger
            irrigation. Its Q-learning policy
            evaluates possible actions and learns
            which response produces the best
            long-term field outcome.
          </p>

        </div>

        <button
          type="button"
          className="policy-refresh"
          onClick={fetchPolicy}
          disabled={policyLoading}
        >
          <RefreshCw
            size={14}
            className={
              policyLoading
                ? "spin"
                : ""
            }
          />

          {policyLoading
            ? "Refreshing..."
            : "Refresh policy"}
        </button>

      </div>

      <div className="policy-brain-layout">

        {/* STATE */}

        <article className="policy-state-card">

          <div className="policy-card-label">
            <Target size={14} />
            CURRENT STATE
          </div>

          <strong>
            {pretty(currentState)}
          </strong>

          <p>
            The environment is represented as
            a discrete state before the agent
            chooses an irrigation action.
          </p>

          <div className="policy-state-code">
            <span>
              STATE ID
            </span>

            <code>
              {typeof currentState ===
              "object"
                ? currentState?.id ||
                  "UNKNOWN"
                : String(
                    currentState
                  )}
            </code>
          </div>

        </article>

        {/* Q VALUES */}

        <article className="policy-q-card">

          <div className="policy-card-heading">

            <div>
              <div className="policy-card-label">
                <GitBranch size={14} />
                ACTION SPACE
              </div>

              <h3>
                Q-value evaluation
              </h3>
            </div>

            <Sparkles size={18} />

          </div>

          {sortedActions.length > 0 ? (
            <div className="policy-actions">

              {sortedActions.map(
                (item, index) => {

                  const width =
                    bestValue > 0
                      ? Math.max(
                          5,
                          Math.min(
                            100,
                            (item.value /
                              bestValue) *
                              100
                          )
                        )
                      : 5;

                  const selected =
                    item.action ===
                    currentAction;

                  return (
                    <div
                      className={`policy-action ${
                        selected
                          ? "policy-action-selected"
                          : ""
                      }`}
                      key={
                        item.action
                      }
                    >

                      <div className="policy-action-top">

                        <div className="policy-action-name">

                          <span
                            className={`policy-rank ${
                              index === 0
                                ? "policy-rank-best"
                                : ""
                            }`}
                          >
                            {index + 1}
                          </span>

                          <strong>
                            {pretty(
                              item.action
                            )}
                          </strong>

                        </div>

                        <span className="policy-q-value">
                          {item.value.toFixed(
                            2
                          )}
                        </span>

                      </div>

                      <div className="policy-bar">

                        <div
                          style={{
                            width: `${width}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          ) : (
            <div className="policy-empty">
              <Database size={18} />

              <span>
                Run Q-learning to populate
                the action-value table.
              </span>
            </div>
          )}

        </article>

        {/* LEARNING */}

        <article className="policy-learning-card">

          <div className="policy-card-label">
            <BrainCircuit size={14} />
            LEARNING PARAMETERS
          </div>

          <div className="policy-parameter">

            <span>
              Episodes
            </span>

            <strong>
              {episodes}
            </strong>

          </div>

          <div className="policy-parameter">

            <span>
              Learning rate α
            </span>

            <strong>
              {Number(
                learningRate
              ).toFixed(2)}
            </strong>

          </div>

          <div className="policy-parameter">

            <span>
              Discount γ
            </span>

            <strong>
              {Number(
                gamma
              ).toFixed(2)}
            </strong>

          </div>

          <div className="policy-parameter">

            <span>
              Exploration ε
            </span>

            <strong>
              {Number(
                exploration
              ).toFixed(2)}
            </strong>

          </div>

          <div className="policy-confidence">

            <div>
              <span>
                POLICY CONFIDENCE
              </span>

              <strong>
                {displayedConfidence}%
              </strong>
            </div>

            <div className="policy-confidence-track">
              <div
                style={{
                  width: `${displayedConfidence}%`,
                }}
              />
            </div>

          </div>

        </article>

      </div>

      <div className="policy-brain-footer">

        <div>

          <TrendingUp size={15} />

          <span>
            POLICY OUTPUT
          </span>

          <strong>
            {pretty(currentAction)}
          </strong>

        </div>

        <div className="policy-footer-arrow">
          <ChevronRight size={16} />
        </div>

        <div>

          <span>
            LONG-TERM OBJECTIVE
          </span>

          <strong>
            Maintain healthy moisture
            while minimizing water waste.
          </strong>

        </div>

        <div className="policy-source">

          <Database size={13} />

          <span>
            {policy
              ? "Policy loaded"
              : "Live policy awaiting analysis"}
          </span>

        </div>

      </div>

    </section>
  );
}