import { useState } from "react";
import { Play, X } from "lucide-react";

const expertVideos = [
  { id: "0gCWdaU3qFU", title: "The Danish Secret to Happiness: It's All in the Lighting", subtitle: "Discover simple lighting changes that can make your home feel more relaxing, cozy, and emotionally uplifting." },
  { id: "8DRo3kmmlQs", title: "How to Choose the Right Ceiling Fan (And the Winter Trick No One Talks About)", subtitle: "Pick the perfect fan for your space and learn the simple setting that keeps your home warmer, more comfortable, and more efficient all winter." },
  { id: "FUqHGVCLlrc", title: "Daytime Lighting Tips to Stay Focused and Avoid Burnout", subtitle: "Adjust your lighting to improve clarity, reduce eye strain, and maintain steady energy from morning to evening." },
  { id: "lPCOlOWe1zo", title: "How to Use Warm, Eye-Level Lighting for a More Relaxing Home", subtitle: "Create a space that signals your brain to slow down—using lighting that promotes comfort, calm, and better evenings." },
];

const SectionHeading = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={`font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light text-center ${className}`}
  >
    {children}
  </h2>
);

const ObjectsLightingTips = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-secondary/15 border-y border-border/50">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground text-center mb-4">
            From Our Team of Experts
          </p>
          <SectionHeading className="mb-3">
            Lighting Tips &amp; Expertise
          </SectionHeading>
          <p className="text-center text-muted-foreground text-sm max-w-lg mx-auto mb-12 sm:mb-16">
            Lighting Utah's homes for over 75 years, our designers share the techniques and advice behind beautifully lit spaces.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
            {expertVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video.id)}
                className="group text-left focus:outline-none flex flex-col"
              >
                <div className="relative aspect-video w-full bg-secondary/30 overflow-hidden mb-3 rounded-lg">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/35 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary-foreground/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 text-foreground fill-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-[13px] font-sans font-medium text-foreground leading-snug mb-0.5">
                  {video.title}
                </h4>
                <p className="text-[11px] text-muted-foreground">{video.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/80 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 right-0 text-primary-foreground hover:opacity-70"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectsLightingTips;
