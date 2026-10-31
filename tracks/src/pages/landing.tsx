import { Link } from "react-router-dom";
import { Logo } from "../ui";

export function Landing() {
  return (
    <main className="landing">
      <div className="landing-bg" aria-hidden="true" />
      <Logo />
      <div className="landing-copy">
        <h1>Can agents actually use your product?</h1>
        <p>Watch agents work through your app, inspect the evidence, know what to fix.</p>
        <Link className="btn btn-cta" to="/acme/experiments">
          Sign in
        </Link>
      </div>
    </main>
  );
}
