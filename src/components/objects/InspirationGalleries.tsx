import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import roomKitchenAsset from "@/assets/gallery-kitchen.jpg.asset.json";
import roomDiningAsset from "@/assets/gallery-dining.jpg.asset.json";
import roomBedroomAsset from "@/assets/gallery-bedroom.jpg.asset.json";
import roomLivingAsset from "@/assets/gallery-living.jpg.asset.json";
import roomBathroomAsset from "@/assets/gallery-bathroom.jpg.asset.json";
import roomOutdoorAsset from "@/assets/gallery-outdoor.jpg.asset.json";

const galleries = [
  { name: "Kitchen Gallery", img: roomKitchenAsset.url, path: "/coming-soon" },
  { name: "Bathroom Gallery", img: roomBathroomAsset.url, path: "/coming-soon" },
  { name: "Dining Room Gallery", img: roomDiningAsset.url, path: "/coming-soon" },
  { name: "Living Room Gallery", img: roomLivingAsset.url, path: "/coming-soon" },
  { name: "Bedroom Gallery", img: roomBedroomAsset.url, path: "/coming-soon" },
  { name: "Outdoor Gallery", img: roomOutdoorAsset.url, path: "/coming-soon" },
];

const InspirationGalleries = () => (
  <section className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
    <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light text-center mb-12 sm:mb-16">
      Inspiration Galleries
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
      {galleries.map((room) => (
        <Link key={room.name} to={room.path} className="group">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <img
              src={room.img}
              alt={room.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
              <h3 className="font-serif text-base sm:text-lg text-primary-foreground font-light">
                {room.name}
              </h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
    <div className="text-center mt-8 sm:mt-10">
      <Link
        to="/coming-soon"
        className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground transition-colors"
      >
        View All Rooms <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  </section>
);

export default InspirationGalleries;
