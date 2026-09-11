import { IceCream2 } from "lucide-react";
import novaLogoHorizontal from "@/assets/nova-logo-horizontal.png";

const ObjectsFlyer = () => {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-8 print:p-0">
      {/* Flyer — 8.5 x 11 */}
      <article className="relative bg-cream w-full max-w-[720px] aspect-[8.5/11] flex flex-col overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] print:shadow-none">
        {/* Top bar */}
        <div className="px-12 pt-8 pb-5">
          <div className="flex items-end justify-between gap-6">
            <img
              src={novaLogoHorizontal}
              alt="Nova Lighting"
              className="h-10 w-auto object-contain"
            />
            <span className="font-sans text-[10px] tracking-[0.4em] uppercase text-stone pb-1">
              Est. 1951
            </span>
          </div>
          <div className="mt-3 h-px bg-brass" />
        </div>

        {/* Hero */}
        <header className="px-12 pb-10 border-b-2 border-ink/20">
          <p className="font-sans text-[14px] font-semibold tracking-[0.5em] uppercase text-garnet mb-5">
            You&rsquo;re Invited
          </p>
          <h1 className="font-serif font-normal leading-[0.9] tracking-[-0.02em] text-ink text-[112px]">
            Grand <span className="italic">Opening</span>
          </h1>
          <p className="mt-4 font-sans text-[15px] font-medium tracking-[0.35em] uppercase text-ink/80">
            &amp; Ribbon Cutting Ceremony
          </p>
        </header>

        {/* Key facts — scannable rows */}
        <dl className="px-12 py-8 divide-y-2 divide-ink/15">
          {[
            { label: "Date", value: "Thursday · September 17, 2026" },
            { label: "Time", value: "2:00 PM" },
            {
              label: "Location",
              value: (
                <>
                  3284 E Deseret Drive, Suite 17
                  <br />
                  <span className="text-ink/75">St. George, Utah 84790</span>
                </>
              ),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-12 gap-6 py-5 items-baseline"
            >
              <dt className="col-span-3 font-sans text-[13px] font-semibold tracking-[0.35em] uppercase text-ink">
                {row.label}
              </dt>
              <dd className="col-span-9 font-serif text-[30px] leading-tight text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Perks — two clear cards */}
        <div className="px-12 pb-10 grid grid-cols-2 gap-5">
          <div className="bg-sand p-7 border-2 border-ink/10">
            <p className="font-sans text-[12px] font-semibold tracking-[0.4em] uppercase text-ink mb-3">
              First 50 Guests
            </p>
            <p className="font-serif text-garnet text-[72px] font-medium leading-none">50</p>
            <p className="mt-3 font-serif text-[24px] leading-snug text-ink">
              Receive an <span className="italic font-medium">Amazon gift card</span>
            </p>
          </div>
          <div className="bg-sand p-7 border-2 border-ink/10">
            <p className="font-sans text-[12px] font-semibold tracking-[0.4em] uppercase text-ink mb-3">
              On the House
            </p>
            <div className="text-garnet h-[72px] flex items-center">
              <IceCream2 size={68} strokeWidth={1.25} />
            </div>
            <p className="mt-3 font-serif text-[24px] leading-snug text-ink">
              <span className="italic font-medium">Karie Anne&rsquo;s</span> Italian Ice
            </p>
          </div>
        </div>

      </article>
    </div>
  );
};

export default ObjectsFlyer;
