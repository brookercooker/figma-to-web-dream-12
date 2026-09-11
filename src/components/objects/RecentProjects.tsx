import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import projectStGeorge from "@/assets/project-st-george-utah.jpg.asset.json";
import projectHeber from "@/assets/project-heber-utah.jpg.asset.json";
import projectOrem from "@/assets/project-orem-utah.jpg.asset.json";
import projectTooele from "@/assets/project-tooele-utah.jpg.asset.json";

type Project = {
  location: string;
  scope: string;
  image: string;
  alt: string;
  position?: string;
};

const projects: Project[] = [
  {
    location: "St. George, Utah",
    scope: "Great room & recessed layers",
    image: projectStGeorge.url,
    alt: "Brass chandelier over a living room in a St. George, Utah home",
  },
  {
    location: "Heber, Utah",
    scope: "Stair & landing pendant",
    image: projectHeber.url,
    alt: "Oversized shaded pendant above a stair landing in a Heber, Utah home",
  },
  {
    location: "Orem, Utah",
    scope: "Entry & curved stair",
    image: projectOrem.url,
    alt: "Cascading amber glass pendants above a curved stair in an Orem, Utah home",
  },
  {
    location: "Tooele, Utah",
    scope: "Hearth room & sconces",
    image: projectTooele.url,
    alt: "Iron chandelier and vanity-style sconces in a Tooele, Utah hearth room",
  },
];


/**
 * Recent Projects — installed work, named by the town it lives in.
 * Reinforces local reach without stating it outright.
 */
const RecentProjects = () => (
  <section className="border-y border-border/50 bg-background">
    <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 sm:mb-14">
        <div className="max-w-lg">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
            Recent Work
          </p>
          <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-light text-foreground leading-tight">
            Lit along the <em className="italic">Wasatch</em>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mt-4">
            A few homes we've lit recently — from the foothills to the desert.
          </p>
        </div>
        <Link
          to="/inspiration-gallery"
          className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.18em] uppercase text-foreground hover:text-accent transition-colors shrink-0"
        >
          See More Projects <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 sm:gap-x-6 gap-y-10">
        {projects.slice(0, 4).map((project) => (
          <li key={project.location}>
            <div className="aspect-[4/5] overflow-hidden bg-secondary/30 rounded-lg mb-4">
              <img
                src={project.image}
                alt={project.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-light text-foreground leading-snug">
              {project.location}
            </h3>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default RecentProjects;
