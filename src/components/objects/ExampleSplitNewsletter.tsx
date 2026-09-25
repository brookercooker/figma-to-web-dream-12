import floor from "@/assets/category-floor-lamp.jpg";
import { ArrowRight } from "lucide-react";

/** Test example: dark panel with a sign-up form on the left, full-height photo right, small print under the form. */
export default function ExampleSplitNewsletter() {
  return (
    <section className="grid w-full grid-cols-1 bg-nova-ink md:grid-cols-2">
      <div className="flex flex-col justify-center px-10 py-20 md:px-16">
        <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-brass">The Nova letter</p>
        <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-nova-cream">
          New arrivals, quietly, <br />once a month.
        </h2>
        <form className="mt-10 flex max-w-md border-b border-nova-cream/40" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Email address"
            className="flex-1 bg-transparent py-3 font-sans text-sm text-nova-cream placeholder:text-nova-cream/50 focus:outline-none"
          />
          <button type="submit" className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.22em] text-nova-cream">
            Subscribe <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
        <p className="mt-4 font-sans text-xs text-nova-cream/50">No more than twelve letters a year. Unsubscribe anytime.</p>
      </div>
      <img src={floor} alt="Floor lamp in a reading corner" className="h-full min-h-[360px] w-full object-cover" />
    </section>
  );
}
