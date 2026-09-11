import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { teamMembers } from "@/data/team";
import TeamPortrait from "@/components/TeamPortrait";

const FEATURED_SLUGS = [
  "tyson-laford",
  "brad-johnson",
  "jarin-broadbent",
  "melissa-mcdermott",
  "carson-bush",
];

const TeamPreview = () => {
  const preview = FEATURED_SLUGS
    .map((slug) => teamMembers.find((m) => m.slug === slug))
    .filter((m): m is (typeof teamMembers)[number] => Boolean(m));

  return (
    <section className="mx-auto max-w-6xl px-6 sm:px-10 pt-20 sm:pt-28 pb-20 sm:pb-28">
      <header className="mb-10 sm:mb-14 text-center">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-nova-stone mb-3">
          The People Behind Nova
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-nova-ink leading-[1.05]">
          Meet the Team
        </h2>
        <div className="mx-auto mt-5 h-px w-12 bg-nova-brass/60" />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 sm:gap-8">
        {preview.map((m) => (
          <div key={m.slug} className="text-center">
            <TeamPortrait member={m} />
            <p className="font-serif text-lg sm:text-xl text-nova-ink mt-4 leading-tight">
              {m.name}
            </p>
            <p className="font-sans text-xs tracking-wide text-nova-stone mt-1">
              {m.role}
            </p>
          </div>
        ))}
      </div>


      <div className="mt-12 text-center">
        <Link
          to="/team"
          className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.22em] uppercase text-nova-ink border-b border-nova-brass/60 pb-1 hover:text-nova-garnet transition-colors"
        >
          Meet the full team
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
};

export default TeamPreview;
