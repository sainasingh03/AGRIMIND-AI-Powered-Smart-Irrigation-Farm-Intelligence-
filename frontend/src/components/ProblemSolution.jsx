import {
  CloudRain,
  Droplets,
  Leaf,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

export default function ProblemSolution() {
  return (
    <section className="problem-solution">
      <div>
        <span className="section-kicker">
          <span className="kicker-dot" />
          THE PROBLEM
        </span>

        <h2>
          Irrigation decisions
          <br />
          are often made too late.
        </h2>

        <p>
          Farmers can over-irrigate when rain is
          approaching or under-irrigate when crops
          are under heat and moisture stress.
          AGRIMIND turns environmental signals into
          an explainable irrigation decision.
        </p>
      </div>

      <div className="problem-solution-grid">
        <article>
          <CloudRain size={18} />

          <strong>
            Weather-aware
          </strong>

          <span>
            Uses current conditions and forecast
            precipitation probability.
          </span>
        </article>

        <article>
          <Droplets size={18} />

          <strong>
            Water-aware
          </strong>

          <span>
            Penalizes unnecessary irrigation and
            considers the target soil moisture.
          </span>
        </article>

        <article>
          <TrendingDown size={18} />

          <strong>
            Waste reduction
          </strong>

          <span>
            The decision engine compares multiple
            irrigation actions before selecting one.
          </span>
        </article>

        <article>
          <ShieldCheck size={18} />

          <strong>
            Explainable
          </strong>

          <span>
            State, action, reward and confidence
            are visible instead of hiding the logic.
          </span>
        </article>
      </div>
    </section>
  );
}