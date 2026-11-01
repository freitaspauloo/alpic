import { Logo, CtaButtonLink } from "../ui";

export function Landing() {
  return (
    <main className="landing">
      <div className="landing-bg" aria-hidden="true" />
      <Logo />
      <div className="landing-copy">
        <h1>Can agents actually use your product?</h1>
        <p>Watch agents work through your app, inspect the evidence, know what to fix.</p>
        <CtaButtonLink to="/acme/experiments">Sign in</CtaButtonLink>
      </div>
    </main>
  );
}
