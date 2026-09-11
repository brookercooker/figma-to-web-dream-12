import { useEffect } from "react";

const BLOG_URL =
  "https://hansenlightingblog.com/home-lighting-and-interior-design-101-top-interior-design-tips-from-the-lighting-experts/";

/** Every catalog/brand/product route currently redirected to this page. */
export const PENDING_SUPERNOVA_ROUTES: { group: string; routes: string[] }[] = [
  {
    group: "Brand pages",
    routes: ["/brands"],
  },
  {
    group: "Category pages",
    routes: [
      "/ceiling-lighting",
      "/wall-lighting",
      "/lamps",
      "/outdoor",
      "/fans",
      "/architectural",
      "/home-decor",
      "/room",
    ],
  },
  {
    group: "Product landing pages",
    routes: [
      "/ceiling-lighting/pendants/hicks-antique-brass",
      "/fans/roto-52-coal",
      "/fans/spitfire-brushed-bronze",
    ],
  },
  {
    group: "Product / catalog pages",
    routes: ["/catalog", "/catalog/:id", "/product/:id"],
  },
  {
    group: "Cart & checkout",
    routes: ["/cart", "/checkout"],
  },
  {
    group: "UI elements (no dedicated route yet)",
    routes: [
      "Sign In / Account",
      "Wishlist",
      "Cart icon",
      "Search",
      "Sale / Shop Hot Deals",
      "Advanced Search",
      "Ideas & Advice",
    ],
  },
];

const ComingSoonPage = () => {
  useEffect(() => {
    window.location.replace(BLOG_URL);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-16 pb-24">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground tracking-[-0.01em] leading-tight">
          Taking you to Ideas &amp; Advice
        </h1>
        <p className="mt-6 max-w-2xl text-muted-foreground text-sm leading-relaxed">
          If you are not redirected automatically,{" "}
          <a
            href={BLOG_URL}
            className="underline underline-offset-4 text-foreground"
          >
            continue to the article
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default ComingSoonPage;
