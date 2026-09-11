import type { MouseEvent } from "react";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

const openExternalMap = (event: MouseEvent<HTMLAnchorElement>, url: string) => {
  event.preventDefault();
  const mapWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (!mapWindow) {
    window.location.assign(url);
  }
};

interface Showroom {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email?: string;
  hours: string[];
  mapQuery: string;
}

const showrooms: Showroom[] = [
  {
    name: "Orem",
    address: "922 N 1430 W",
    city: "Orem",
    state: "UT",
    zip: "84057",
    phone: "801-225-4459",
    email: "chelsea@novalighting.com",
    hours: [
      "Mon–Fri: 9 AM – 5 PM",
      "Sat: Closed",
      "Sun: Closed",
    ],
    mapQuery: "922+N+1430+W,+Orem,+UT+84057",
  },
  {
    name: "Sandy",
    address: "8699 S Sandy Parkway",
    city: "Sandy",
    state: "UT",
    zip: "84070",
    phone: "801-562-8530",
    email: "katies@novalighting.com",
    hours: [
      "Mon–Fri: 9 AM – 5 PM",
      "Sat: Closed",
      "Sun: Closed",
    ],
    mapQuery: "8699+S+Sandy+Parkway,+Sandy,+UT+84070",
  },
  {
    name: "Heber City",
    address: "162 S Main St",
    city: "Heber City",
    state: "UT",
    zip: "84032",
    phone: "435-777-5949",
    hours: [
      "Mon–Fri: 9 AM – 5 PM",
      "Sat: Closed",
      "Sun: Closed",
    ],
    mapQuery: "162+S+Main+St,+Heber+City,+UT+84032",
  },
  {
    name: "Midvale",
    address: "7515 S State St",
    city: "Midvale",
    state: "UT",
    zip: "84047",
    phone: "801-566-1324",
    hours: [
      "Mon–Fri: 9 AM – 5 PM",
      "Sat: 10 AM – 5 PM",
      "Sun: Closed",
    ],
    mapQuery: "7515+S+State+St,+Midvale,+UT+84047",
  },
  {
    name: "Layton",
    address: "1565 W Hill Field Rd, #103",
    city: "Layton",
    state: "UT",
    zip: "84041",
    phone: "801-721-5959",
    hours: [
      "Mon–Fri: 9 AM – 5 PM",
      "Sat: Closed",
      "Sun: Closed",
    ],
    mapQuery: "1565+W+Hill+Field+Rd,+Layton,+UT+84041",
  },
  {
    name: "St. George",
    address: "3284 Deseret Dr Unit 17",
    city: "St. George",
    state: "UT",
    zip: "84790",
    phone: "801-823-9179",
    hours: [
      "Mon–Fri: 9 AM – 5 PM",
      "Sat: Closed",
      "Sun: Closed",
    ],
    mapQuery: "3284+Deseret+Dr+Unit+17,+St.+George,+UT+84790",
  },
];

const ShowroomsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
        <Breadcrumbs />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-10 md:pb-14">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-[-0.01em] leading-tight">
            Our Locations
          </h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Visit one of our six Utah showrooms to explore lighting in person, find inspiration, and get expert guidance for your space.
          </p>
        </div>
      </section>

      {/* Showroom Cards */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showrooms.map((showroom) => (
            <ShowroomCard key={showroom.name} showroom={showroom} />
          ))}
        </div>
      </section>
    </div>
  );
};

const ShowroomCard = ({ showroom }: { showroom: Showroom }) => {
  const fullAddress = `${showroom.address}, ${showroom.city}, ${showroom.state} ${showroom.zip}`;
  const query = encodeURIComponent(fullAddress);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return (
    <div className="bg-card border border-border/60 overflow-hidden hover:border-border transition-colors duration-300">
      {/* Embedded Map */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get directions to the ${showroom.name} location in Google Maps`}
        onClick={(event) => openExternalMap(event, mapsUrl)}
        className="block relative overflow-hidden group"
      >
        <iframe
          title={`${showroom.name} location map`}
          src={`https://www.google.com/maps?q=${query}&z=15&output=embed`}
          className="w-full h-[200px] border-0 pointer-events-none"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        <div className="absolute inset-0 bg-transparent group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ExternalLink className="h-3 w-3" />
            Open in Maps
          </span>
        </div>
      </a>

      {/* Details */}
      <div className="p-5 md:p-6 space-y-4">
        <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-bold tracking-[-0.01em]">
          {showroom.name}
        </h2>

        {/* Address */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Get directions to ${fullAddress} in Google Maps`}
          onClick={(event) => openExternalMap(event, mapsUrl)}
          className="flex items-start gap-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors group"
        >
          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
          <span className="group-hover:underline">{fullAddress}</span>
        </a>

        {/* Phone */}
        <a
          href={`tel:${showroom.phone}`}
          className="flex items-center gap-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors group"
        >
          <Phone className="h-4 w-4 shrink-0 text-accent" />
          <span className="group-hover:underline">{showroom.phone}</span>
        </a>

        {/* Hours */}
        <div className="flex items-start gap-2.5 text-sm text-foreground/70">
          <Clock className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
          <div className="space-y-0.5">
            {showroom.hours.map((h) => (
              <p key={h}>{h}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowroomsPage;
