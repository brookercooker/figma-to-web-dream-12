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

const ShippingPolicyPage = () => {
  useEffect(() => {
    document.title = "Shipping Policy | Nova Lighting";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Nova Lighting Shipping Policy: shipping methods, lead times, delivery charges, freight and parcel delivery, inspection and damage claims, risk of loss, and pickup.",
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
            Shipping Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            NOVA LIGHTING, INC. d/b/a Nova Lighting
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: August 13, 2026 Version: 1.0</p>
        </header>

        <Section number="1" title="Scope and Relationship to Other Terms">
          <p>
            This Shipping Policy applies to products purchased from Nova Lighting through the Site or through a
            quote, order, or trade-account transaction that incorporates this Policy. The Terms of Use and
            Conditions of Sale and the Return Policy are incorporated by reference. A transaction-specific
            written quote or agreement controls to the extent it expressly conflicts with this Policy.
          </p>
        </Section>

        <Section number="2" title="Shipping Area and Available Methods">
          <p>
            Nova Lighting ships within the United States to locations and by methods available for the
            particular product and destination. Some products cannot be shipped to P.O. boxes, APO/FPO
            addresses, Alaska, Hawaii, U.S. territories, or locations outside the contiguous United States.
            Contact Nova Lighting for availability and a separate quote for those destinations.
          </p>
          <p>
            Orders may ship by parcel carrier, less-than-truckload freight, dedicated carrier, local delivery,
            manufacturer drop shipment, or another method identified at checkout or in the applicable quote.
            Expedited, inside, room-of-choice, white-glove, liftgate, limited-access, and appointment services
            are provided only if specifically purchased or confirmed in writing.
          </p>
        </Section>

        <Section number="3" title="Processing Times, Lead Times, and Delays">
          <p>
            Processing times, production times, estimated ship dates, transit times, delivery dates, and
            appointment windows are estimates unless Nova Lighting expressly guarantees a date in a signed
            writing. Many lighting products are manufactured, finished, allocated, or ordered from a
            manufacturer after an order is placed.
          </p>
          <p>
            Nova Lighting will provide available updates concerning material delays. For an order subject to
            the Federal Trade Commission's Mail, Internet, or Telephone Order Merchandise Rule, if Nova
            Lighting cannot ship within the promised or legally applicable time, Nova Lighting will request the
            customer's consent to the delay or cancel and refund the unshipped merchandise as required by law.
          </p>
          <p>
            Do not schedule electricians, installers, inspections, demolition, construction, or dependent work
            until all products have arrived and have been inspected for quantity, identity, condition,
            dimensions, compatibility, and completeness.
          </p>
        </Section>

        <Section number="4" title="Shipping and Delivery Charges">
          <p>
            Applicable shipping, freight, handling, delivery, and accessorial charges will be displayed at
            checkout, included in the accepted quote, or communicated for approval before shipment. Promotional
            or free-shipping offers apply only according to their stated conditions and may exclude freight,
            oversized, expedited, remote-area, special-order, and project shipments.
          </p>
          <p>
            The customer is responsible for additional charges caused by an incorrect or incomplete address,
            address changes after release, missed appointments, refused non-damaged merchandise, inaccessible
            delivery locations, required special equipment or services not disclosed in advance, storage,
            redelivery, or return to sender, except to the extent caused by Nova Lighting or prohibited by law.
          </p>
        </Section>

        <Section number="5" title="Partial Shipments and Manufacturer Fulfillment">
          <p>
            Nova Lighting may ship an order in separate packages or from multiple Nova Lighting, manufacturer,
            or distributor locations. Separate shipments may arrive on different dates and may have different
            tracking information. Unless otherwise stated, a partial shipment does not entitle the customer to
            cancel products that have been accepted, released, produced, or shipped.
          </p>
        </Section>

        <Section number="6" title="Address Changes and Order Changes">
          <p>
            Verify the delivery address, contact information, quantities, finishes, and product numbers before
            submitting an order. A requested change is not effective until Nova Lighting confirms it in
            writing. Once an order has been released to a manufacturer or carrier, changes may be unavailable
            and may result in cancellation, rerouting, storage, redelivery, or other charges.
          </p>
        </Section>

        <Section number="7" title="Parcel Deliveries">
          <p>
            Parcel deliveries ordinarily will be made to the address provided with the order. Carrier scans,
            photographs, signatures, and delivery records may be used as evidence of delivery. If a package is
            shown as delivered but cannot be located, promptly check the delivery area and contact both the
            carrier and Nova Lighting.
          </p>
        </Section>

        <Section number="8" title="Freight and Oversized Deliveries">
          <p>
            Unless a different service is expressly purchased, freight delivery is curbside to the first safe,
            accessible location at the delivery address. It does not include unpacking, assembly, installation,
            debris removal, placement inside a building or room, or movement over stairs, elevators, narrow
            access points, unfinished surfaces, or other obstacles.
          </p>
          <p>
            The customer must provide accurate site information, ensure lawful and safe access for the carrier
            and equipment, and have an adult available during the delivery appointment. Before signing the
            delivery receipt, inspect the shipment and packaging, count the pieces, and note visible damage or
            shortages on the carrier's delivery record. Refuse delivery only when damage is substantial or the
            carrier or Nova Lighting directs refusal.
          </p>
        </Section>

        <Section number="9" title="Inspection; Damage, Shortage, and Error Reports">
          <p>
            Inspect every product promptly after delivery or pickup and before assembly or installation. Keep
            the product, carton, pallet, packing materials, labels, and delivery records until the claim is
            resolved. Photograph the exterior packaging, shipping label, affected product, damage, model or
            serial number, and all included parts.
          </p>
          <p>
            For consumer orders, report visible or concealed shipping damage, shortages, or incorrect products
            as soon as reasonably possible, preferably within two business days and no later than five calendar
            days after delivery. A delay may impair available carrier or manufacturer remedies but does not
            waive rights that cannot lawfully be waived.
          </p>
          <p>
            For commercial, wholesale, trade, contractor, designer, builder, or project orders, written notice
            must be received within two business days for visible damage or shortage and within five calendar
            days for concealed damage or error. Failure to give timely notice may constitute acceptance and may
            bar a shipping claim to the extent permitted by law, but does not eliminate a properly preserved
            manufacturer-warranty claim for a latent defect.
          </p>
          <p>
            Do not install or alter a product that appears damaged, incomplete, incorrect, or incompatible.
            Installation, wire cutting, assembly, modification, disposal of packaging, or continued use may
            impair the ability to obtain a carrier or manufacturer remedy.
          </p>
        </Section>

        <Section number="10" title="Risk of Loss and Title">
          <p>
            For a purchase primarily for personal, family, or household use, title and risk of loss pass when
            the product is delivered to the designated delivery address or picked up by the customer or the
            customer's authorized representative, subject to applicable law.
          </p>
          <p>
            For a commercial, wholesale, trade, contractor, designer, builder, or project order, unless the
            accepted quote expressly states otherwise, delivery is F.O.B. the applicable Nova Lighting,
            manufacturer, or distributor shipping point, and title and risk of loss pass when the product is
            tendered to the carrier. Nova Lighting will provide reasonable cooperation with a timely carrier
            claim, but such cooperation does not reallocate risk of loss.
          </p>
        </Section>

        <Section number="11" title="Refused, Missed, or Undeliverable Shipments">
          <p>
            Refusal of non-damaged merchandise, a missed delivery appointment, an inaccessible site, or failure
            to accept delivery does not cancel the order. The customer may be responsible for storage,
            detention, redelivery, return freight, and related charges. If merchandise is returned to Nova
            Lighting or a manufacturer, any refund or credit is subject to the Return Policy and the product's
            return eligibility.
          </p>
        </Section>

        <Section number="12" title="Customer Pickup">
          <p>
            Pickup orders are available only after Nova Lighting confirms that the order is ready. The person
            picking up the order may be required to present identification and order information. Risk of loss
            passes at pickup as stated above. The customer should inspect packaging and count items before
            leaving the pickup location.
          </p>
        </Section>

        <Section number="13" title="Contact">
          <p>
            Questions or shipping claims should be directed to{" "}
            <a
              href="mailto:info@novalighting.com"
              className="underline underline-offset-4 hover:text-muted-foreground"
            >
              info@novalighting.com
            </a>{" "}
            or{" "}
            <a href="tel:+18012254459" className="underline underline-offset-4 hover:text-muted-foreground">
              801-225-4459
            </a>
            . Include the purchaser's name, order or invoice number, delivery date, affected item number,
            description of the issue, and photographs and carrier documents described above.
          </p>
        </Section>
      </article>
    </div>
  );
};

export default ShippingPolicyPage;
