import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  editorialSections,
  formatPrice,
  newAndNowGroups,
  
  type EditorialSection,
  type NewAndNowItem,
} from "@/data/newAndNow";

const Badge = ({ label }: { label: string }) => (
  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-foreground">
    {label}
  </span>
);

/** Internal paths route in-app; absolute URLs open in a new tab. */
const ItemLink = ({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
  /^https?:\/\//.test(href) ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...rest}
    >
      {children}
    </a>
  ) : (
    <Link to={href} className={className} {...rest}>
      {children}
    </Link>
  );

const ProductCard = ({ item }: { item: NewAndNowItem }) => (
  <div className="group">
    <ItemLink href={item.href} className="block">
      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-background">
        {item.badge && <Badge label={item.badge} />}
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} in ${item.finish ?? "its featured finish"} by ${item.brand}`}
            loading="lazy"
            className="h-full w-full object-contain p-5 sm:p-7 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/70 bg-secondary/20">
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground/70">
              Photo coming
            </span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground mb-1.5">
        {item.brand}
      </p>
      <h3 className="font-serif text-base sm:text-lg font-light text-foreground leading-snug">
        {item.name}
      </h3>
      {item.finish && (
        <p className="text-xs text-muted-foreground mt-1">{item.finish}</p>
      )}
      <p className="mt-2 text-sm text-foreground">{formatPrice(item.price)}</p>
    </ItemLink>
    <ItemLink
      href={item.href}
      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-sans font-medium tracking-[0.14em] uppercase text-foreground/70 hover:text-foreground transition-colors"
      aria-label={`Shop ${item.name}`}
    >
      Shop <ArrowRight className="h-3.5 w-3.5" />
    </ItemLink>
  </div>
);

/** Quiet reserved space for a product that has not been added yet. */
const ProductSlot = () => (
  <div aria-hidden="true">
    <div className="mb-4 flex aspect-square items-center justify-center rounded-lg border border-dashed border-border/70 bg-secondary/20">
      <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground/70">
        Arriving soon
      </span>
    </div>
    <div className="h-1.5 w-16 rounded-full bg-secondary/60" />
  </div>
);

const FeaturedCard = ({ item }: { item: NewAndNowItem }) => (
  <div className="group grid gap-8 sm:gap-12 md:grid-cols-2 items-center">
    <Link to={item.href} className="block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary/40">
        {item.badge && <Badge label={item.badge} />}
        <img
          src={item.image}
          alt={`${item.name} in ${item.finish ?? "its featured finish"} by ${item.brand}`}
          loading="lazy"
          className="h-full w-full object-contain p-8 sm:p-14 transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
    </Link>
    <div>
      <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground mb-3">
        {item.brand}
        {item.collection ? ` · ${item.collection}` : ""}
      </p>
      <h3 className="font-serif text-[1.75rem] sm:text-[2.25rem] font-light text-foreground leading-tight">
        <Link to={item.href}>{item.name}</Link>
      </h3>
      {item.finish && (
        <p className="text-sm text-muted-foreground mt-3">{item.finish}</p>
      )}
      <p className="mt-4 text-lg text-foreground">{formatPrice(item.price)}</p>
      {item.note && (
        <p className="text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
          {item.note}
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          to={item.href}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-6 py-3 text-[11px] font-sans font-medium tracking-[0.14em] uppercase text-background hover:opacity-90 transition-opacity"
        >
          Shop this piece <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center rounded-full border border-border px-6 py-3 text-[11px] font-sans font-medium tracking-[0.14em] uppercase text-foreground hover:bg-secondary/40 transition-colors"
        >
          Ask a consultant
        </Link>
      </div>
    </div>
  </div>
);

const SectionHeader = ({
  kicker,
  title,
  copy,
  className = "",
}: {
  kicker: string;
  title: string;
  copy: string;
  className?: string;
}) => (
  <header className={`max-w-2xl ${className}`}>
    <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-accent mb-3">
      {kicker}
    </p>
    <h2 className="font-serif text-[1.75rem] sm:text-[2.5rem] text-foreground font-light leading-tight">
      {title}
    </h2>
    <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
      {copy}
    </p>
  </header>
);

/** Fills a section's reserved spaces with real items first, then placeholders. */
const slotsFor = (section: EditorialSection) =>
  Array.from({ length: Math.max(section.slots, section.items.length) }, (_, i) =>
    section.items[i] ?? null,
  );

const SlotGrid = ({
  section,
  slots,
  className,
}: {
  section: EditorialSection;
  slots: (NewAndNowItem | null)[];
  className: string;
}) => (
  <div className={className}>
    {slots.map((item, i) =>
      item ? (
        <ProductCard key={item.id} item={item} />
      ) : (
        <ProductSlot key={`${section.id}-slot-${i}`} />
      ),
    )}
  </div>
);

const EditorialSectionBlock = ({
  section,
  tinted,
}: {
  section: EditorialSection;
  tinted: boolean;
}) => {
  const slots = slotsFor(section);

  return (
    <section
      id={section.id}
      className={tinted ? "bg-secondary/20" : "bg-background"}
    >
      {section.layout === "lifestyle-lead" && (
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-14 sm:py-20">
          <div className="mb-10 sm:mb-14 overflow-hidden rounded-lg">
            <img
              src={section.image}
              alt={section.imageAlt}
              loading="lazy"
              className="h-[52vw] max-h-[560px] w-full object-cover object-[35%_20%] sm:h-[38vw]"
            />
          </div>
          <SectionHeader
            kicker={section.kicker}
            title={section.title}
            copy={section.copy}
            className="mb-10 sm:mb-14"
          />
          <SlotGrid
            section={section}
            slots={slots}
            className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-14"
          />
        </div>
      )}

      {(section.layout === "asymmetric" ||
        section.layout === "asymmetric-mirror") && (
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-14 sm:py-20">
          <div className="grid gap-10 sm:gap-14 lg:grid-cols-12">
            <div
              className={
                section.layout === "asymmetric-mirror"
                  ? "lg:col-span-5 lg:order-2"
                  : "lg:col-span-5"
              }
            >
              <div className="lg:sticky lg:top-10">
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={section.image}
                    alt={section.imageAlt}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>
                <SectionHeader
                  kicker={section.kicker}
                  title={section.title}
                  copy={section.copy}
                  className="mt-8 sm:mt-10"
                />
              </div>
            </div>
            <div
              className={
                section.layout === "asymmetric-mirror"
                  ? "lg:col-span-7 lg:order-1"
                  : "lg:col-span-7"
              }
            >
              <SlotGrid
                section={section}
                slots={slots}
                className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-14"
              />
            </div>
          </div>
        </div>
      )}

      {section.layout === "material-closeup" && (
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-14 sm:py-20">
          <SectionHeader
            kicker={section.kicker}
            title={section.title}
            copy={section.copy}
            className="mb-10 sm:mb-14"
          />
          <SlotGrid
            section={section}
            slots={slots.slice(0, 3)}
            className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-8"
          />
          <div className="my-12 sm:my-16 overflow-hidden rounded-lg">
            <img
              src={section.image}
              alt={section.imageAlt}
              loading="lazy"
              className="h-[46vw] max-h-[460px] w-full object-cover sm:h-[30vw]"
            />
          </div>
          <SlotGrid
            section={section}
            slots={slots.slice(3)}
            className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 sm:gap-x-8"
          />
        </div>
      )}
    </section>
  );
};

const NewAndNowPage = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "New & Now · Nova Lighting";

    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "New & Now at Nova Lighting — new arrivals and the curated aesthetics, materials and craftsmanship we are excited about right now.",
    );

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc !== null) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <>
      <Breadcrumbs />

      {/* New & Now — intro + newest arrivals */}
      <section id="new-and-now" className="bg-background">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-10 pb-14 sm:pt-16 sm:pb-20">
          <header className="max-w-3xl">
            <h1 className="font-serif text-[2.25rem] sm:text-[3.25rem] md:text-[3.75rem] text-foreground font-light leading-[1.05]">
              New &amp; Now
            </h1>
            <p className="mt-6 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              What we are excited about right now — new arrivals, emerging
              design directions, and the finishes and materials shaping the
              rooms we are lighting this season. Everything here is shoppable.
            </p>
          </header>

          {newAndNowGroups.map((group) => {
            const featured = group.items.find((item) => item.featured);
            const rest = group.items.filter((item) => item !== featured);

            return (
              <div key={group.id} className="mt-12 sm:mt-16">
                {featured && (
                  <div className="mb-14 sm:mb-20">
                    <FeaturedCard item={featured} />
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-14">
                    {rest.map((item) => (
                      <ProductCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* 02–04 — Editorial sections */}
      {editorialSections.map((section, index) => (
        <EditorialSectionBlock
          key={section.id}
          section={section}
          tinted={index % 2 === 0}
        />
      ))}

      {/* Closing */}
      <section className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-24 text-center">
          <h2 className="font-serif text-[1.75rem] sm:text-[2.25rem] text-foreground font-light">
            Looking for something you have not seen here?
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Our consultants work with hundreds of lines beyond what is listed.
            Tell us about the room and we will bring options to you.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-foreground px-6 py-3 text-[11px] font-sans font-medium tracking-[0.14em] uppercase text-background hover:opacity-90 transition-opacity"
          >
            Start a conversation <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default NewAndNowPage;
