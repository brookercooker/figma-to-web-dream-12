import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/** Human-readable labels for URL segments */
const segmentLabels: Record<string, string> = {
  "ceiling-lighting": "Ceiling Lights",
  "wall-lighting": "Wall & Bath",
  lamps: "Lamps",
  outdoor: "Outdoor",
  fans: "Fans",
  room: "Shop by Room",
  architectural: "Architectural Lighting",
  "home-decor": "Home & Decor",
  sale: "Sale",
  brands: "Brands",
  category: "Shop",
  showrooms: "Showrooms",
  "new-and-now": "New and Now",
  "inspiration-gallery": "Inspiration Gallery",
  "full-vendor-list": "Full Vendor List",
  // Subcategories
  chandeliers: "Chandeliers",
  pendants: "Pendants",
  "island-linear": "Island & Linear Lights",
  "flush-mount": "Flush Mount",
  "semi-flush-mount": "Semi-Flush Mount",
  "indoor-lanterns": "Indoor Lanterns",
  sconces: "Wall Sconces",
  "bathroom-vanity": "Bathroom Vanity Lights",
  "picture-lights": "Picture Lights",
  table: "Table Lamps",
  floor: "Floor Lamps",
  "desk-task": "Desk / Task Lamps",
  portable: "Portable Lamps",
  "wall-lights": "Wall Lights",
  "hanging-lanterns": "Hanging Lanterns",
  "outdoor-ceiling-mount": "Outdoor Ceiling Mount",
  "post-pier": "Post & Pier",
  landscape: "Landscape Lighting",
  ceiling: "Ceiling Fans",
  smart: "Smart Fans",
  recessed: "Recessed Lighting",
  "track-rail": "Track / Rail",
  "linear-strip": "Linear / Strip",
  "under-cabinet": "Under Cabinet",
  commercial: "Commercial",
  mirrors: "Mirrors",
  furniture: "Furniture",
  decor: "Decor",
  // Rooms
  kitchen: "Kitchen",
  "dining-room": "Dining Room",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  "living-room": "Living Room",
  "entry-foyer": "Entryway",
  office: "Office",
  // Misc
  "best-sellers": "Best Sellers",
  "new-arrivals": "New Arrivals",
  guide: "Lighting Guide",
  featured: "Featured",
};

function formatSegment(segment: string): string {
  return (
    segmentLabels[segment] ||
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

interface BreadcrumbsProps {
  /** Optional override for the last crumb label (e.g. product name) */
  currentLabel?: string;
}

const Breadcrumbs = ({ currentLabel }: BreadcrumbsProps) => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: i === segments.length - 1 && currentLabel ? currentLabel : formatSegment(seg),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 flex-wrap text-[12px] sm:text-[13px] tracking-[0.02em]">
        <li className="flex items-center">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
          >
            <Home className="h-3.5 w-3.5 fill-current" />
            <span className="ml-1">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 mx-1" />
            {crumb.isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
