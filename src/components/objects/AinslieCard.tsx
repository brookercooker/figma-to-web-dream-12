import { Link } from "react-router-dom";

const AINSLIE_IMG =
  "/__l5e/assets-v1/6cd66711-2cc2-400d-b770-d5070dd3deb1/34_7-9307-1-322_cw6wt9apaujfud1e.jpg";

const AinslieCard = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 sm:px-10 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center bg-secondary/20 rounded-lg overflow-hidden">
        <div className="relative aspect-square md:aspect-auto md:h-[560px] bg-secondary/30">
          <img
            src={AINSLIE_IMG}
            alt="Savoy House Ainslie 1-light LED pendant in warm brass with a strie glass disc"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            width={1024}
            height={1024}
          />
        </div>
        <div className="px-6 sm:px-10 md:px-4 lg:px-10 py-10 md:py-14 max-w-md">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
            Ainslie Collection · Savoy House
          </p>
          <h2 className="font-serif text-[2rem] sm:text-[2.5rem] md:text-[2.75rem] font-light text-foreground leading-[1.05] mb-4">
            Ainslie LED Pendant
            <br />
            <span className="italic text-muted-foreground">in Warm Brass</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            A luminous strie-glass disc framed in warm brass — a quietly modern centerpiece for kitchens, dining rooms, and bedrooms.
          </p>
          <p className="font-sans text-[11px] tracking-[0.22em] uppercase text-foreground/70 mb-8">
            Available through Nova Lighting
          </p>
          <Link
            to="/locations"
            className="inline-block bg-foreground text-primary-foreground px-9 py-3 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors"
          >
            Inquire
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AinslieCard;
