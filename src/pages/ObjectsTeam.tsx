import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shuffle } from "lucide-react";
import { teamMembers } from "@/data/team";
import TeamPortrait from "@/components/TeamPortrait";

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ObjectsTeam = () => {
  const random = useMemo(() => shuffle(teamMembers).slice(0, 4), []);

  return (
    <div className="container mx-auto px-4 py-16">
      <p className="font-serif text-2xl text-ink text-center mb-8">
        Object: <span className="text-garnet">Meet the Team</span>
      </p>

      <section className="mx-auto max-w-6xl px-6 sm:px-10 pt-8 pb-16">
        <header className="mb-10 sm:mb-14 text-center">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-stone mb-3 flex items-center justify-center gap-2">
            <Shuffle className="h-3 w-3" />
            A Random Assortment
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-ink leading-[1.05]">
            Meet the Team
          </h2>
          <div className="mx-auto mt-5 h-px w-12 bg-brass/60" />
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8">
          {random.map((m) => (
            <div key={m.slug} className="text-center">
              <TeamPortrait member={m} />
              <p className="font-serif text-lg sm:text-xl text-ink mt-4 leading-tight">
                {m.name}
              </p>
              <p className="font-sans text-xs tracking-wide text-stone mt-1">
                {m.role}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/objects-team-fullpage"
            className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.22em] uppercase text-ink border-b border-brass/60 pb-1 hover:text-garnet transition-colors"
          >
            Meet the full team
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ObjectsTeam;
