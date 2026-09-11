import Breadcrumbs from "@/components/Breadcrumbs";
import TeamPreview from "@/components/TeamPreview";
import SteveObject from "@/components/objects/SteveObject";

/**
 * /test-page — a simple DB-backed static page.
 */
export default function TestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
        <Breadcrumbs />
      </div>
      <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-24">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-[-0.01em] leading-tight">
          Test Page
        </h1>
        <p className="mt-10 text-foreground text-lg">Test</p>
        <img
          src="/__l5e/assets-v1/ca56ef3c-aa5a-410c-bd3b-856ff21e1fa9/Alyssa_Gathercole_Lighting_Consultant_Midvale_Utah.jpg"
          alt="Alyssa Gathercole, Lighting Consultant, Midvale Utah"
          loading="lazy"
          className="mt-10 rounded-lg max-w-md w-full h-auto"
        />
        <img
          src="/__l5e/assets-v1/8eabd8dd-a9e4-4201-bb81-c1bc27ccd951/brands-bg.jpg"
          alt="brands-bg"
          loading="lazy"
          className="mt-10 rounded-lg max-w-md w-full h-auto"
        />
        <div className="mt-10 flex flex-wrap gap-4 max-w-3xl">
          <img
            src="https://qgzaumqnarcdxrdwmsex.supabase.co/storage/v1/object/public/images-web/1784753355253_9_Nova_Lighting_Last_Headshots_-11.webp"
            alt="Nova Lighting Last Headshots -11"
            loading="lazy"
            className="flex-1 min-w-[240px] rounded-lg w-full h-auto"
          />
          <img
            src="https://qgzaumqnarcdxrdwmsex.supabase.co/storage/v1/object/public/images-web/1784753353430_8_Nova_Lighting_Last_Headshots_-10.webp"
            alt="Nova Lighting Last Headshots -10"
            loading="lazy"
            className="flex-1 min-w-[240px] rounded-lg w-full h-auto"
          />
        </div>

        <div className="mt-10 max-w-3xl aspect-video rounded-lg overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/eMcf8fQw5cY"
            title="YouTube video eMcf8fQw5cY"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>


        <div className="mt-16">
          <TeamPreview />
        </div>

        <div className="mt-16">
          <SteveObject />
        </div>
      </section>
    </div>
  );
}
