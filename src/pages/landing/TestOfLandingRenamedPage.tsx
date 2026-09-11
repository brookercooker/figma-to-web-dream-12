import LandingScaffold from "@/components/landing/LandingScaffold";

/**
 * Custom landing page for `/landing/test-of-landing-renamed`.
 * Registered in `customLandingPages.ts` so both the admin surface and the
 * public subdomain render this component instead of the DB scaffold.
 */
export default function TestOfLandingRenamedPage() {
  return <LandingScaffold name="test of landing renamed" />;
}
