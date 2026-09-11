import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const showrooms = [
  { name: "Orem", detail: "922 N 1430 W" },
  { name: "Sandy", detail: "8699 S Sandy Parkway" },
  { name: "Heber City", detail: "162 S Main St" },
  { name: "Midvale", detail: "7515 S State St" },
  { name: "Layton", detail: "1565 W Hill Field Rd" },
  { name: "St. George", detail: "3284 Deseret Dr Unit 17" },
];

/**
 * Locations Teaser — six showrooms, stated plainly.
 */
const LocationsTeaser = () => (
  <section className="border-y border-border/50 bg-secondary/15">
    <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-start">
        <div className="md:col-span-4">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
            Across Utah
          </p>
          <h2 className="font-serif text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-light text-foreground leading-tight mb-4">
            Six showrooms,<br />
            <em className="italic">one standard.</em>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-7 max-w-sm">
            Every location is staffed by designers who know the fixtures in person — and the homes they belong in.
          </p>
          <Link
            to="/locations"
            className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.18em] uppercase text-foreground hover:text-accent transition-colors"
          >
            Visit a Showroom <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="md:col-span-8 md:pl-8 md:border-l md:border-border/60">
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-7">
            {showrooms.map((s, i) => (
              <li key={s.name}>
                <span className="block font-serif text-[11px] text-accent mb-1.5">
                  0{i + 1}
                </span>
                <Link
                  to="/locations"
                  className="block font-serif text-lg sm:text-xl font-light text-foreground hover:text-accent transition-colors"
                >
                  {s.name}
                </Link>
                <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                  {s.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default LocationsTeaser;
