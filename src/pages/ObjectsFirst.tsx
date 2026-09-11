import { Link } from "react-router-dom";
import categoryTableLamp from "@/assets/category-table-lamp.jpg";
import categoryFloorLamp from "@/assets/category-floor-lamp.jpg";
import categoryFans from "@/assets/category-fans.jpg";
import roomDining from "@/assets/room-dining.jpg";
import roomLiving from "@/assets/room-living.jpg";
import roomOutdoor from "@/assets/room-outdoor.jpg";

const categories = [
  { label: "shop new arrivals", href: "/ceiling-lighting/chandeliers", img: roomLiving },
  { label: "shop chandeliers", href: "/ceiling-lighting/chandeliers", img: roomDining },
  { label: "shop pendants", href: "/ceiling-lighting/pendants", img: categoryFloorLamp },
  { label: "shop table lamps", href: "/lamps/table-lamps", img: categoryTableLamp },
  { label: "shop outdoor", href: "/outdoor", img: roomOutdoor },
  { label: "shop fans", href: "/fans", img: categoryFans },
];

const ObjectsFirst = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Promo banner */}
      <section className="bg-nova-sand/60">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-6 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="font-serif text-3xl sm:text-4xl text-nova-garnet font-light italic leading-none">
            15% off <span className="not-italic font-normal">favorites event</span>
          </h2>
          <p className="font-sans text-sm text-foreground/80 tracking-wide">
            chandeliers, pendants, lamps &amp; more
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/ceiling-lighting/chandeliers"
              className="bg-background px-8 py-3 font-sans text-[11px] uppercase tracking-[0.25em] text-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
            >
              shop now
            </Link>

          </div>
        </div>
      </section>

      {/* Category row */}
      <section className="mx-auto max-w-[1600px] px-6 sm:px-10 pt-6 sm:pt-8 pb-16">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link key={cat.label} to={cat.href} className="group flex flex-col">
              <div className="aspect-square overflow-hidden bg-nova-sand">
                <img
                  src={cat.img}
                  alt={cat.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <span className="mt-4 text-center font-sans text-sm text-foreground underline underline-offset-4 decoration-foreground/60 group-hover:decoration-foreground transition-colors lowercase">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ObjectsFirst;
