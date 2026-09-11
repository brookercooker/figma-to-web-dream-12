import { Link } from "react-router-dom";
import ceilingAsset from "@/assets/cat-ceiling-3.jpg.asset.json";
import wallAsset from "@/assets/cat-wall_sconces.jpg.asset.json";
import pendantsAsset from "@/assets/cat-pendants.jpg.asset.json";
import outdoorAsset from "@/assets/cat-outdoor.jpg.asset.json";
import fansAsset from "@/assets/cat-Fans.jpg.asset.json";

const categories = [
  // `pos` tunes the object-position so the fixture stays in frame in the square crop.
  { name: "Ceiling", img: ceilingAsset.url, path: "/coming-soon", pos: "50% 22%" },
  { name: "Pendants", img: pendantsAsset.url, path: "/coming-soon" },
  { name: "Wall & Sconces", img: wallAsset.url, path: "/coming-soon" },
  { name: "Outdoor", img: outdoorAsset.url, path: "/coming-soon" },
  { name: "Fans", img: fansAsset.url, path: "/coming-soon", pos: "50% 20%" },
];

/**
 * Categories — a full-width row of five square category tiles with
 * left-aligned labels beneath each image. Drop into any page.
 */
const Categories = () => (
  <section aria-label="Shop by category" className="w-full bg-nova-sand/40 px-4 sm:px-6 py-10 sm:py-14">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
      {categories.map((cat) => (
        <Link key={cat.name} to={cat.path} className="group block">
          <div className="aspect-square overflow-hidden rounded-lg bg-sand/40">
            <img
              src={cat.img}
              alt={cat.name}
              loading="lazy"
              style={{ objectPosition: cat.pos ?? "center" }}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          </div>
          <span className="mt-3 block font-sans text-[15px] font-semibold text-ink group-hover:text-brass transition-colors">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  </section>
);

export default Categories;
