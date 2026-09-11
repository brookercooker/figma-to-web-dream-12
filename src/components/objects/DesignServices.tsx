import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Compass, Lightbulb, Ruler } from "lucide-react";
import cardDesignServices from "@/assets/card-design-services.jpg";

const steps = [
  {
    icon: Calendar,
    label: "Book a Consultation",
    body: "Meet with a designer at any of our six Utah showrooms — or share your plans remotely.",
  },
  {
    icon: Ruler,
    label: "Review Your Plans",
    body: "We study your architectural drawings, ceiling heights, and the way you actually live in each room.",
  },
  {
    icon: Compass,
    label: "Curate the Fixtures",
    body: "A tailored lighting plan drawn from over 200 brands — nothing generic, nothing forced.",
  },
  {
    icon: Lightbulb,
    label: "Light Your Home",
    body: "White-glove ordering, delivery coordination, and support through installation.",
  },
];

const DesignServices = () => {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-nova-garnet font-semibold mb-4">
            Complimentary with Any Project
          </p>
          <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light leading-[1.05]">
            Lighting Design <em className="italic text-nova-stone">Services</em>
          </h2>
          <div className="mx-auto mt-5 h-px w-12 bg-nova-brass" />
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground text-sm sm:text-[15px] leading-relaxed font-light">
            Work one-on-one with a Nova designer to build a lighting plan tailored to your architecture, your finishes, and the way you live. Seventy-five years of experience, quietly at your service.
          </p>
        </div>

        {/* Editorial image + intro */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-20 sm:mb-24">
          <div className="lg:col-span-7">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-nova-sand">
              <img
                src={cardDesignServices}
                alt="Nova designer reviewing home plans with fixture samples"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="lg:col-span-5">
            <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-light leading-snug mb-5">
              A quieter way to design with light.
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Every home deserves lighting that feels considered — not catalog-picked. Our designers spend the time to understand how each room will be used at 7 a.m. and again at 10 p.m., then specify fixtures that carry your home through both.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              There is no charge, no obligation, and no pressure. Just informed guidance from people who have been lighting Utah's most beautiful homes since 1952.
            </p>
            <Link
              to="/locations"
              className="inline-flex items-center gap-2 bg-foreground text-primary-foreground px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors"
            >
              Book a Consultation <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Process */}
        <div className="mb-4 text-center">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground">
            The Process
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 mt-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="text-center px-2">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-nova-brass/50 text-nova-brass">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-nova-garnet font-semibold mb-2">
                  Step {String(idx + 1).padStart(2, "0")}
                </p>
                <h4 className="font-serif text-lg text-foreground font-light mb-2 leading-snug">
                  {step.label}
                </h4>
                <p className="text-muted-foreground text-[13px] leading-relaxed font-light">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DesignServices;
