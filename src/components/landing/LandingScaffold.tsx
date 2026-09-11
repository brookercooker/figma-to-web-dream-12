import constructionImage from "@/assets/landing-under-construction.jpg";

/**
 * Shared "under construction" scaffold used by:
 *  - Bespoke landing pages (e.g. `TestOfLandingRenamedPage`)
 *  - The default DB-backed renderer (`LandingPage.tsx`) for freshly-created
 *    landing pages that haven't been built yet.
 *
 * The header displays the landing page's Name (title-cased) with a hand-drawn
 * yellow paintbrush-stroke highlight behind it.
 */
export default function LandingScaffold({ name }: { name: string }) {
  const displayName = toTitleCase(name);
  return (
    <div className="min-h-[70vh] bg-cream text-ink">
      <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <HighlightedTitle text={displayName} />
        <p className="font-sans uppercase tracking-[0.24em] text-[11px] text-garnet mt-6 mb-8">
          Landing Page Under Construction
        </p>
        <img
          src={constructionImage}
          alt="Line-art illustration of an architect's easel with blueprints, a plumb bob, a T-square, and a distant crane"
          width={1024}
          height={1024}
          loading="lazy"
          className="w-full max-w-sm h-auto rounded-lg"
        />
      </div>
    </div>
  );
}

/**
 * Title with a rough, painterly yellow highlight stroke behind the text. The
 * highlight is drawn as an SVG so it has irregular, hand-brushed edges rather
 * than a flat rectangle.
 */
export function HighlightedTitle({ text }: { text: string }) {
  return (
    <h1 className="font-serif text-4xl md:text-5xl text-ink relative z-0 inline-block leading-tight">
      <span
        aria-hidden="true"
        className="absolute left-[-0.35em] right-[-0.35em] top-[-0.28em] bottom-[-0.1em] -z-10"
      
      >
        <svg
          viewBox="0 0 300 72"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Paint-roller swath: broad, flat top/bottom with soft irregular
              edges and lighter streaks along the roller's travel direction. */}
          <defs>
            <linearGradient id="rollerStreaks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5D948" stopOpacity="1" />
              <stop offset="18%" stopColor="#FCE97A" stopOpacity="0.85" />
              <stop offset="42%" stopColor="#F5D948" stopOpacity="1" />
              <stop offset="68%" stopColor="#FCE97A" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F0CE3A" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M2 6 C 60 2, 130 4, 200 3 C 240 2, 275 4, 298 5 L 296 66 C 250 69, 190 65, 130 68 C 80 70, 35 66, 4 69 Z"
            fill="#F4D64A"
          />
          <path
            d="M2 6 C 60 2, 130 4, 200 3 C 240 2, 275 4, 298 5 L 296 66 C 250 69, 190 65, 130 68 C 80 70, 35 66, 4 69 Z"
            fill="url(#rollerStreaks)"
          />
        </svg>

      </span>
      <span className="relative">{text}</span>
    </h1>
  );
}

function toTitleCase(input: string): string {
  const small = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of",
    "on", "or", "so", "the", "to", "up", "yet",
  ]);
  const words = input.trim().split(/\s+/);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (i !== 0 && i !== words.length - 1 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
