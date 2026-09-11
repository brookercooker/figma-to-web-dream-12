import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  inspirationHero,
  recentProjects,
  type ProjectPhoto,
  type RecentProject,
} from "@/data/inspirationGallery";

const ProjectBlock = ({
  project,
  index,
  onSelect,
}: {
  project: RecentProject;
  index: number;
  onSelect: (photo: ProjectPhoto) => void;
}) => {
  const [lead, ...rest] = project.photos;

  return (
    <article
      id={project.id}
      className="scroll-mt-28 border-t border-border/50 py-12 first:border-t-0 first:pt-0 sm:py-16"
    >
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-12">
        <button
          type="button"
          onClick={() => onSelect(lead)}
          className="group block w-full overflow-hidden rounded-lg bg-secondary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          aria-label={`View larger photo: ${lead.alt}`}
        >
          <img
            src={lead.src}
            alt={lead.alt}
            loading={index === 0 ? "eager" : "lazy"}
            className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </button>

        <div>
          <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-muted-foreground">
            {project.scope}
          </p>
          <h3 className="mt-2 font-serif text-2xl font-light leading-snug text-foreground sm:text-3xl">
            {project.location}
          </h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {project.copy}
          </p>
          {/* Signature pieces only — first three keep the block calm and scannable. */}
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.fixtures.slice(0, 3).map((fixture) => (
              <li
                key={fixture}
                className="rounded-full border border-border/70 px-3 py-1 text-[10px] font-sans uppercase tracking-[0.16em] text-muted-foreground"
              >
                {fixture}
              </li>
            ))}
          </ul>


          {rest.length > 0 && (
            <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3">
              {rest.map((photo) => (
                <button
                  key={photo.src + photo.alt}
                  type="button"
                  onClick={() => onSelect(photo)}
                  className="group text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  aria-label={`View larger photo: ${photo.alt}`}
                >
                  <div className="overflow-hidden rounded-lg bg-secondary/30">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="aspect-square h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  {photo.caption && (
                    <span className="mt-2 block text-[10px] font-sans uppercase tracking-[0.16em] text-muted-foreground">
                      {photo.caption}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

/** Shuffles, then spaces out projects that share a show so they don't stack up. */
const shuffleAndSpread = (items: RecentProject[]) => {
  const rest = [...items];
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const out: RecentProject[] = [];
  const pool = [...rest];
  while (pool.length) {
    const prev = out[out.length - 1];
    let idx = pool.findIndex((p) => !prev || !p.show || p.show !== prev.show);
    if (idx === -1) idx = 0;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
};

const FilterRow = ({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: string[];
  active: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="mr-1 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
      {label}
    </span>
    {["All", ...options].map((option) => {
      const isActive = active === option;
      return (
        <button
          key={option}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-1.5 text-[11px] font-sans tracking-[0.06em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
            isActive
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      );
    })}
  </div>
);

const InspirationGalleryPage = () => {
  const [activePhoto, setActivePhoto] = useState<ProjectPhoto | null>(null);
  const [city, setCity] = useState("All");
  const [show, setShow] = useState("All");
  const [room, setRoom] = useState("All");

  const cities = useMemo(
    () => Array.from(new Set(recentProjects.map((p) => p.city))).sort(),
    [],
  );
  const shows = useMemo(
    () =>
      Array.from(
        new Set(recentProjects.map((p) => p.show).filter((s): s is string => Boolean(s))),
      ).sort(),
    [],
  );
  const rooms = useMemo(
    () => Array.from(new Set(recentProjects.flatMap((p) => p.rooms))).sort(),
    [],
  );

  // Season 6 winner stays pinned first; the rest shuffle on each visit.
  const orderedProjects = useMemo(() => {
    const pinned = recentProjects.filter((p) => p.id === "rock-the-block-season-6");
    const rest = recentProjects.filter((p) => p.id !== "rock-the-block-season-6");
    return [...pinned, ...shuffleAndSpread(rest)];
  }, []);

  const visibleProjects = useMemo(
    () =>
      orderedProjects.filter(
        (p) =>
          (city === "All" || p.city === city) &&
          (show === "All" || p.show === show) &&
          (room === "All" || p.rooms.includes(room)),
      ),
    [orderedProjects, city, show, room],
  );

  const hasFilters = city !== "All" || show !== "All" || room !== "All";

  /** Deep links like /inspiration-gallery#hgtv-crashers scroll to that project. */
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.clearInterval(timer);
      } else if (++tries > 40) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {

    const prevTitle = document.title;
    document.title = "Recent Projects & Inspiration · Nova Lighting";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "Recent Nova Lighting installations across Utah — multiple photos from each project, with the fixtures and layers behind them.",
    );
    return () => {
      document.title = prevTitle;
      if (prevDesc) meta?.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[52vh] min-h-[320px] w-full overflow-hidden sm:h-[62vh]">
          <img
            src={inspirationHero.image}
            alt={inspirationHero.alt}
            className="h-full w-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-10 sm:px-10 sm:pb-16">
            <p className="mb-4 text-[10px] font-sans uppercase tracking-[0.35em] text-primary-foreground/80">
              Recent Work &amp; Inspiration
            </p>
            <h1 className="font-serif text-[2.25rem] font-light leading-tight text-primary-foreground sm:text-[3.25rem]">
              Lit along the <em className="italic">Wasatch</em>
            </h1>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-6 sm:px-10">
          <Breadcrumbs />
        </div>
      </section>

      {/* Projects */}
      <section id="recent-projects" className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mb-16">
          A look at homes we've lit recently — from the foothills to the desert. Select any
          photo to see it larger, then bring what you like into your own plan.
        </p>

        <div className="mb-12 space-y-3 border-y border-border/50 py-6 sm:mb-16">
          <FilterRow label="City" options={cities} active={city} onChange={setCity} />
          <FilterRow label="Show" options={shows} active={show} onChange={setShow} />
          <FilterRow label="Room" options={rooms} active={room} onChange={setRoom} />
          <div className="flex items-center gap-4 pt-1">
            <p className="text-[11px] font-sans uppercase tracking-[0.16em] text-muted-foreground">
              {visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setCity("All");
                  setShow("All");
                  setRoom("All");
                }}
                className="text-[11px] font-sans uppercase tracking-[0.16em] text-foreground underline underline-offset-4 hover:no-underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {visibleProjects.length === 0 && (
          <p className="py-12 text-sm text-muted-foreground">
            No projects match those filters yet — try clearing one.
          </p>
        )}

        {visibleProjects.map((project, index) => (

          <ProjectBlock
            key={project.id}
            project={project}
            index={index}
            onSelect={setActivePhoto}
          />
        ))}
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:px-10 sm:py-24">
          <h2 className="font-serif text-[1.75rem] font-light leading-tight text-foreground sm:text-[2.25rem]">
            Planning a room of your own?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Bring your plans, photos, or a single idea. A consultant will help you layer it.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-2 border border-foreground px-7 py-3.5 text-[11px] font-sans font-medium uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Talk to a Consultant <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <Dialog open={!!activePhoto} onOpenChange={(open) => !open && setActivePhoto(null)}>
        <DialogContent className="max-w-4xl border-none bg-background p-2 sm:p-3">
          <DialogTitle className="sr-only">{activePhoto?.alt ?? "Project photo"}</DialogTitle>
          {activePhoto && (
            <figure>
              <img
                src={activePhoto.src}
                alt={activePhoto.alt}
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
              {activePhoto.caption && (
                <figcaption className="mt-3 px-2 pb-1 text-[10px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
                  {activePhoto.caption}
                </figcaption>
              )}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InspirationGalleryPage;
