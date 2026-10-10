import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Droplets,
  Gauge,
  GitBranch,
} from "lucide-react";

import { useFarm } from "../context/FarmContext";

function pretty(value) {
  if (!value) return "Pending";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DecisionTimeline() {
  const {
    sensors,
    currentState,
    recommendation,
    recommendedAction,
    waterAmount,
    policyConfidence,
  } = useFarm();

  const action =
    recommendedAction ||
    recommendation?.action ||
    "NO_IRRIGATION";

  const water = Number(waterAmount) || 0;

  const confidence =
    Math.min(
      100,
      Math.max(
        0,
        Number(policyConfidence) || 0
      )
    );

  const state =
    currentState?.id ||
    currentState?.state ||
    "STATE_PENDING";

  const timeline = [
    {
      number: "01",
      icon: Activity,
      label: "OBSERVE",
      title: "Environment observed",
      description:
        "AGRIMIND reads the current field signals before selecting an irrigation action.",
      value:
        `${Number(sensors?.soilMoisture || 0)}% soil moisture · ` +
        `${Number(sensors?.temperature || 0)}°C · ` +
        `${Number(sensors?.rainProbability || 0)}% rain`,
    },
    {
      number: "02",
      icon: BrainCircuit,
      label: "STATE",
      title: "State classified",
      description:
        "Continuous sensor values are converted into a discrete decision state.",
      value: pretty(state),
    },
    {
      number: "03",
      icon: GitBranch,
      label: "POLICY",
      title: "Actions evaluated",
      description:
        "The decision engine compares the available irrigation actions against the current state.",
      value:
        "No irrigation · Low · Medium · High",
    },
    {
      number: "04",
      icon: CheckCircle2,
      label: "DECISION",
      title: "Action selected",
      description:
        "The learned policy selects the action with the strongest expected outcome.",
      value: pretty(action),
    },
  ];

  return (
    <section className="timeline-card">
      <div className="timeline-header">
        <div>
          <span className="section-eyebrow">
            <span />
            DECISION MEMORY
          </span>

          <h2>
            How AGRIMIND
            <br />
            reached the decision.
          </h2>
        </div>

        <Gauge size={22} />
      </div>

      <div className="timeline-list">
        {timeline.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className="timeline-item"
              key={item.number}
            >
              <div className="timeline-number">
                {item.number}
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "7px",
                    color: "#718c78",
                    fontFamily:
                      '"Space Grotesk", monospace',
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                  }}
                >
                  <Icon size={13} />

                  {item.label}
                </div>

                <h3>{item.title}</h3>

                <p>
                  {item.description}
                </p>

                <div
                  style={{
                    marginTop: "12px",
                    color: "#315b47",
                    fontFamily:
                      '"Space Grotesk", monospace',
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {item.value}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "10px",
          marginTop: "24px",
          paddingTop: "22px",
          borderTop:
            "1px solid rgba(16,38,29,.09)",
        }}
      >
        <div className="policy-cell">
          <span>SELECTED ACTION</span>
          <strong>
            {pretty(action)}
          </strong>
        </div>

        <div className="policy-cell">
          <span>ESTIMATED WATER</span>
          <strong>
            <Droplets
              size={13}
              style={{
                verticalAlign: "middle",
                marginRight: 4,
              }}
            />
            {water} L
          </strong>
        </div>

        <div className="policy-cell">
          <span>POLICY CONFIDENCE</span>
          <strong>
            {confidence}%
          </strong>
        </div>
      </div>
    </section>
  );
}