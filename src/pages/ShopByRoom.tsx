import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

import roomKitchen from "@/assets/room-kitchen.jpg";
import roomDining from "@/assets/room-dining.jpg";
import roomBedroom from "@/assets/room-bedroom.jpg";
import roomBathroom from "@/assets/room-bathroom.jpg";
import roomLiving from "@/assets/room-living.jpg";
import roomEntryway from "@/assets/room-entryway.jpg";
import roomOutdoor from "@/assets/room-outdoor.jpg";

interface RoomData {
  name: string;
  slug: string;
  descriptor: string;
  image: string;
  links: { label: string; path: string }[];
}

const rooms: RoomData[] = [
  {
    name: "Kitchen",
    slug: "kitchen",
    descriptor: "Lighting for cooking, prep, and gathering",
    image: roomKitchen,
    links: [
      { label: "Pendants", path: "/room/kitchen/pendants" },
      { label: "Island & Linear Lights", path: "/room/kitchen/island-linear" },
      { label: "Chandeliers", path: "/room/kitchen/chandeliers" },
      { label: "Ceiling Lights", path: "/room/kitchen/flush-mount" },
      { label: "Under Cabinet Lighting", path: "/room/kitchen/under-cabinet" },
    ],
  },
  {
    name: "Dining Room",
    slug: "dining-room",
    descriptor: "Focused lighting for dining tables",
    image: roomDining,
    links: [
      { label: "Chandeliers", path: "/room/dining-room/chandeliers" },
      { label: "Pendants", path: "/room/dining-room/pendants" },
      { label: "Island & Linear Lights", path: "/room/dining-room/island-linear" },
      { label: "Ceiling Lights", path: "/room/dining-room/flush-mount" },
    ],
  },
  {
    name: "Bedroom",
    slug: "bedroom",
    descriptor: "Comfortable and layered lighting for rest",
    image: roomBedroom,
    links: [
      { label: "Ceiling Lights", path: "/room/bedroom/ceiling" },
      { label: "Chandeliers", path: "/room/bedroom/chandeliers" },
      { label: "Table Lamps", path: "/room/bedroom/table-lamps" },
      { label: "Wall Sconces", path: "/room/bedroom/sconces" },
      { label: "Floor Lamps", path: "/room/bedroom/floor-lamps" },
    ],
  },
  {
    name: "Bathroom",
    slug: "bathroom",
    descriptor: "Lighting for mirrors and daily routines",
    image: roomBathroom,
    links: [
      { label: "Bathroom Vanity Lights", path: "/room/bathroom/bathroom-vanity" },
      { label: "Wall Sconces", path: "/room/bathroom/sconces" },
      { label: "Mirrors", path: "/room/bathroom/mirrors" },
    ],
  },
  {
    name: "Living Room",
    slug: "living-room",
    descriptor: "Layered lighting for relaxing and entertaining",
    image: roomLiving,
    links: [
      { label: "Chandeliers", path: "/room/living-room/chandeliers" },
      { label: "Ceiling Lights", path: "/room/living-room/ceiling" },
      { label: "Table Lamps", path: "/room/living-room/table-lamps" },
      { label: "Floor Lamps", path: "/room/living-room/floor-lamps" },
      { label: "Wall Sconces", path: "/room/living-room/sconces" },
    ],
  },
  {
    name: "Entryway",
    slug: "entry-foyer",
    descriptor: "First impression lighting for your home",
    image: roomEntryway,
    links: [
      { label: "Chandeliers", path: "/room/entry-foyer/chandeliers" },
      { label: "Pendants", path: "/room/entry-foyer/pendants" },
      { label: "Indoor Lanterns", path: "/room/entry-foyer/indoor-lanterns" },
      { label: "Ceiling Lights", path: "/room/entry-foyer/flush-mount" },
      { label: "Wall Sconces", path: "/room/entry-foyer/sconces" },
    ],
  },
  {
    name: "Outdoor",
    slug: "outdoor",
    descriptor: "Lighting for safety, security, and ambiance",
    image: roomOutdoor,
    links: [
      { label: "Wall Lights", path: "/room/outdoor/wall-lights" },
      { label: "Hanging Lanterns", path: "/room/outdoor/hanging-lanterns" },
      { label: "Outdoor Ceiling Mount", path: "/room/outdoor/outdoor-ceiling-mount" },
      { label: "Post Lights", path: "/room/outdoor/post-pier" },
      { label: "Landscape Lighting", path: "/room/outdoor/landscape" },
    ],
  },
];

const ShopByRoom = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
        <Breadcrumbs />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-10 md:pb-14">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-[-0.01em] leading-tight">
            Shop by Room
          </h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Find the perfect lighting for every space in your home. Select a room to explore curated fixture recommendations.
          </p>
        </div>
      </section>

      {/* Room Grid */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pb-16 md:pb-24">
        {/* Top row: 3 large cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-4 md:mb-5">
          {rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.slug} room={room} size="large" />
          ))}
        </div>
        {/* Bottom row: 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {rooms.slice(3).map((room) => (
            <RoomCard key={room.slug} room={room} size="standard" />
          ))}
        </div>
      </section>
    </div>
  );
};

const RoomCard = ({ room, size }: { room: RoomData; size: "large" | "standard" }) => {
  const imageHeight = size === "large" ? "h-[280px] md:h-[340px]" : "h-[240px] md:h-[280px]";

  return (
    <div className="group bg-card border border-border/60 overflow-hidden hover:border-border transition-colors duration-300">
      {/* Image */}
      <Link to={`/room/${room.slug}`} className="block relative overflow-hidden">
        <img
          src={room.image}
          alt={`${room.name} lighting`}
          className={`w-full ${imageHeight} object-cover transition-transform duration-700 group-hover:scale-[1.03]`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
          <h2 className="font-serif text-xl md:text-2xl text-background font-light tracking-[-0.01em]">
            {room.name}
          </h2>
          <p className="text-background/70 text-xs mt-1 tracking-[0.02em]">
            {room.descriptor}
          </p>
        </div>
      </Link>

      {/* Links */}
      <div className="px-5 md:px-6 py-4 md:py-5">
        <ul className="space-y-0.5">
          {room.links.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className="flex items-center justify-between py-1.5 text-[13px] text-foreground/65 hover:text-foreground transition-colors group/link"
              >
                <span className="tracking-[0.02em]">{link.label}</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to={`/room/${room.slug}`}
          className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-sans font-semibold tracking-[0.16em] uppercase text-foreground/45 hover:text-foreground transition-colors"
        >
          Shop All {room.name}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default ShopByRoom;
