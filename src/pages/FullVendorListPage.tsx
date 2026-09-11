import { useMemo } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import { vendorNames } from "@/data/vendors";

const FullVendorListPage = () => {
  const grouped = useMemo(() => {
    const sorted = [...vendorNames].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    const map = new Map<string, string[]>();
    for (const name of sorted) {
      const letter = name[0].toUpperCase();
      const bucket = map.get(letter);
      if (bucket) bucket.push(name);
      else map.set(letter, [name]);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="bg-background">
      <Breadcrumbs />

      <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-6 pb-16 sm:pb-24">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
          Proudly Representing
        </p>
        <h1 className="font-serif text-[2rem] sm:text-[2.75rem] text-foreground font-light">
          Full Vendor List
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          More than 200 lines are carried across our showrooms, from heritage houses to
          modern studios. Our roster shifts with the seasons — a selection is shown here.
          If you don't see a line, ask us.
        </p>

        <div className="mt-12 space-y-10">
          {grouped.map(([letter, names]) => (
            <div key={letter} className="border-t border-border/60 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-[4rem_1fr] gap-4">
                <span className="font-serif text-2xl text-muted-foreground/70 font-light">
                  {letter}
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-8">
                  {names.map((name) => (
                    <li
                      key={name}
                      className="font-serif text-lg text-foreground/85 font-semibold"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-border/60 pt-10">
          <p className="text-sm text-muted-foreground mb-5 max-w-lg">
            Looking for a specific line, or something you don't see here? Our consultants
            can source it.
          </p>
          <Link
            to="/contact"
            className="inline-block border border-border text-foreground px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:border-foreground/40 transition-colors"
          >
            Talk to a Consultant
          </Link>
        </div>
      </section>
    </div>
  );
};

export default FullVendorListPage;
