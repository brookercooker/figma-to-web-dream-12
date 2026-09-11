import Breadcrumbs from "@/components/Breadcrumbs";
import RaceSecondTest from "@/components/objects/RaceSecondTest";

/**
 * /race-test-page — DB-backed static page that renders the "Race Second Test" object.
 */
export default function RaceTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
        <Breadcrumbs />
      </div>
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-8">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-[-0.01em] leading-tight">
          Race Test Page
        </h1>
      </section>
      <RaceSecondTest />
    </div>
  );
}
