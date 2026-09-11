import { Link } from "react-router-dom";
import chandelierImg from "@/assets/chandelier-product.png";
import categoryTableLamp from "@/assets/category-table-lamp.jpg";
import categoryFloorLamp from "@/assets/category-floor-lamp.jpg";
import categoryFans from "@/assets/category-fans.jpg";
import editorialPendant from "@/assets/editorial-pendant-closeup.jpg";
import editorialOutdoorAsset from "@/assets/outdoor-porch-lanterns.jpeg.asset.json";
const editorialOutdoor = editorialOutdoorAsset.url;

const exploreProducts = [
  { name: "Ceiling", img: chandelierImg, path: "/coming-soon" },
  { name: "Pendants", img: editorialPendant, path: "/coming-soon" },
  { name: "Table", img: categoryTableLamp, path: "/coming-soon" },
  { name: "Floor", img: categoryFloorLamp, path: "/coming-soon" },
  { name: "Outdoor", img: editorialOutdoor, path: "/coming-soon" },
  { name: "Fans", img: categoryFans, path: "/coming-soon" },
];

const ExploreOurProducts = () => (
  <section className="mx-auto max-w-6xl px-6 sm:px-10 pt-20 sm:pt-28 pb-20 sm:pb-28">
    <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light text-center mb-12 sm:mb-16">
      Explore Our Products
    </h2>
    <div className="grid grid-cols-3 md:grid-cols-6 gap-5 sm:gap-8">
      {exploreProducts.map((cat) => (
        <Link key={cat.name} to={cat.path} className="group text-center">
          <div className="aspect-square bg-secondary/30 overflow-hidden mb-3 sm:mb-4 rounded-lg">
            <img
              src={cat.img}
              alt={cat.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <span className="text-[13px] font-sans tracking-[0.04em] text-foreground/80 group-hover:text-foreground transition-colors">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  </section>
);

export default ExploreOurProducts;
