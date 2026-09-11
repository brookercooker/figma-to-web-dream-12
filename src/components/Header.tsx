import { Search, MapPin, User, Heart, ShoppingBag, Menu, X, ChevronDown, ChevronUp, Flame } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { navItems, mobileNavItems } from "@/data/navigation";
import { useCart } from "@/contexts/CartContext";
import novaLogoHorizontal from "@/assets/nova-logo-horizontal.png";
import megaCeiling1 from "@/assets/mega-ceiling-1.jpg";
import megaCeiling2 from "@/assets/mega-ceiling-2.jpg";
import megaWall1 from "@/assets/mega-wall-1.jpg";
import megaWall2 from "@/assets/mega-wall-2.jpg";
import megaLamps1 from "@/assets/mega-lamps-1.jpg";
import megaLamps2 from "@/assets/mega-lamps-2.jpg";
import megaOutdoor1 from "@/assets/mega-outdoor-1.jpg";
import megaOutdoor2 from "@/assets/mega-outdoor-2.jpg";
import megaFans1 from "@/assets/mega-fans-1.jpg";
import megaFans2 from "@/assets/mega-fans-2.jpg";
import megaMore1 from "@/assets/mega-more-1.jpg";

// Every header link that isn't the logo or the real Locations page points here.
const CS = "/coming-soon";

