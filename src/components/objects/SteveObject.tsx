import { useIsThumbnail } from "@/lib/thumbnail";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    src: "/__l5e/assets-v1/c114f3e4-3ae2-4804-8585-8daaf16ed3c8/card-design-services.jpg",
    alt: "Card design services",
  },
  {
    src: "/__l5e/assets-v1/ac945c97-c2be-440f-aa31-eaad88de9239/category-floor-lamp.jpg",
    alt: "Category floor lamp",
  },
  {
    src: "/__l5e/assets-v1/447c86f7-4870-4478-8287-db17eb454a2b/fanimation-spitfire.jpg",
    alt: "Fanimation Spitfire",
  },
];

export default function SteveObject() {
  const [i, setI] = useState(0);
  const n = slides.length;

  const isThumb = useIsThumbnail();
  useEffect(() => {
    if (isThumb) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, isThumb]);

  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="relative overflow-hidden rounded-lg aspect-[16/9] bg-muted">
          {slides.map((s, idx) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          ))}

          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 w-2 rounded-full transition ${
                  idx === i ? "bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
