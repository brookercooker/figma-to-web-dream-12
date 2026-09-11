import Breadcrumbs from "@/components/Breadcrumbs";
import { Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { objectRegistry } from "@/components/objects/registry";


interface Props {
  title: string;
  children?: React.ReactNode;
}

/** Minimal placeholder page — a title + empty content area ready to be filled in later. */
const SimplePage = ({ title, children }: Props) => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
      <Breadcrumbs />
    </div>
    <section className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-24">
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-[-0.01em] leading-tight">
        {title}
      </h1>
      {children ?? <p className="mt-6 text-muted-foreground text-sm">Content coming soon.</p>}
    </section>
  </div>
);

const AboutObject = objectRegistry.AboutUs.component as React.ComponentType;

export const AboutPage = () => {
  const { hash } = useLocation();

  /** The About content is lazy-loaded, so poll briefly for the anchor. */
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.clearInterval(timer);
      } else if (++tries > 40) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
        <Breadcrumbs />
      </div>
      <Suspense fallback={<div className="min-h-[400px] bg-muted animate-pulse" />}>
        <AboutObject />
      </Suspense>
    </div>
  );
};


export const ShippingPolicyPage = () => <SimplePage title="Shipping Policy" />;
export const ReturnPolicyPage = () => <SimplePage title="Return Policy" />;
export const PrivacyPolicyPage = () => <SimplePage title="Privacy Policy" />;
export const TermsConditionsPage = () => <SimplePage title="Terms & Conditions" />;

export default SimplePage;
