import { SmartImage } from "@/components/SmartImage";
import { SmartVideo } from "@/components/SmartVideo";

const IMAGE = {
  src: "https://qgzaumqnarcdxrdwmsex.supabase.co/storage/v1/object/public/images-web-gated/1785269579884_4ori2d_istockphoto-816752606-612x612.webp",
  fallback:
    "https://qgzaumqnarcdxrdwmsex.supabase.co/storage/v1/object/public/images-web-gated/1785269579884_4ori2d_istockphoto-816752606-612x612.jpg",
};

const VIDEO = {
  src: "https://qgzaumqnarcdxrdwmsex.supabase.co/storage/v1/object/public/videos-web-gated/1785269577938_50qbrx_Big_Buck_Bunny_360_10s_1MB.mp4",
  poster:
    "https://qgzaumqnarcdxrdwmsex.supabase.co/storage/v1/object/public/videos-web-gated/video-posters/1785269577938_50qbrx_Big_Buck_Bunny_360_10s_1MB.webp",
};

export default function RaceSecondTest() {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <p className="mb-6 text-center font-serif text-2xl text-green-600">hi</p>
        <div className="overflow-hidden rounded-lg bg-muted">
          <SmartImage
            src={IMAGE.src}
            fallbackSrc={IMAGE.fallback}
            alt="Warmly lit interior scene"
            className="w-full h-auto object-cover"
          />
        </div>
        <h2 className="mt-8 font-serif text-3xl sm:text-4xl text-ink text-center">
          Test here
        </h2>

        <div className="mt-12 overflow-hidden rounded-lg bg-muted">
          <SmartVideo
            src={VIDEO.src}
            poster={VIDEO.poster}
            controls
            className="w-full h-auto"
          />
        </div>

        <p className="mt-8 text-center font-serif text-2xl text-ink">
          hello world
        </p>

      </div>
    </section>
  );
}
