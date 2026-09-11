import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import awardShowroomAsset from "@/assets/news2-arts_award.jpg.asset.json";
import crashersAsset from "@/assets/news2-crashers-kitchen.jpg.asset.json";
import paradeAsset from "@/assets/news2-parade.jpg.asset.json";
import stGeorgeAsset from "@/assets/news2-showroom.jpg.asset.json";

type EventItem = {
  id: string;
  title: string;
  kicker: string;
  subline: string;
  image: string;
  href: string;
  /** Click affordance shown at the bottom of the tile. */
  cta: string;
  external?: boolean;
  /** object-position tuning for the wide crop. */
  pos?: string;
};

const events: EventItem[] = [
  {
    id: "arts",
    title: "ARTS Award",
    kicker: "Showroom of the Year",
    subline: "The industry's highest honor.",
    image: awardShowroomAsset.url,
    href: "/about#arts-awards",
    cta: "Read more",
  },
  {
    id: "parade",
    title: "Showcase of Homes",
    kicker: "Park City",
    subline: "Aug 28 — Sept 7.",
    image: paradeAsset.url,
    href: "https://pcshowcaseofhomes.com/",
    cta: "Get tickets",
    external: true,
  },
  {
    id: "st-george",
    title: "St. George",
    kicker: "New Showroom",
    subline: "Now open in southern Utah.",
    image: stGeorgeAsset.url,
    href: "/locations",
    cta: "Visit now",
  },
  {
    id: "crashers",
    title: "HGTV Crashers",
    kicker: "On Screen",
    subline: "Our fixtures, all season long.",
    image: crashersAsset.url,
    pos: "50% 45%",
    href: "/inspiration-gallery#hgtv-crashers",
    cta: "See the projects",
  },
];


/** Fisher–Yates — a fresh order on every page load. */
function shuffle<T>(input: T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const Tile = ({ item, index }: { item: EventItem; index: number }) => {
  const inner = (
    <>
      <img
        src={item.image}
        alt={item.title}
        loading="lazy"
        style={{ objectPosition: item.pos ?? "center" }}
        className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
      />
      {/* Legibility scrim — lighter now that the tile carries less text. */}
      <div className="absolute inset-0 bg-gradient-to-t from-nova-ink/70 via-nova-ink/25 to-transparent" />
      <div className="absolute inset-0 bg-nova-ink/10 transition-opacity duration-700 group-hover:opacity-0" />

      <span className="absolute left-6 top-6 font-sans text-[11px] tracking-[0.3em] text-nova-garnet sm:left-10 sm:top-10">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="absolute inset-x-0 bottom-0 p-6 text-left sm:p-10">
        <span className="font-sans text-[10px] uppercase tracking-[0.32em] text-nova-brass">
          {item.kicker}
        </span>
        <h3 className="mt-2 font-serif text-3xl font-light leading-[1.1] text-nova-cream sm:text-[2.75rem]">
          {item.title}
        </h3>
        <span className="mt-4 block h-px w-10 bg-nova-brass/70 transition-all duration-700 group-hover:w-20" />
        <p className="mt-4 font-sans text-xs leading-relaxed text-nova-cream/75 sm:text-sm">
          {item.subline}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.28em] text-nova-cream/90">
          {item.cta}
          <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
            {item.external ? "↗" : "→"}
          </span>
        </span>

      </div>
    </>
  );

  const cls =
    "group relative block aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-nova-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nova-brass";

  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={item.href} className={cls}>
      {inner}
    </Link>
  );
};

/**
 * CurrentEvents — editorial masthead plus a rotating pair of full-bleed
 * event tiles. The order reshuffles on every page load, so all four
 * highlights surface over time.
 */
const CurrentEvents = () => {
  const rotated = useMemo(() => shuffle(events), []);
  /** Preview-only: show every highlight at once for review/editing. */
  const forcedAll =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("all");
  const [showAll, setShowAll] = useState(forcedAll);
  const canToggle = import.meta.env.DEV || forcedAll;

  const visible = showAll ? events : rotated.slice(0, 2);

  return (
    <section
      aria-label="Nova Lighting current events"
      className="w-full bg-nova-cream px-4 py-24 sm:px-6 sm:py-32"
    >
      <div className="flex flex-col gap-5 border-b border-nova-sand pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-[0.34em] text-nova-stone">
            Highlights
          </span>
          <h2 className="mt-3 font-serif text-4xl font-light leading-[1.05] text-nova-ink sm:text-6xl">
            Nova in the News
          </h2>
        </div>
        <p className="max-w-sm font-sans text-sm leading-relaxed text-nova-stone sm:text-right">
          A few things we're proud of this year — and where you can see them.
        </p>
      </div>

      {canToggle && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="border border-nova-sand px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.24em] text-nova-stone transition-colors hover:border-nova-brass hover:text-nova-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nova-brass"
          >
            {showAll ? "Show rotating pair" : `Show all ${events.length}`}
          </button>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-8 lg:grid-cols-2">
        {visible.map((item, i) => (
          <Tile key={item.id} item={item} index={i} />
        ))}
      </div>

    </section>
  );
};


export default CurrentEvents;
