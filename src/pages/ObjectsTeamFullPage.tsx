import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { teamMembers, type TeamMember } from "@/data/team";
import TeamPortrait from "@/components/TeamPortrait";

type Category = {
  key: string;
  label: string;
  description: string;
  roles: string[];
  order?: string[];
};

const categories: Category[] = [
  {
    key: "lighting-consultants",
    label: "Lighting Consultants",
    description: "Personal guides through fixtures, finishes, and rooms.",
    roles: [
      "Principal Lighting Consultant",
      "Senior Lighting Consultant",
      "Lighting Consultant",
    ],
    order: [
      "tyson-laford",
      "nate-spanos",
      "jarin-broadbent",
      "melissa-mcdermott",
      "kirt-victor",
      "chase-houghton",
      "derek-nielsen",
      "molly-burns",
      "carson-bush",
      "rylan-peck",
      "alyssa-gathercole",
      "kamron-gurney",
      "mya-baca",
      "chelsea-freitas-oneil",
      "audrey-rickenbacker",
    ],
  },
  {
    key: "leadership",
    label: "Leadership",
    description: "The vision and stewardship behind Nova Lighting.",
    roles: [
      "Owner",
      "Chief Executive Officer",
      "Chief Operating Officer",
      "President",
      "Director",
      "Director of Operations",
      "Director of Sales",
      "Director of Marketing",
    ],
  },
  {
    key: "showroom-managers",
    label: "Showroom Managers",
    description: "Curators of each Nova location's atmosphere and floor.",
    roles: ["Showroom Manager", "Showroom Designer"],
  },

  {
    key: "operations-support",
    label: "Operations & Client Care",
    description:
      "The people who keep fixtures moving from mill to showroom — and clients cared for long after.",
    roles: [
      "Purchasing Manager",
      "Operations",
      "Warehouse Manager",
      "Customer Support",
      "Client Care",
      "Support Staff Manager",
      "Accounts Receivable",
    ],
  },
];

const membersByCategory = (cat: Category): TeamMember[] => {
  const filtered = teamMembers.filter((m) => cat.roles.includes(m.role));
  const rank = (m: TeamMember) => {
    if (cat.order) {
      const i = cat.order.indexOf(m.slug);
      if (i !== -1) return i;
      return cat.order.length + cat.roles.indexOf(m.role);
    }
    return cat.roles.indexOf(m.role);
  };
  return filtered.slice().sort((a, b) => rank(a) - rank(b));
};

const ObjectsTeamFullPage = () => {
  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-24 sm:pt-32 pb-16 text-center">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-stone mb-4">
          The People Behind Nova
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-ink leading-[1.05]">
          Meet the Full Team
        </h1>
        <div className="mx-auto mt-6 h-px w-12 bg-brass/60" />
        <p className="font-sans text-sm sm:text-base text-ink/70 leading-relaxed font-light mt-8 max-w-2xl mx-auto">
          Nova Lighting is a company of designers, consultants, and craftspeople —
          organized around the rooms our clients live in and the fixtures we love
          most.
        </p>
      </section>

      {/* Categories */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 pb-24 sm:pb-32 space-y-24 sm:space-y-32">
        {categories.map((cat) => {
          const members = membersByCategory(cat);
          return (
            <section key={cat.key}>
              <header className="mb-10 sm:mb-14 max-w-2xl">
                <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-garnet mb-3">
                  {cat.label}
                </p>
                <div className="h-px w-12 bg-brass/60 mb-5" />
                <p className="font-serif text-xl sm:text-2xl text-ink/80 font-light leading-snug italic">
                  {cat.description}
                </p>
              </header>

              {members.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10">
                  {members.map((m) => (
                    <div key={m.slug} className="text-center">
                      <TeamPortrait member={m} />
                      <p className="font-serif text-lg sm:text-xl text-ink mt-4 leading-tight">
                        {m.name}
                      </p>
                      <p className="font-sans text-xs tracking-wide text-stone mt-1">
                        {m.role}
                      </p>
                      {m.location && (
                        <p className="font-sans text-[11px] tracking-[0.18em] uppercase text-stone/70 mt-1">
                          {m.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-sand/70 rounded-lg py-12 px-6 text-center">
                  <p className="font-sans text-sm text-stone italic">
                    Introductions coming soon.
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Closing CTA */}
      <section className="border-t border-sand/70">
        <div className="mx-auto max-w-4xl px-6 sm:px-10 py-20 sm:py-28 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-light text-ink leading-tight">
            Visit a Nova showroom.
          </h2>
          <p className="font-sans text-sm text-ink/70 leading-relaxed font-light mt-4 max-w-lg mx-auto">
            Meet the team in person and see how our fixtures live under real light.
          </p>
          <div className="mt-8">
            <Link
              to="/locations"
              className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.22em] uppercase text-ink border-b border-brass/60 pb-1 hover:text-garnet transition-colors"
            >
              Find a location
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ObjectsTeamFullPage;
