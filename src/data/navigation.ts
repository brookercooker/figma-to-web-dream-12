export interface MegaMenuColumn {
  heading: string;
  items: { label: string; path: string; highlight?: boolean }[];
}

export interface NavItem {
  name: string;
  path: string;
  columns: MegaMenuColumn[];
  /** If true, this is a direct link with no mega menu */
  directLink?: boolean;
  /** If true, show a highlight badge (e.g. Sale) */
  badge?: boolean;
}

export const navItems: NavItem[] = [
  {
    name: "Ceiling Lights",
    path: "/coming-soon",
    columns: [
      {
        heading: "By Type",
        items: [
          { label: "Chandeliers", path: "/coming-soon" },
          { label: "Pendants", path: "/coming-soon" },
          { label: "Island & Linear Lights", path: "/coming-soon" },
          { label: "Flush Mount", path: "/coming-soon" },
          { label: "Semi-Flush Mount", path: "/coming-soon" },
          { label: "Indoor Lanterns", path: "/coming-soon" },
          { label: "Shop All Ceiling Lights", path: "/coming-soon", highlight: true },
        ],
      },
      {
        heading: "Applications",
        items: [
          { label: "Kitchen Island Lighting", path: "/coming-soon" },
          { label: "Dining Table Lighting", path: "/coming-soon" },
          { label: "Entryway Lighting", path: "/coming-soon" },
          { label: "High Ceiling Lighting", path: "/coming-soon" },
        ],
      },
      {
        heading: "By Room",
        items: [
          { label: "Kitchen", path: "/coming-soon" },
          { label: "Dining Room", path: "/coming-soon" },
          { label: "Bedroom", path: "/coming-soon" },
          { label: "Entryway", path: "/coming-soon" },
        ],
      },
    ],
  },
  {
    name: "Wall & Bath",
    path: "/coming-soon",
    columns: [
      {
        heading: "By Type",
        items: [
          { label: "Wall Sconces", path: "/coming-soon" },
          { label: "Bathroom Vanity Lights", path: "/coming-soon" },
          { label: "Picture Lights", path: "/coming-soon" },
          { label: "Shop All Wall & Bath", path: "/coming-soon", highlight: true },
        ],
      },
      {
        heading: "By Room",
        items: [
          { label: "Bathroom", path: "/coming-soon" },
          { label: "Bedroom", path: "/coming-soon" },
          { label: "Hallway", path: "/coming-soon" },
          { label: "Living Room", path: "/coming-soon" },
        ],
      },
      {
        heading: "Featured",
        items: [
          { label: "Best Sellers", path: "/coming-soon" },
          { label: "New Arrivals", path: "/coming-soon" },
        ],
      },
    ],
  },
  {
    name: "Lamps",
    path: "/coming-soon",
    columns: [
      {
        heading: "By Type",
        items: [
          { label: "Table Lamps", path: "/coming-soon" },
          { label: "Floor Lamps", path: "/coming-soon" },
          { label: "Desk / Task Lamps", path: "/coming-soon" },
          { label: "Portable Lamps", path: "/coming-soon" },
          { label: "Shop All Lamps", path: "/coming-soon", highlight: true },
        ],
      },
      {
        heading: "By Room",
        items: [
          { label: "Living Room", path: "/coming-soon" },
          { label: "Bedroom", path: "/coming-soon" },
          { label: "Office", path: "/coming-soon" },
        ],
      },
    ],
  },
  {
    name: "Outdoor",
    path: "/coming-soon",
    columns: [
      {
        heading: "By Type",
        items: [
          { label: "Wall Lights", path: "/coming-soon" },
          { label: "Hanging Lanterns", path: "/coming-soon" },
          { label: "Outdoor Ceiling Mount", path: "/coming-soon" },
          { label: "Post & Pier", path: "/coming-soon" },
          { label: "Landscape Lighting", path: "/coming-soon" },
          { label: "Shop All Outdoor", path: "/coming-soon", highlight: true },
        ],
      },
      {
        heading: "Applications",
        items: [
          { label: "Entry Lighting", path: "/coming-soon" },
          { label: "Patio / Deck", path: "/coming-soon" },
          { label: "Driveway", path: "/coming-soon" },
          { label: "Security Lighting", path: "/coming-soon" },
        ],
      },
    ],
  },
  {
    name: "Fans",
    path: "/coming-soon",
    columns: [
      {
        heading: "By Type",
        items: [
          { label: "Indoor Ceiling Fans", path: "/coming-soon" },
          { label: "Outdoor Ceiling Fans", path: "/coming-soon" },
          { label: "Light Kits & Parts", path: "/coming-soon" },
          { label: "Ceiling Fan Accessories", path: "/coming-soon" },
          { label: "Wall Fans", path: "/coming-soon" },
          { label: "All Ceiling Fans", path: "/coming-soon", highlight: true },
        ],
      },
    ],
  },
  {
    name: "More",
    path: "#",
    columns: [
      {
        heading: "By Room",
        items: [
          { label: "Kitchen", path: "/coming-soon" },
          { label: "Dining Room", path: "/coming-soon" },
          { label: "Bedroom", path: "/coming-soon" },
          { label: "Bathroom", path: "/coming-soon" },
          { label: "Living Room", path: "/coming-soon" },
          { label: "Entryway", path: "/coming-soon" },
          { label: "Shop All Rooms", path: "/coming-soon", highlight: true },
        ],
      },
      {
        heading: "Brands",
        items: [
          { label: "Featured Brands", path: "/coming-soon", highlight: true },
          { label: "Shop All Brands", path: "/coming-soon" },
        ],
      },
      {
        heading: "Architectural",
        items: [
          { label: "Recessed Lighting", path: "/coming-soon" },
          { label: "Track / Rail", path: "/coming-soon" },
          { label: "Linear / Strip", path: "/coming-soon" },
          { label: "Under Cabinet", path: "/coming-soon" },
        ],
      },
      {
        heading: "Explore",
        items: [
          { label: "Shop by Style", path: "/coming-soon" },
          { label: "Shop by Finish", path: "/coming-soon" },
          { label: "Collections", path: "/coming-soon" },
          { label: "Commercial / Utility", path: "/coming-soon" },
        ],
      },
    ],
  },
  {
    name: "Sale",
    path: "/coming-soon",
    badge: true,
    directLink: true,
    columns: [],
  },
];

