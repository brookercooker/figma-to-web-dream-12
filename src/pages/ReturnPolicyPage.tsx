import Breadcrumbs from "@/components/Breadcrumbs";
import { useEffect } from "react";

/** Section wrapper — semantic heading + body copy in a single readable column. */
const Section = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <section aria-labelledby={`section-${number}`} className="mt-12">
    <h2
      id={`section-${number}`}
      className="font-serif text-2xl sm:text-3xl font-light text-foreground tracking-[-0.01em]"
    >
      {number}. {title}
    </h2>
    <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground">{children}</div>
  </section>
);

const ReturnPolicyPage = () => {
  useEffect(() => {
    document.title = "Return Policy | Nova Lighting";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Nova Lighting Return Policy: return authorization, eligible returns, nonreturnable products, refunds, cancellations, and contact information.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
        <Breadcrumbs />
      </div>

      <article className="mx-auto max-w-[46rem] px-4 sm:px-8 pt-4 pb-24">
        <header>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-[-0.01em] leading-tight">
            Return Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            NOVA LIGHTING, INC. d/b/a Nova Lighting
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective Date: August 13, 2026 Version: 1.0
          </p>
        </header>

        <Section number="1" title="Scope and Definitions">
          <p>
            This Return Policy applies to products purchased from Nova Lighting through the Site or through a
            quote, order, or trade-account transaction that incorporates this Policy. The Terms of Use and
            Conditions of Sale and Shipping Policy are incorporated by reference. Transaction-specific return
            terms in an accepted written quote or agreement control to the extent they expressly conflict with
            this Policy.
          </p>
          <p>
            A “Consumer Order” is a purchase primarily for personal, family, or household use. A “Commercial
            Order” includes a wholesale, trade, contractor, designer, builder, resale, business, or project
            purchase. A “Project Order” is an order expressly identified as such in the quote or order
            confirmation because of its quantity, value, special pricing, manufacturer terms, or
            project-specific procurement. A “Special Order Product” is a product identified as custom,
            made-to-order, modified, nonstock, special order, or nonreturnable before the order is accepted.
          </p>
        </Section>

        <Section number="2" title="Return Authorization Required">
          <p>
            All returns require a written Return Goods Authorization (“RGA”) from Nova Lighting before shipment
            or delivery. To request an RGA, contact{" "}
            <a href="mailto:info@novalighting.com" className="underline underline-offset-4 hover:text-muted-foreground">
              info@novalighting.com
            </a>{" "}
            and provide the purchaser's name,
            order or invoice number, item number and quantity, delivery date, reason for return, condition of
            the product and packaging, and requested resolution.
          </p>
          <p>
            An RGA authorizes inspection of the returned product; it does not guarantee a refund or credit.
            Unauthorized returns, collect shipments, and returns sent to an incorrect address may be refused or
            returned at the customer's expense. Follow the RGA instructions and ship the product within ten
            calendar days after the RGA is issued unless Nova Lighting approves a different period in writing.
          </p>
        </Section>

        <Section number="3" title="Eligible Consumer Returns">
          <p>
            Unless a product is excluded below, a Consumer Order for a regular stock product may be submitted
            for return within 30 calendar days after delivery if the product is unused, uninstalled,
            unassembled, unaltered, in resalable condition, and returned with the original carton, inserts,
            protective materials, labels, instructions, hardware, accessories, and components.
          </p>
          <p>
            Eligible nondefective consumer returns are subject to a 25% restocking fee, return-shipping
            charges, and any other deductions permitted below. Original shipping, freight,
            expedited-service, delivery, and handling charges are not refundable unless the return results from
            Nova Lighting's shipment of an incorrect product or another charge that applicable law requires Nova
            Lighting to refund.
          </p>
        </Section>

        <Section number="4" title="Commercial and Project Orders">
          <p>
            Commercial Orders and Project Orders are returnable only with Nova Lighting's prior written approval
            and, where applicable, the manufacturer's approval. Approved returns are subject to all manufacturer
            restocking or cancellation charges, outbound and return freight, handling, and other reasonable
            costs. A quote or order confirmation may make a Commercial Order or Project Order final and
            nonreturnable.
          </p>
          <p>
            Project Orders are designated in the accepted quote or order confirmation rather than by a general
            dollar threshold. This permits Nova Lighting to disclose order-specific cancellation, return,
            storage, and manufacturer terms before the customer commits to the order.
          </p>
        </Section>

        <Section number="5" title="Nonreturnable Products">
          <p>
            Except for a verified shipping error, transit-damage claim, or applicable warranty claim, the
            following are nonreturnable:
          </p>
          <ol className="list-decimal space-y-3 pl-6">
            <li>
              Special Order Products, custom or made-to-order products, products with custom finishes, and
              products modified at the customer's request;
            </li>
            <li>
              Products identified as final sale, clearance, display, open-box, discontinued, nonreturnable, or
              subject to final-sale pricing before purchase;
            </li>
            <li>
              Products that have been installed, wired, assembled beyond what is reasonably necessary for
              inspection, cut, clipped, painted, refinished, altered, programmed, damaged after delivery, or
              used;
            </li>
            <li>
              Products missing original packaging, labels, instructions, hardware, components, or accessories,
              if the omission materially affects resale or manufacturer acceptance;
            </li>
            <li>
              Replacement parts, cut wire or cable, opened bulbs or lamps, opened electrical controls or
              components, and other health-, safety-, or compatibility-sensitive items identified as
              nonreturnable before purchase; and
            </li>
            <li>
              Gift cards, delivery or installation services already performed, and products otherwise excluded
              in the accepted quote or order confirmation.
            </li>
          </ol>
        </Section>

        <Section number="6" title="Return Condition and Deductions">
          <p>
            Nova Lighting and the applicable manufacturer may inspect a returned product. In addition to an
            applicable restocking fee and shipping charges, Nova Lighting may deduct the reasonable loss in
            value or cost caused by missing parts, damaged or substituted packaging, customer-caused damage,
            use, assembly, alteration, or failure to follow the RGA instructions. Nova Lighting will not impose
            a restocking fee for a verified incorrect shipment, covered transit damage, or covered defect for
            which Nova Lighting authorizes a return.
          </p>
        </Section>

        <Section number="7" title="Return Packing and Shipping">
          <p>
            Unless Nova Lighting confirms that it will arrange or pay for return shipping, the customer is
            responsible for packing, insuring, and shipping the return by a trackable method to the location
            stated in the RGA. Do not ship a product to Nova Lighting's showroom or to a manufacturer without
            written instructions. The customer bears the risk of loss for an elective return until it is
            received at the authorized return location.
          </p>
        </Section>

        <Section number="8" title="Refunds and Credits">
          <p>
            After an authorized return is received and inspected, Nova Lighting will notify the customer whether
            the return is approved and identify any deductions. An approved consumer refund ordinarily will be
            issued to the original payment method within seven to ten business days after inspection, subject to
            the payment provider's processing time and any shorter period required by law. A Commercial Order
            may be refunded by account credit if the accepted account or project terms so provide.
          </p>
        </Section>

        <Section number="9" title="Shipping Damage, Defects, Shortages, and Incorrect Products">
          <p>
            Shipping damage, concealed damage, shortages, incorrect products, and suspected manufacturing
            defects are not ordinary returns. Follow the inspection, documentation, and notice procedures in the
            Shipping Policy. Nova Lighting may request photographs, packaging, carrier documents, serial
            numbers, testing, or return of the product before determining the appropriate remedy.
          </p>
          <p>
            Depending on the circumstances, the applicable remedy may include replacement parts, repair,
            manufacturer warranty assistance, replacement, store credit, or refund. Do not install or alter a
            product that appears damaged, incomplete, incorrect, or defective. Nova Lighting is not responsible
            for removal, installation, reinstallation, electrician, contractor, lift, scaffolding, finishing,
            delay, or similar costs unless Nova Lighting expressly agrees in writing or applicable law requires
            otherwise.
          </p>
        </Section>

        <Section number="10" title="Cancellations Before Shipment">
          <p>
            A cancellation request is not effective until Nova Lighting confirms it in writing. A regular stock
            product may ordinarily be canceled before Nova Lighting accepts or releases the order. Once a
            product has been released to a manufacturer, allocated, placed into production, custom finished, or
            shipped, cancellation may be unavailable or subject to manufacturer charges, return freight, and the
            return rules above. Special Order Products and Project Orders may be noncancelable as stated in the
            accepted quote or order confirmation.
          </p>
          <p>
            Nothing in this section limits a consumer's right to decline a shipping delay or receive a refund
            for unshipped merchandise when required by the Federal Trade Commission's Mail, Internet, or
            Telephone Order Merchandise Rule or other applicable law.
          </p>
        </Section>

        <Section number="11" title="Exchanges">
          <p>
            Unless Nova Lighting agrees otherwise in writing, an exchange is processed as a return of the
            original product and a separate purchase of the replacement product. The replacement is subject to
            current price, availability, lead time, shipping charges, and applicable policies.
          </p>
        </Section>

        <Section number="12" title="Manufacturer Warranties">
          <p>
            A product that is outside the return period or has been installed may be eligible for a manufacturer
            warranty. Manufacturer warranty terms and remedies vary. Nova Lighting may provide reasonable
            assistance with a properly documented claim but does not control the manufacturer's investigation,
            decision, remedy, timing, or availability of parts or replacements.
          </p>
        </Section>

        <Section number="13" title="Fraud and Abuse">
          <p>
            Nova Lighting may deny a return or suspend return privileges if it reasonably determines that a
            request involves fraud, abuse, substituted merchandise, altered serial numbers, false damage claims,
            repeated policy manipulation, or a violation of the Terms. This section does not limit legitimate
            consumer, warranty, or payment-card rights.
          </p>
        </Section>

        <Section number="14" title="Contact">
          <p>
            Return and cancellation requests should be directed to{" "}
            <a href="mailto:info@novalighting.com" className="underline underline-offset-4 hover:text-muted-foreground">
              info@novalighting.com
            </a>{" "}
            or{" "}
            <a href="tel:+18012254459" className="underline underline-offset-4 hover:text-muted-foreground">
              801-225-4459
            </a>
            . Include all information required in Section 2. Returns must be sent only to the address provided
            in the RGA.
          </p>
        </Section>
      </article>
    </div>
  );
};

export default ReturnPolicyPage;
