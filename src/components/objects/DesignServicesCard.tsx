import diningAsset from "@/assets/sage-homes-dining-v2.jpg.asset.json";

interface DesignServicesCardProps {
  variant?: "vertical" | "horizontal";
}

const DesignServicesCard = ({ variant = "vertical" }: DesignServicesCardProps) => {
  if (variant === "horizontal") {
    return (
      <div className="w-full mx-auto bg-cream overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] md:aspect-auto md:min-h-[420px]">
          <img
            src={diningAsset.url}
            alt="Modern mountain-view dining room with layered lighting"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-center px-8 sm:px-14 md:px-16 py-14 md:py-16 text-left">
          <p className="font-sans text-garnet text-[10px] uppercase tracking-[0.25em] font-bold mb-5">
            The Nova Advantage
          </p>

          <h2 className="font-serif text-ink text-4xl md:text-5xl italic leading-[1.05] mb-6 max-w-md">
            A designer in your corner
          </h2>

          <p className="font-sans text-ink text-sm md:text-[15px] leading-relaxed mb-10 font-light opacity-80 max-w-md">
            From a single fixture to a full build, our lighting consultants are yours — at no charge.
          </p>

          <a
            href="/contact"
            className="group inline-flex items-center gap-3 border border-ink text-ink px-8 py-3.5 font-sans text-[11px] uppercase tracking-[0.25em] font-medium transition-colors hover:bg-ink hover:text-cream self-start"
          >
            <span>Reserve your time</span>
            <span
              aria-hidden="true"
              className="h-px w-6 bg-brass transition-all duration-300 group-hover:w-10 group-hover:bg-cream"
            />
          </a>


          {/* Decorative accent */}
          <div className="absolute bottom-6 left-8 sm:left-14 md:left-16">
            <div className="w-12 h-px bg-sand" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] mx-auto bg-cream overflow-hidden shadow-xl">
      {/* Image Header */}
      <div className="relative w-full aspect-[16/9]">
        <img
          src={diningAsset.url}
          alt="Modern mountain-view dining room with layered lighting"
          className="absolute inset-0 h-full w-full object-cover"
        />

      </div>


      {/* Content Card */}
      <div className="relative px-8 pt-10 pb-12 text-center">
        <p className="font-sans text-garnet text-[10px] uppercase tracking-[0.25em] font-bold mb-4">
          The Nova Advantage
        </p>

        <h2 className="font-serif text-ink text-3xl italic leading-tight mb-5">
          A designer in your corner
        </h2>

        <p className="font-sans text-ink text-sm leading-relaxed mb-10 font-light opacity-80">
          From a single fixture to a full build, our lighting consultants are yours — at no charge.
        </p>

        <a
          href="/contact"
          className="group inline-flex items-center gap-3 border border-ink text-ink px-8 py-3.5 font-sans text-[11px] uppercase tracking-[0.25em] font-medium transition-colors hover:bg-ink hover:text-cream"
        >
          <span>Reserve your time</span>

          <span
            aria-hidden="true"
            className="h-px w-6 bg-brass transition-all duration-300 group-hover:w-10 group-hover:bg-cream"
          />
        </a>
      </div>

      {/* Decorative Bottom Accent */}
      <div className="flex justify-center pb-6">
        <div className="w-12 h-px bg-sand" />
      </div>
    </div>
  );
};

export default DesignServicesCard;
