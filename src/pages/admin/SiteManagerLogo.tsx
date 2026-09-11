/**
 * Site Manager brand mark.
 * - Custom SVG icon: a stylized "site map" — a bento of panels representing
 *   pages/objects/images, warmed with the Nova brass palette and anchored by
 *   a single garnet accent (the "managed" node).
 * - Wordmark: "Site" in Cormorant Garamond italic + "Manager" in tracked
 *   uppercase Figtree, matching the Nova visual identity.
 */
export default function SiteManagerLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 32 32"
        width="30"
        height="30"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Warm backdrop tile */}
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          rx="5"
          fill="hsl(var(--glow, 38 50% 80%))"
        />
        {/* Panel: hero (top-left, large) — brass */}
        <rect
          x="5"
          y="5"
          width="13"
          height="13"
          rx="1.75"
          fill="hsl(var(--brass, 38 31% 72%))"
        />
        {/* Panel: aside (top-right) — cream */}
        <rect
          x="19.5"
          y="5"
          width="7.5"
          height="6"
          rx="1.5"
          fill="hsl(var(--cream, 0 0% 100%))"
        />
        {/* Panel: aside (mid-right) — ink accent */}
        <rect
          x="19.5"
          y="12.5"
          width="7.5"
          height="5.5"
          rx="1.5"
          fill="hsl(var(--foreground))"
        />
        {/* Panel: footer strip — cream */}
        <rect
          x="5"
          y="19.5"
          width="17"
          height="7.5"
          rx="1.75"
          fill="hsl(var(--cream, 0 0% 100%))"
        />
        {/* Garnet accent node — the "managed" pin */}
        <circle
          cx="24.75"
          cy="23.25"
          r="2.75"
          fill="hsl(var(--garnet, 3 44% 36%))"
        />
        {/* Ink frame */}
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          rx="5"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.4"
        />
      </svg>
      <span className="leading-none flex flex-col items-stretch">
        <span
          className="block text-[26px] italic text-foreground leading-[0.9]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          Site
        </span>
        <span
          className="block uppercase text-foreground/75 mt-[3px]"
          style={{
            fontFamily: "'Figtree', sans-serif",
            fontWeight: 600,
            // Tracked so "Manager" spans the same width as the italic "Site" above
            fontSize: "8.5px",
            letterSpacing: "0.42em",
            // trailing letter-spacing pushes the box wider than the glyphs; pull it back
            marginRight: "-0.42em",
            textAlign: "justify",
          }}
        >
          Manager
        </span>
      </span>

    </div>
  );
}
