import { plans } from "../data";

export function PlanGrid({ current }: { current?: string }) {
  return (
    <div className="plan-grid">
      {plans.map((plan) => (
        <article key={plan.id} className={plan.featured ? "plan featured" : "plan"}>
          {plan.featured ? <span className="plan-flag">Most teams</span> : <span className="plan-flag ghost"> </span>}
          <h2>{plan.name}</h2>
          <p className="plan-price">{plan.price} <small>{plan.cadence}</small></p>
          <p className="plan-who">{plan.who}</p>
          <button type="button" className={plan.id === current ? "outline-button" : "pink-button"} disabled={plan.id === current}>
            {plan.id === current ? "Current plan" : plan.cta}
          </button>
          <ul>
            {plan.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