const CartIcon = () => {
  const { count } = useCart();
  return (
    <Link to={CS} className="relative hover:text-foreground transition-colors" aria-label={`Cart (${count} items)`}>
      <ShoppingBag className="h-4 w-4 lg:h-[15px] lg:w-[15px]" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
};

interface MegaImageConfig {
  images: { src: string; label: string }[];
}

const megaImageConfigs: Record<string, MegaImageConfig> = {
  "Ceiling Lights": {
    images: [
      { src: megaCeiling1, label: "Chandeliers" },
      { src: megaCeiling2, label: "Pendants" },
    ],
  },
  "Wall & Bath": {
    images: [
      { src: megaWall1, label: "Bathroom Vanity Lights" },
      { src: megaWall2, label: "Wall Sconces" },
    ],
  },
  Lamps: {
    images: [
      { src: megaLamps1, label: "Table Lamps" },
      { src: megaLamps2, label: "Floor Lamps" },
    ],
  },
  Outdoor: {
    images: [
      { src: megaOutdoor1, label: "Wall Lights" },
      { src: megaOutdoor2, label: "Landscape" },
    ],
  },
  Fans: {
    images: [
      { src: megaFans1, label: "Indoor Ceiling Fans" },
      { src: megaFans2, label: "Outdoor Ceiling Fans" },
    ],
  },
  More: {
    images: [{ src: megaMore1, label: "Visit Our Showroom" }],
  },
};

const allMegaMenuImages = Object.values(megaImageConfigs).flatMap((c) => c.images.map((i) => i.src));
const preloadedImages: HTMLImageElement[] = allMegaMenuImages.map((src) => {
  const img = new Image();
  img.src = src;
  img.decoding = "async";
  return img;
});

const HOVER_OPEN_DELAY = 0;
const HOVER_CLOSE_DELAY = 150;
const ANIMATION_DURATION = 250;

const Header = () => {
  const { pathname } = useLocation();

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [visibleCategory, setVisibleCategory] = useState<string | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);

  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeItem = navItems.find((c) => c.name === visibleCategory);
  void preloadedImages;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      prevMousePos.current = { ...lastMousePos.current };
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (openCategory) {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      setIsAnimatingOut(false);
      setVisibleCategory(openCategory);
    } else if (visibleCategory) {
      setIsAnimatingOut(true);
      animationTimeoutRef.current = setTimeout(() => {
        setVisibleCategory(null);
        setIsAnimatingOut(false);
      }, ANIMATION_DURATION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCategory]);

  const isMovingTowardDropdown = useCallback(() => {
    if (!dropdownRef.current) return false;
    const rect = dropdownRef.current.getBoundingClientRect();
    const cur = lastMousePos.current;
    const prev = prevMousePos.current;
    const dy = cur.y - prev.y;
    return dy > 0 && cur.y < rect.bottom;
  }, []);

  const handleMouseEnter = (catName: string) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (openCategory === catName) return;
    if (openCategory) {
      if (isMovingTowardDropdown()) {
        hoverTimeoutRef.current = setTimeout(() => setOpenCategory(catName), HOVER_OPEN_DELAY);
        return;
      }
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => setOpenCategory(catName), 100);
      return;
    }
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setOpenCategory(catName), HOVER_OPEN_DELAY);
  };

  const handleMouseLeaveNav = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    leaveTimeoutRef.current = setTimeout(() => setOpenCategory(null), HOVER_CLOSE_DELAY);
  };

  const handleDropdownEnter = () => {
    if (leaveTimeoutRef.current) { clearTimeout(leaveTimeoutRef.current); leaveTimeoutRef.current = null; }
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
  };

  const handleDropdownLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => setOpenCategory(null), HOVER_CLOSE_DELAY);
  };

  const closeMenu = useCallback(() => setOpenCategory(null), []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeMenu]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const isActiveCategory = (itemPath: string) => itemPath !== "#" && pathname.startsWith(itemPath);

  const toggleMobileCat = (catName: string) => {
    setExpandedMobileCat(expandedMobileCat === catName ? null : catName);
  };

  const columnCount = activeItem ? Math.min(activeItem.columns.length, 4) : 3;

  return (
    <header className="sticky top-0 z-50 bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      {/* Main header row */}
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-8 py-2.5 lg:py-4">
          {/* Left: search + logo (desktop) */}
          <div className="flex flex-col items-start gap-5 w-auto lg:w-[380px]">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setMobileSearchOpen(true);
                  setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
                }}
                aria-label="Search"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <Link
                to={CS}
                className="hidden lg:flex items-center gap-2.5 border border-border rounded-full px-4 py-1.5 w-full max-w-[300px] group cursor-pointer hover:border-foreground/30 transition-colors"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors tracking-[0.04em]">
                  Search
                </span>
              </Link>
            </div>
            <Link to="/home" className="hidden lg:block shrink-0" aria-label="Nova Lighting home">
              <img src={novaLogoHorizontal} alt="Nova Lighting" className="h-auto w-[320px]" style={{ imageRendering: "auto" }} />
            </Link>
          </div>

          {/* Center: logo (mobile only) */}
          <Link to="/home" className="shrink-0 absolute left-1/2 -translate-x-1/2 lg:hidden" aria-label="Nova Lighting home">
            <img src={novaLogoHorizontal} alt="Nova Lighting" className="h-auto w-[130px] sm:w-[150px]" style={{ imageRendering: "auto" }} />
          </Link>

          {/* Right: utility icons */}
          <div className="flex items-center justify-end gap-4 lg:gap-5 w-auto lg:w-[280px] text-muted-foreground">
            <Link to="/locations" className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors text-xs tracking-[0.05em]">
              <MapPin className="h-3.5 w-3.5" />
              Locations
            </Link>
            <Link to={CS} className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors text-xs tracking-[0.05em]">
              <User className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link to={CS} className="relative hover:text-foreground transition-colors" aria-label="Wishlist">
              <Heart className="h-4 w-4 lg:h-[15px] lg:w-[15px]" />
            </Link>
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block border-b border-border/60 relative" ref={navRef}>
        <div
          className="mx-auto flex max-w-[1400px] items-center justify-center gap-10 xl:gap-14 px-8 h-11"
          onMouseLeave={handleMouseLeaveNav}
        >
          {navItems.map((item) => {
            const active = isActiveCategory(item.path);
            return (
              <div key={item.name} className="h-full flex items-center relative">
                {item.directLink ? (
                  <Link
                    to={CS}
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
                      setOpenCategory(null);
                    }}
                    className={`h-full flex items-center gap-1 text-[13px] font-sans font-bold tracking-[0.16em] transition-colors uppercase whitespace-nowrap ${
                      active ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                    } ${item.badge ? "text-accent" : ""}`}
                  >
                    {item.name}
                    {item.badge && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive ml-0.5 -mt-1" />
                    )}
                  </Link>
                ) : (
                  <button
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    className={`h-full flex items-center gap-1 text-[13px] font-sans font-bold tracking-[0.16em] transition-colors uppercase whitespace-nowrap relative ${
                      visibleCategory === item.name || active
                        ? "text-foreground"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.name}
                    {(visibleCategory === item.name || active) && (
                      <span className="absolute -bottom-px left-0 right-0 h-px bg-foreground transition-opacity duration-200" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
          <div className="h-full flex items-center pl-2">
            <Link
              to={CS}
              className="hot-deals-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-sans font-bold tracking-[0.18em] uppercase whitespace-nowrap text-foreground border border-foreground/80 rounded-full"
            >
              <Flame className="!h-3 !w-3" aria-hidden="true" />
              Shop Hot Deals
            </Link>
          </div>
        </div>

        {/* Mega dropdown */}
        {activeItem && activeItem.columns.length > 0 && (
          <div
            ref={dropdownRef}
            className={`absolute left-0 top-full w-full z-50 transition-all duration-250 ease-out ${
              isAnimatingOut ? "opacity-0 -translate-y-1 pointer-events-none" : "opacity-100 translate-y-0"
            }`}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            <div
              className={`fixed inset-0 top-0 -z-10 transition-colors duration-250 ${
                isAnimatingOut ? "bg-transparent" : "bg-foreground/5"
              }`}
              onClick={closeMenu}
            />
            <div className="bg-background border-t border-border/60 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)]">
              <div className="mx-auto max-w-[1400px] px-8 md:px-16 py-10">
                <div className="flex gap-12">
                  <div
                    className="grid flex-1 gap-12"
                    style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                  >
                    {activeItem.columns.map((col, i) => {
                      const isShopByType = col.heading === "Shop by Type";
                      const regularLinks = col.items.filter((l) => !l.highlight);
                      return (
                        <div key={col.heading || `col-${i}`} className="min-w-0">
                          {col.heading && (
                            <h3
                              className={`font-sans uppercase pb-2.5 mb-5 border-b border-foreground/10 ${
                                isShopByType
                                  ? "text-[11px] font-bold tracking-[0.14em] text-foreground/70"
                                  : "text-[10px] font-semibold tracking-[0.16em] text-foreground/40"
                              }`}
                            >
                              {col.heading}
                            </h3>
                          )}
                          <ul className="flex flex-col gap-0.5">
                            {regularLinks.map((link) => (
                              <li key={link.path}>
                                <Link
                                  to={CS}
                                  className={`transition-all duration-200 leading-8 tracking-[0.02em] hover:translate-x-1 ${
                                    isShopByType
                                      ? "text-[14px] text-foreground/80 font-medium hover:text-foreground"
                                      : "text-[13px] text-foreground/55 hover:text-foreground"
                                  }`}
                                  onClick={closeMenu}
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  {megaImageConfigs[activeItem.name] && (
                    <div key={activeItem.name} className="hidden xl:flex flex-col shrink-0">
                      <div className="flex gap-4">
                        {megaImageConfigs[activeItem.name].images.map((img, idx) => (
                          <Link
                            key={`${activeItem.name}-${idx}`}
                            to={CS}
                            onClick={closeMenu}
                            className="relative overflow-hidden rounded-sm group w-[220px]"
                          >
                            <img
                              src={img.src}
                              alt={img.label}
                              className="w-full h-[280px] object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent pt-20 pb-4 px-4">
                              <p className="text-[13px] font-medium text-background/95 tracking-[0.02em]">{img.label}</p>
                              <p className="text-[10px] text-background/60 mt-0.5 tracking-[0.08em] uppercase font-sans">
                                Shop Now →
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {(() => {
                        const shopAllLink = activeItem.columns
                          .flatMap((col) => col.items)
                          .find((link) => link.highlight);
                        return shopAllLink ? (
                          <Link
                            to={CS}
                            onClick={closeMenu}
                            className="mt-4 self-end text-[12px] font-semibold tracking-[0.1em] uppercase text-foreground/70 hover:text-foreground transition-colors"
                          >
                            → {shopAllLink.label}
                          </Link>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-[360px] bg-background overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <span className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Menu
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-foreground/60 hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="py-1">
              {mobileNavItems.map((cat) => (
                <div key={cat.name} className="border-b border-border/40">
                  <div className="flex items-center justify-between px-5">
                    {cat.items.length > 0 ? (
                      <button
                        onClick={() => toggleMobileCat(cat.name)}
                        className={`flex-1 text-left py-3.5 text-[13px] font-sans font-medium tracking-[0.14em] uppercase ${
                          cat.badge ? "text-destructive" : "text-foreground/80"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ) : (
                      <Link
                        to={CS}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex-1 py-3.5 text-[13px] font-sans font-medium tracking-[0.14em] uppercase ${
                          cat.badge ? "text-destructive" : "text-foreground/80"
                        }`}
                      >
                        {cat.name}
                      </Link>
                    )}
                    {cat.items.length > 0 && (
                      <button onClick={() => toggleMobileCat(cat.name)} className="p-2 text-muted-foreground" aria-label={`Expand ${cat.name}`}>
                        {expandedMobileCat === cat.name ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  {expandedMobileCat === cat.name && cat.items.length > 0 && (
                    <div className="px-5 pb-4">
                      {cat.items.map((item) => (
                        <Link
                          key={item.path}
                          to={CS}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1.5 text-[13px] text-foreground/65 hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="px-5 py-5 space-y-3.5 border-t border-border/40">
              <Link to="/locations" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors tracking-[0.02em]">
                <MapPin className="h-4 w-4" /> Locations
              </Link>
              <Link to={CS} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors tracking-[0.02em]">
                <User className="h-4 w-4" /> Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile search overlay */}
      <div
        className={`fixed inset-x-0 top-0 z-[110] lg:hidden transition-all duration-300 ease-out ${
          mobileSearchOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="bg-background border-b border-border/60 shadow-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to={CS}
              onClick={() => setMobileSearchOpen(false)}
              className="flex-1 flex items-center gap-2.5 border border-border rounded-full px-4 py-2"
            >
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-[14px] text-muted-foreground tracking-[0.01em]">
                Search products, rooms, brands…
              </span>
            </Link>
            <button aria-label="Close search" onClick={() => setMobileSearchOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="fixed inset-0 top-[56px] bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileSearchOpen(false)} />
      </div>
    </header>
  );
};

export default Header;
