import novaLogoHorizontal from "@/assets/nova-logo-horizontal.png";

/**
 * Minimal chrome used on landing pages ONLY.
 * Renders just the Nova Lighting logo (linking to the homepage) and a
 * copyright-only footer. No search, nav, cart, or mega-menu.
 *
 * Static pages continue to use the full <Header/> and <Footer/>.
 */

type Props = { homeHref?: string };

export function LandingHeader({ homeHref = "/home" }: Props) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 flex items-center justify-center">
        <a href={homeHref} aria-label="Nova Lighting home" className="shrink-0">
          <img
            src={novaLogoHorizontal}
            alt="Nova Lighting"
            className="h-auto w-[220px] sm:w-[280px]"
            style={{ imageRendering: "auto" }}
          />
        </a>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nova Lighting Co. All rights reserved.
      </div>
    </footer>
  );
}