/** Mobile nav uses a simplified flat list per category */
export interface MobileNavItem {
  name: string;
  path: string;
  badge?: boolean;
  items: { label: string; path: string }[];
}

export const mobileNavItems: MobileNavItem[] = [
  {
    name: "Ceiling Lights",
    path: "/coming-soon",
    items: [
      { label: "Shop All Ceiling Lights", path: "/coming-soon" },
      { label: "Chandeliers", path: "/coming-soon" },
      { label: "Pendants", path: "/coming-soon" },
      { label: "Island & Linear Lights", path: "/coming-soon" },
      { label: "Flush Mount", path: "/coming-soon" },
      { label: "Indoor Lanterns", path: "/coming-soon" },
    ],
  },
  {
    name: "Wall & Bath",
    path: "/coming-soon",
    items: [
      { label: "Shop All Wall & Bath", path: "/coming-soon" },
      { label: "Wall Sconces", path: "/coming-soon" },
      { label: "Bathroom Vanity Lights", path: "/coming-soon" },
      { label: "Picture Lights", path: "/coming-soon" },
    ],
  },
  {
    name: "Lamps",
    path: "/coming-soon",
    items: [
      { label: "Shop All Lamps", path: "/coming-soon" },
      { label: "Table Lamps", path: "/coming-soon" },
      { label: "Floor Lamps", path: "/coming-soon" },
      { label: "Desk / Task Lamps", path: "/coming-soon" },
      { label: "Portable Lamps", path: "/coming-soon" },
    ],
  },
  {
    name: "Outdoor",
    path: "/coming-soon",
    items: [
      { label: "Shop All Outdoor", path: "/coming-soon" },
      { label: "Wall Lights", path: "/coming-soon" },
      { label: "Hanging Lanterns", path: "/coming-soon" },
      { label: "Outdoor Ceiling Mount", path: "/coming-soon" },
      { label: "Post & Pier", path: "/coming-soon" },
      { label: "Landscape Lighting", path: "/coming-soon" },
    ],
  },
  {
    name: "Fans",
    path: "/coming-soon",
    items: [
      { label: "Shop All Fans", path: "/coming-soon" },
      { label: "Indoor Ceiling Fans", path: "/coming-soon" },
      { label: "Outdoor Ceiling Fans", path: "/coming-soon" },
      { label: "Light Kits & Parts", path: "/coming-soon" },
      { label: "Ceiling Fan Accessories", path: "/coming-soon" },
      { label: "Wall Fans", path: "/coming-soon" },
    ],
  },
  {
    name: "Shop by Room",
    path: "/coming-soon",
    items: [
      { label: "Shop All Rooms", path: "/coming-soon" },
      { label: "Kitchen", path: "/coming-soon" },
      { label: "Dining Room", path: "/coming-soon" },
      { label: "Bedroom", path: "/coming-soon" },
      { label: "Bathroom", path: "/coming-soon" },
      { label: "Living Room", path: "/coming-soon" },
      { label: "Entryway", path: "/coming-soon" },
    ],
  },
  {
    name: "More",
    path: "#",
    items: [
      { label: "Shop All Brands", path: "/coming-soon" },
      { label: "Recessed Lighting", path: "/coming-soon" },
      { label: "Track / Rail", path: "/coming-soon" },
      { label: "Collections", path: "/coming-soon" },
      { label: "Commercial / Utility", path: "/coming-soon" },
    ],
  },
  {
    name: "Sale",
    path: "/coming-soon",
    badge: true,
    items: [
      { label: "Ceiling Lights on Sale", path: "/coming-soon" },
      { label: "Wall Lights on Sale", path: "/coming-soon" },
      { label: "Lamps on Sale", path: "/coming-soon" },
      { label: "Outdoor on Sale", path: "/coming-soon" },
    ],
  },
];
