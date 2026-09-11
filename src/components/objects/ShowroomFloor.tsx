import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import editorialOutdoorAsset from "@/assets/outdoor-porch-lanterns.jpeg.asset.json";
import chandelierImg from "@/assets/chandelier-product.png";
import categoryTableLamp from "@/assets/category-table-lamp.jpg";

const editorialOutdoor = editorialOutdoorAsset.url;

const newIntroductions = [
  { name: "Ceiling", img: chandelierImg, path: "/coming-soon" },
  { name: "Outdoor", img: editorialOutdoor, path: "/coming-soon" },
  { name: "Lamps", img: categoryTableLamp, path: "/coming-soon" },
];

const ShowroomFloor = () => {
  return (
    <section className="bg-secondary/20">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h3 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light mb-4">
              Fresh from the Showroom Floor
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-7 max-w-sm">
              Hand-selected by our design team — lighting Utah's homes for over 75 years — these just-arrived pieces reflect the trends shaping today's most beautiful homes.
            </p>
            <Link
              to="/coming-soon"
              className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.18em] uppercase text-foreground hover:text-accent transition-colors"
            >
              Shop Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {newIntroductions.map((item) => (
              <Link key={item.name} to={item.path} className="group text-center">
                <div className="aspect-[3/4] bg-background overflow-hidden mb-2.5 rounded-lg">
                  <img
                    src={item.img}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <span className="text-xs font-sans text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowroomFloor;
