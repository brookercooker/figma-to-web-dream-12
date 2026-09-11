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

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-sans text-base font-semibold text-foreground pt-2">{children}</h3>
);

const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc space-y-3 pl-6">{children}</ul>
);

const OL = ({ children }: { children: React.ReactNode }) => (
  <ol className="list-decimal space-y-3 pl-6">{children}</ol>
);

const linkCls =
  "underline underline-offset-4 hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

const LegalEmail = () => (
  <a href="mailto:info@novalighting.com" className={linkCls}>
    info@novalighting.com
  </a>
);

const TermsConditionsPage = () => {
  useEffect(() => {
    document.title = "Terms of Use and Conditions of Sale | Nova Lighting";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Nova Lighting Terms of Use and Conditions of Sale: site use, accounts, orders, pricing, shipping, warranties, limitations of liability, arbitration, and governing law.",
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
            Terms of Use and Conditions of Sale
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            NOVA LIGHTING, INC. d/b/a Nova Lighting
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: August 13, 2026 Version: 1.0</p>
        </header>

        <section aria-labelledby="important-notice" className="mt-12">
          <h2
            id="important-notice"
            className="font-serif text-2xl sm:text-3xl font-light text-foreground tracking-[-0.01em]"
          >
            Important Notice
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground">
            <p>
              These Terms of Use and Conditions of Sale contain important provisions governing your legal
              rights, including limitations of liability, disclaimers of warranties, an agreement to resolve
              most disputes through individual binding arbitration, and a waiver of class-action and jury-trial
              rights.
            </p>
            <p>
              Please read these Terms carefully before using this website, creating an account, submitting
              information, requesting a consultation, or purchasing products.
            </p>
          </div>
        </section>

        <Section number="1" title="Acceptance of These Terms">
          <p>
            These Terms of Use and Conditions of Sale, referred to as the "Terms," constitute a legally binding
            agreement between you and NOVA LIGHTING, INC., a Utah corporation, doing business as Nova Lighting,
            together with its affiliates, subsidiaries, successors, and authorized representatives, collectively
            referred to as "Nova Lighting," "Nova," "we," "us," or "our."
          </p>
          <p>These Terms govern:</p>
          <OL>
            <li>
              Your access to and use of NovaLighting.com and any related webpages, online catalogs, customer
              portals, applications, content, features, and services that link to these Terms, collectively
              referred to as the "Site";
            </li>
            <li>The creation and use of customer accounts and wishlists;</li>
            <li>
              Requests for consultations, quotes, product information, or other assistance through the Site;
            </li>
            <li>Purchases made through the Site; and</li>
            <li>
              Any showroom, telephone, email, designer, contractor, builder, trade-account, or other
              transaction, quote, receipt, order, or agreement that expressly incorporates these Terms.
            </li>
          </OL>
          <p>
            By creating an account, checking an unchecked box that conspicuously
            links to these Terms, submitting an order through a process that clearly
            states your action constitutes acceptance, or otherwise affirmatively agreeing to these Terms, you
            acknowledge that you have read, understood, and agreed to be bound by them. Mere access to or use of
            the Site constitutes agreement only to the Site-use provisions to the extent enforceable and does
            not, by itself, establish assent to the arbitration agreement or Conditions of Sale.
          </p>
          <p>If you do not agree to these Terms, do not use the Site, create an account, or submit an order.</p>
        </Section>

        <Section number="2" title="Eligibility and Authority">
          <p>
            You must be at least 18 years old and legally capable of entering into a binding agreement to use
            the Site or place an order.
          </p>
          <p>
            If you use the Site or make a purchase on behalf of a company, contractor, designer, builder,
            property owner, trust, organization, or other person or entity, you represent and warrant that you
            have authority to bind that person or entity to these Terms. In that circumstance, the words "you"
            and "your" include both you individually and the person or entity on whose behalf you are acting.
          </p>
          <p>
            The Site is intended for a general adult audience and is not directed to children under 13.
          </p>
        </Section>

        <Section number="3" title="Changes to These Terms">
          <p>We may revise these Terms periodically.</p>
          <p>
            The revised Terms will be posted on the Site with an updated effective date. Unless otherwise
            stated, revised Terms apply prospectively from the date they are posted and do not retroactively
            change the terms governing a previously completed purchase.
          </p>
          <p>
            When required by law, we will provide additional notice of material changes. Your continued use of
            the Site after revised Terms become effective constitutes acceptance of the revised Terms to the
            extent permitted by law. A material revision to the arbitration agreement, class-action waiver,
            liability cap, or claim-limitation period will not apply to a previously created account or accepted
            order without the notice and affirmative assent required by applicable law.
          </p>
          <p>
            The version in effect when you submit an order will ordinarily govern that order unless a separate
            written agreement expressly provides otherwise.
          </p>
        </Section>

        <Section number="4" title="Related Policies">
          <p>
            Our Privacy Policy, Shipping Policy, Return Policy, warranty information, product-specific terms,
            promotional terms, and other transactional policies made available through the Site are incorporated
            into these Terms by reference. Our Privacy Policy is a separate notice of information practices and
            is not incorporated herein as a contractual term except to the extent expressly stated or required
            by law.
          </p>
          <p>
            A subject-specific policy will control with respect to the particular subject it addresses. These
            Terms will control on all other matters, including dispute resolution, limitations of liability,
            intellectual property, and acceptable use, unless another policy expressly states that it supersedes
            a particular provision of these Terms.
          </p>
          <p>
            A separate written agreement signed or expressly approved by an authorized Nova Lighting
            representative will control over these Terms to the extent of a direct conflict.
          </p>
        </Section>

        <Section number="5" title="Privacy">
          <p>
            Our collection, use, storage, and disclosure of personal information are described in our{" "}
            <a href="/privacy-policy" className={linkCls}>
              Privacy Policy
            </a>
            .
          </p>
          <p>
            By using the Site, you acknowledge that information you provide will be handled as described in the
            Privacy Policy. The Privacy Policy is a notice of our information practices and does not create
            contractual rights beyond those provided by applicable law.
          </p>
          <p>
            You are responsible for ensuring that any personal information you provide is accurate and that you
            have authority to provide it.
          </p>
        </Section>

        <Section number="6" title="Electronic Communications and Records">
          <p>
            By using the Site, creating an account, requesting information, or submitting an order, you consent
            to receive transaction-related communications electronically, including by email, through your
            account, or through notices posted on the Site.
          </p>
          <p>
            Electronic communications may include order confirmations, invoices, receipts, shipping information,
            product notices, policy updates, and other records relating to your transaction.
          </p>
          <p>
            You agree that electronic communications and records that are capable of being retained by you
            satisfy any legal requirement that the communication or record be in writing, to the extent
            permitted by law. You should download or print a copy of the Terms and policies governing each order
            or transaction.
          </p>
          <p>
            This consent does not constitute consent to receive promotional text messages or automated marketing
            communications where separate consent is required by law.
          </p>
          <p>
            You are responsible for maintaining a current email address and reviewing communications we send
            regarding your account or orders.
          </p>
        </Section>

        <Section number="7" title="Customer Accounts">
          <p>Certain Site features may require a customer account.</p>
          <p>When creating or using an account, you agree to:</p>
          <OL>
            <li>Provide accurate, current, and complete information;</li>
            <li>Promptly update information that changes;</li>
            <li>Maintain the confidentiality of your username and password;</li>
            <li>Prevent unauthorized access to your account; and</li>
            <li>Notify us promptly if you suspect unauthorized use or a security breach.</li>
          </OL>
          <p>You may not share, sell, transfer, or assign your account without our written permission.</p>
          <p>
            You are responsible for activity occurring through your account before you notify us of unauthorized
            access, except to the extent applicable law provides otherwise.
          </p>
          <p>
            We may suspend, restrict, or terminate an account if we reasonably believe that it has been
            compromised, is being used unlawfully, violates these Terms, or presents a risk to Nova Lighting, our
            customers, or another person.
          </p>
        </Section>

        <Section number="8" title="Permitted Use of the Site">
          <p>
            Subject to these Terms, Nova Lighting grants you a limited, revocable, nonexclusive,
            nontransferable license to access and use the Site for lawful personal or internal business purposes
            relating to researching or purchasing products from Nova Lighting.
          </p>
          <p>This license does not transfer ownership of any Site content or intellectual property.</p>
        </Section>

        <Section number="9" title="Prohibited Conduct">
          <p>You may not, directly or through another person or automated system:</p>
          <OL>
            <li>Use the Site for unlawful, fraudulent, deceptive, abusive, or harmful purposes;</li>
            <li>Violate any applicable law, regulation, code, court order, or third-party right;</li>
            <li>
              Attempt to gain unauthorized access to an account, system, server, database, network, or
              restricted portion of the Site;
            </li>
            <li>
              Circumvent authentication, security, rate-limit, access-control, or technological protection
              measures;
            </li>
            <li>Introduce malware, viruses, malicious code, corrupted data, or other harmful materials;</li>
            <li>Interfere with the security, operation, availability, or performance of the Site;</li>
            <li>
              Conduct vulnerability scanning, penetration testing, denial-of-service activity, or security
              testing without our prior written authorization;
            </li>
            <li>
              Scrape, crawl, spider, harvest, index, download, extract, copy, or systematically collect Site
              content or product data through automated means without our written permission;
            </li>
            <li>
              Use Site content or data to create or enhance a competing product catalog, database, marketplace,
              pricing service, or commercial service;
            </li>
            <li>
              Use Site content to train, develop, benchmark, validate, or improve an artificial-intelligence or
              machine-learning system without our written permission;
            </li>
            <li>
              Reverse engineer, decompile, disassemble, or attempt to discover source code underlying the Site;
            </li>
            <li>
              Copy, reproduce, modify, distribute, sell, license, publicly display, republish, frame, mirror, or
              create derivative works from the Site or its content except as expressly permitted;
            </li>
            <li>Remove copyright, trademark, attribution, or proprietary notices;</li>
            <li>
              Impersonate another person or misrepresent your identity, authority, affiliation, or intentions;
            </li>
            <li>
              Submit false reviews, fraudulent orders, inaccurate payment information, or misleading content;
            </li>
            <li>Use another person's payment method or account without authorization;</li>
            <li>Engage in unauthorized resale, diversion, export, or distribution of products;</li>
            <li>
              Use the Site in a manner that imposes an unreasonable or disproportionately large load on our
              systems; or
            </li>
            <li>Encourage or assist another person in doing any of these things.</li>
          </OL>
          <p>
            We may investigate suspected violations and cooperate with law enforcement, payment processors,
            manufacturers, carriers, courts, regulators, or other appropriate parties.
          </p>
        </Section>

        <Section number="10" title="Ownership and Intellectual Property">
          <p>
            The Site and its content, including text, graphics, photographs, product displays, videos, layouts,
            designs, icons, software, databases, compilations, logos, trade dress, and other materials, are
            owned by, licensed to, or otherwise lawfully used by Nova Lighting and are protected by applicable
            intellectual-property laws.
          </p>
          <p>
            "Nova Lighting," associated logos, slogans, designs, and other source identifiers are used by Nova
            Lighting as trade names, trademarks, service marks, or trade dress. Nova Lighting reserves all
            rights it may have in those identifiers under applicable law, subject to any rights held by third
            parties. Nothing in these Terms constitutes a representation that any such identifier is federally
            or state registered, exclusively owned by Nova Lighting, or free from the rights or claims of
            another person. No right to use any trademark, service mark, logo, trade name, or trade dress is
            granted without prior written permission from the person holding the applicable rights.
          </p>
          <p>
            Product names, manufacturer names, photographs, descriptions, trademarks, and logos appearing on the
            Site may belong to their respective manufacturers or other third parties. Nova Lighting's use of
            third-party names and marks is for identification and informational purposes and does not imply
            ownership, sponsorship, endorsement, or affiliation except as expressly stated. All rights of third
            parties in their respective intellectual property are acknowledged and reserved.
          </p>
        </Section>

        <Section number="11" title="Product Information and Website Accuracy">
          <p>
            We make reasonable efforts to present helpful and accurate product information. However, much of the
            product information on the Site is supplied by manufacturers, distributors, data providers, or other
            third parties.
          </p>
          <p>
            Product information may contain errors, omissions, delays, or outdated information. We do not
            warrant that product descriptions, photographs, pricing, availability, specifications, dimensions,
            weights, finishes, colors, materials, lead times, ratings, certifications, instructions,
            compatibility information, or other Site content are complete, current, or error-free.
          </p>
          <p>
            We reserve the right to correct information at any time, including after an order is submitted.
          </p>

          <SubHeading>Product images and appearance</SubHeading>
          <p>
            Photographs and digital renderings are provided for general reference. Actual products may differ in
            color, tone, texture, sheen, scale, proportion, pattern, finish, or appearance because of:
          </p>
          <UL>
            <li>Screen and device settings;</li>
            <li>Photography and lighting conditions;</li>
            <li>Manufacturing tolerances;</li>
            <li>Product revisions;</li>
            <li>Hand-finishing;</li>
            <li>Natural variation in wood, stone, alabaster, glass, leather, fabric, or metal;</li>
            <li>Aging, patina, oxidation, or exposure to environmental conditions; and</li>
            <li>Differences among production runs.</li>
          </UL>
          <p>Such variations do not necessarily constitute defects.</p>

          <SubHeading>Dimensions, specifications, and rough-in requirements</SubHeading>
          <p>
            You must verify current dimensions, weights, mounting requirements, electrical requirements, cutout
            measurements, clearances, canopy sizes, junction-box locations, structural requirements, lamping,
            controls, and compatibility information before ordering, construction, rough-in, cabinetry, wiring,
            installation, or modification of property.
          </p>
          <p>
            Do not rely solely on a photograph, general description, preliminary specification, or prior version
            of a manufacturer's document for construction or installation decisions.
          </p>
          <p>
            Whenever measurements or compatibility are important, obtain and review the manufacturer's current
            specification sheet and installation instructions and confirm the actual product before completing
            permanent construction.
          </p>

          <SubHeading>Photometric and performance information</SubHeading>
          <p>
            Lumen output, wattage, color temperature, color-rendering index, beam spread, estimated life, energy
            usage, dimming performance, airflow, motor performance, ratings, certifications, and similar
            information are generally based on manufacturer-supplied data and testing conditions.
          </p>
          <p>
            Actual performance may vary based on installation, voltage, controls, lamps, drivers, environmental
            conditions, room finishes, maintenance, and other factors.
          </p>
        </Section>

        <Section number="12" title="Product Selection, Design Assistance, and Professional Advice">
          <p>
            Unless services are provided under a separate written professional-services agreement, information
            and recommendations provided through the Site or by Nova Lighting personnel are general
            product-selection assistance only.
          </p>
          <p>
            They are not a substitute for the judgment of a licensed electrician, architect, engineer,
            contractor, interior designer, building-code professional, or other qualified professional familiar
            with your specific property and project.
          </p>
          <p>You and your professional advisers are responsible for determining:</p>
          <OL>
            <li>Whether a product is appropriate for its intended location and use;</li>
            <li>Required quantities and dimensions;</li>
            <li>
              Compatibility with existing wiring, controls, dimmers, lamps, transformers, drivers, junction
              boxes, mounting systems, and building components;
            </li>
            <li>Necessary structural support and clearances;</li>
            <li>
              Compliance with electrical, fire, energy, accessibility, building, zoning, and other applicable
              codes;
            </li>
            <li>
              Whether a product is properly rated for wet, damp, dry, exterior, coastal, marine, hazardous, or
              other conditions;
            </li>
            <li>Whether permits, inspections, approvals, or professional services are required; and</li>
            <li>Whether installation can be safely completed.</li>
          </OL>
          <p>
            No oral statement, estimate, recommendation, rendering, or informal communication creates a warranty
            or modifies an order unless it is expressly included in a written agreement or order confirmation
            authorized by Nova Lighting.
          </p>
        </Section>

        <Section number="13" title="Electrical and Installation Safety">
          <p>
            Lighting fixtures, ceiling fans, controls, electrical components, and related products can create
            risks of electrical shock, fire, property damage, serious injury, or death if improperly selected,
            assembled, modified, supported, installed, used, or maintained.
          </p>
          <p>Products must be installed and used:</p>
          <UL>
            <li>In accordance with the manufacturer's current instructions and warnings;</li>
            <li>By appropriately qualified and licensed professionals where required or advisable;</li>
            <li>With electrical power properly disconnected;</li>
            <li>Using appropriate structural support and approved electrical components;</li>
            <li>In compliance with applicable codes, permits, and inspection requirements; and</li>
            <li>Only in environments and applications for which the product is rated.</li>
          </UL>
          <p>
            Do not install a product that appears damaged, incomplete, incorrect, incompatible, or different
            from what was ordered. Contact Nova Lighting before installation.
          </p>
          <p>
            Installation, assembly, cutting wires, clipping wires, altering components, discarding packaging, or
            modifying a product may affect return eligibility and warranty coverage.
          </p>
          <p>
            Unless Nova Lighting has expressly agreed in a separate written contract to provide installation
            services, Nova Lighting is acting solely as a product retailer and is not responsible for
            installation, construction, electrical work, structural work, code compliance, permitting,
            inspection, or the acts or omissions of independent contractors.
          </p>
        </Section>

        <Section number="14" title="Orders and Contract Formation">
          <p>
            Product listings, advertisements, quotes, shopping-cart contents, and order summaries are
            invitations to submit an order and are not binding offers by Nova Lighting.
          </p>
          <p>Your submission of an order constitutes an offer to purchase the identified products under these Terms.</p>
          <p>
            An automated acknowledgment, payment authorization, or order number confirms only that we received
            your order. It does not necessarily constitute acceptance.
          </p>
          <p>
            We may accept an order by sending an express acceptance or shipping, releasing, or making the
            product available for pickup. We may decline or cancel an order before acceptance for any lawful
            reason, including:
          </p>
          <UL>
            <li>Product unavailability;</li>
            <li>Manufacturer discontinuation;</li>
            <li>Pricing, description, or data errors;</li>
            <li>Suspected fraud or unauthorized payment;</li>
            <li>Quantity limitations;</li>
            <li>Shipping restrictions;</li>
            <li>Manufacturer or distribution restrictions;</li>
            <li>Suspected unauthorized resale or diversion;</li>
            <li>Inability to verify information;</li>
            <li>Technical errors; or</li>
            <li>Circumstances beyond our reasonable control.</li>
          </UL>
          <p>
            If we cancel an order after collecting payment, we will refund the applicable amount to the original
            payment method unless another method is required or agreed upon.
          </p>
        </Section>

        <Section number="15" title="Prices, Promotions, Taxes, and Payment">
          <p>Prices and promotions may change without notice before an order is accepted.</p>
          <p>
            Prices shown on the Site may differ from showroom, trade, contractor, designer, negotiated, project,
            or manufacturer-specific pricing. Unless expressly stated, prices do not include sales tax, use tax,
            shipping, handling, delivery, storage, installation, permit, disposal, or other charges.
          </p>
          <p>
            You are responsible for all applicable taxes and charges associated with your order, except taxes
            imposed on Nova Lighting's net income.
          </p>
          <p>
            Promotional offers, coupons, discounts, rebates, free-shipping offers, and special pricing are
            subject to their stated conditions and may not be combined unless expressly permitted.
          </p>
          <p>
            We may correct pricing, calculation, discount, or typographical errors before accepting an order. If
            an accepted order contains a material pricing error, we may contact you for approval of the
            corrected price or cancel and refund the affected portion of the order, to the extent permitted by
            law.
          </p>
          <p>By providing payment information, you represent that:</p>
          <OL>
            <li>The information is accurate;</li>
            <li>You are authorized to use the payment method;</li>
            <li>Charges incurred by you may be submitted for authorization and payment; and</li>
            <li>You will pay all authorized amounts associated with the order.</li>
          </OL>
          <p>A temporary authorization hold may differ from the final charge.</p>
        </Section>

        <Section number="16" title="Availability, Backorders, and Lead Times">
          <p>
            Inventory status, availability, manufacturing time, processing time, estimated ship dates, delivery
            dates, and lead times are estimates only and may be based on information supplied by manufacturers,
            distributors, or carriers.
          </p>
          <p>
            They are not guarantees unless Nova Lighting expressly states otherwise in a signed writing. For an
            order subject to the Federal Trade Commission's Mail, Internet, or Telephone Order Merchandise Rule,
            if we cannot ship within the promised or legally applicable time, we will request your consent to
            the delay or cancel and refund the unshipped merchandise as required by law.
          </p>
          <p>
            Production delays, supply-chain issues, carrier delays, weather, labor disruptions, customs issues,
            allocation decisions, manufacturer changes, backorders, and other circumstances may affect delivery.
          </p>
          <p>
            Do not schedule electricians, installers, contractors, inspections, construction, demolition, or
            other dependent services until all required products have arrived and have been inspected for
            correctness, completeness, condition, and compatibility.
          </p>
          <p>
            Except to the extent expressly agreed in a signed writing, Nova Lighting is not responsible for
            labor charges, contractor fees, lost time, project delays, financing costs, storage costs,
            substitute-product costs, missed appointments, liquidated damages, or other losses arising from
            manufacturing, shipping, delivery, or availability delays.
          </p>
        </Section>

        <Section number="17" title="Shipping, Delivery, and Pickup">
          <p>
            Shipping, freight, delivery, inspection, pickup, damage-reporting, title, and risk-of-loss related
            requirements are governed by the{" "}
            <a href="/shipping-policy" className={linkCls}>
              Shipping Policy
            </a>{" "}
            and{" "}
            <a href="/return-policy" className={linkCls}>
              Return Policy
            </a>{" "}
            in effect when the order is placed. Unless an accepted order states otherwise, risk of loss for a
            Consumer Order passes upon delivery to the designated address, while a commercial, wholesale, trade,
            contractor, designer, builder, or project order is F.O.B. the applicable shipping point and risk of
            loss passes when the product is tendered to the carrier, in each case subject to applicable law.
          </p>
          <p>Delivery dates and appointment windows are estimates.</p>
          <p>For curbside or freight deliveries, you are responsible for:</p>
          <UL>
            <li>Providing accurate contact and delivery information;</li>
            <li>Ensuring reasonable and lawful delivery access;</li>
            <li>Being available during the delivery window;</li>
            <li>Inspecting the shipment and packaging;</li>
            <li>Recording visible damage or shortages on the carrier's delivery documents; and</li>
            <li>Promptly reporting damage, shortages, or errors as required by the applicable policy.</li>
          </UL>
          <p>
            Additional carrier, storage, redelivery, address-correction, return-freight, accessorial, or similar
            charges resulting from inaccurate information, missed appointments, refusal of non-damaged
            merchandise, inaccessible locations, or failure to accept delivery may be charged to you to the
            extent permitted by law.
          </p>
          <p>Nothing in this section eliminates rights that cannot legally be waived.</p>
        </Section>

        <Section number="18" title="Inspection and Notification">
          <p>You must inspect products promptly after delivery or pickup and before installation.</p>
          <p>You must notify Nova Lighting of:</p>
          <UL>
            <li>Visible shipping damage;</li>
            <li>Concealed damage;</li>
            <li>Missing components;</li>
            <li>Incorrect products;</li>
            <li>Quantity discrepancies;</li>
            <li>Manufacturing defects; or</li>
            <li>Other problems</li>
          </UL>
          <p>
            within the period and using the procedures stated in the Shipping Policy, Return Policy,
            manufacturer warranty, or applicable law. A stated reporting period may affect carrier or
            manufacturer remedies, but it does not eliminate a consumer right that cannot lawfully be waived.
          </p>
          <p>
            Prompt notice allows Nova Lighting and the applicable carrier or manufacturer to investigate and
            preserve available remedies.
          </p>
          <p>
            Failure to inspect, preserve packaging, document damage, or provide timely notice may impair or
            eliminate remedies available from the carrier or manufacturer, except where applicable law provides
            otherwise.
          </p>
        </Section>

        <Section number="19" title="Cancellations, Returns, and Refunds">
          <p>
            Cancellations, returns, restocking charges, return freight, nonreturnable products, custom products,
            clearance merchandise, installed or modified products, damaged products, defective products,
            refunds, credits, and Return Goods Authorizations are governed by the Return Policy in effect at the
            time of purchase.
          </p>
          <p>
            Submitting a cancellation request does not guarantee that an order can be canceled. Products that
            have entered production, been released by a manufacturer, or shipped may not be cancelable.
          </p>
          <p>
            Refunds will ordinarily be issued to the original payment method, subject to applicable policies,
            processing times, deductions, and legal requirements.
          </p>
          <p>
            You may not initiate a knowingly false, fraudulent, or duplicative chargeback. Nothing in these
            Terms prevents you from exercising legitimate rights under applicable payment-card or
            consumer-protection laws.
          </p>
        </Section>

        <Section number="20" title="Manufacturer Warranties">
          <p>Products may be covered by warranties offered by their manufacturers.</p>
          <p>
            Manufacturer warranties are provided by the applicable manufacturer, not by Nova Lighting, unless
            Nova Lighting expressly identifies itself in writing as the warrantor.
          </p>
          <p>
            Warranty terms, exclusions, registration requirements, claim procedures, repair obligations,
            replacement obligations, labor coverage, shipping responsibilities, and available remedies vary by
            manufacturer and product.
          </p>
          <p>
            To the extent available and transferable, Nova Lighting will pass through applicable manufacturer
            warranty rights to the original purchaser and may provide reasonable assistance with a manufacturer
            claim. Nova Lighting does not control and is not responsible for a manufacturer's investigation,
            decision, performance, insolvency, discontinuation, replacement availability, or warranty
            administration.
          </p>
          <p>
            Any manufacturer statement or warranty does not become a separate warranty by Nova Lighting merely
            because it appears on the Site, is provided with a product, or is communicated by Nova Lighting.
          </p>
          <p>Written consumer-product warranties should be reviewed before purchase.</p>
        </Section>

        <Section number="21" title="Disclaimer of Warranties">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SITE, SITE CONTENT, SERVICES, INFORMATION,
            RECOMMENDATIONS, AND PRODUCTS ARE PROVIDED "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS." EXCEPT
            FOR ANY EXPRESS WRITTEN WARRANTY PROVIDED DIRECTLY BY NOVA LIGHTING, NOVA LIGHTING DISCLAIMS ALL
            WARRANTIES AND CONDITIONS, EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING THE IMPLIED
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY,
            QUIET ENJOYMENT, AND WARRANTIES ARISING FROM COURSE OF DEALING, COURSE OF PERFORMANCE, USAGE,
            SAMPLE, MODEL, DESCRIPTION, OR TRADE PRACTICE. IF NOVA LIGHTING PROVIDES A WRITTEN WARRANTY OR
            ENTERS INTO A SERVICE CONTRACT FOR A CONSUMER PRODUCT, THIS DISCLAIMER WILL NOT APPLY TO IMPLIED
            WARRANTIES TO THE EXTENT PROHIBITED BY THE MAGNUSON-MOSS WARRANTY ACT OR OTHER APPLICABLE LAW.
          </p>
          <p>NOVA LIGHTING DOES NOT WARRANT THAT:</p>
          <UL>
            <li>THE SITE WILL BE AVAILABLE, SECURE, UNINTERRUPTED, OR ERROR-FREE;</li>
            <li>DEFECTS OR ERRORS WILL BE CORRECTED;</li>
            <li>THE SITE OR ITS SERVERS WILL BE FREE OF VIRUSES OR HARMFUL COMPONENTS;</li>
            <li>PRODUCT INFORMATION WILL ALWAYS BE COMPLETE, CURRENT, OR ACCURATE;</li>
            <li>A PRODUCT WILL BE SUITABLE FOR YOUR PARTICULAR PROJECT OR LOCATION;</li>
            <li>PRODUCTS WILL APPEAR EXACTLY AS SHOWN ON A SCREEN;</li>
            <li>PRODUCTS WILL BE AVAILABLE OR DELIVERED BY AN ESTIMATED DATE; OR</li>
            <li>MANUFACTURERS, CARRIERS, CONTRACTORS, OR OTHER THIRD PARTIES WILL PERFORM THEIR OBLIGATIONS.</li>
          </UL>
          <p>
            Some jurisdictions do not allow certain warranty exclusions. In those jurisdictions, these
            exclusions apply only to the maximum extent permitted by law.
          </p>
          <p>Nothing in these Terms disclaims a warranty or consumer right that cannot lawfully be disclaimed.</p>
        </Section>

        <Section number="22" title="Exclusive or Limited Remedies">
          <p>
            To the maximum extent permitted by law and subject to applicable manufacturer warranties and
            consumer rights, Nova Lighting's obligation concerning a product claim will be limited, at Nova
            Lighting's option, to one or more of the following:
          </p>
          <OL>
            <li>Assisting with a manufacturer warranty claim;</li>
            <li>Repairing the affected product;</li>
            <li>Replacing the affected product or component;</li>
            <li>Accepting an authorized return;</li>
            <li>Issuing store credit; or</li>
            <li>Refunding the amount paid to Nova Lighting for the affected product.</li>
          </OL>
          <p>
            The specific remedy will be determined under the applicable Return Policy, manufacturer warranty,
            written sales agreement, and governing law.
          </p>
          <p>
            Nova Lighting is not responsible for removal, disassembly, installation, reinstallation,
            refinishing, construction, repair to surrounding property, electrician charges, contractor charges,
            equipment rental, scaffolding, lift charges, travel, lost labor, or similar expenses unless Nova
            Lighting expressly agreed in writing to pay them or applicable law requires otherwise.
          </p>
        </Section>

        <Section number="23" title="Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOVA LIGHTING AND ITS AFFILIATES, PREDECESSORS, SUCCESSORS,
            OWNERS, DIRECTORS, OFFICERS, EMPLOYEES, REPRESENTATIVES, AGENTS, SERVICE PROVIDERS, LICENSORS,
            SUPPLIERS, AND CONTRACTORS, COLLECTIVELY THE "NOVA PARTIES," WILL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES.
          </p>
          <p>This exclusion includes damages arising from or relating to:</p>
          <UL>
            <li>Loss of profits, revenue, business, goodwill, opportunities, anticipated savings, or contracts;</li>
            <li>Loss, corruption, disclosure, or interruption of data;</li>
            <li>Business interruption;</li>
            <li>Project delays;</li>
            <li>Increased construction or labor costs;</li>
            <li>Missed appointments;</li>
            <li>Substitute products or services;</li>
            <li>Loss of use;</li>
            <li>Property downtime;</li>
            <li>Emotional distress;</li>
            <li>Reputational harm; or</li>
            <li>Claims by third parties,</li>
          </UL>
          <p>
            whether the claim is based on contract, warranty, tort, negligence, strict liability, statute,
            restitution, indemnity, or any other theory, and whether or not Nova Lighting was advised that such
            damages were possible. TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE TOTAL AGGREGATE LIABILITY OF THE
            NOVA PARTIES ARISING FROM OR RELATING TO THE SITE, A PRODUCT, AN ORDER, OR THESE TERMS WILL NOT
            EXCEED THE GREATER OF:
          </p>
          <OL>
            <li>ONE HUNDRED DOLLARS; OR</li>
            <li>
              THE AMOUNT YOU PAID DIRECTLY TO NOVA LIGHTING FOR THE SPECIFIC PRODUCT OR TRANSACTION GIVING RISE
              TO THE CLAIM.
            </li>
          </OL>
          <p>
            Multiple claims arising from the same or related events will not increase this limit. These
            limitations apply even if a limited remedy fails of its essential purpose. The limitations do not
            apply to refund obligations expressly required by these Terms or to liability that cannot lawfully
            be excluded or limited, which may include liability for certain personal injuries caused by consumer
            goods to the extent an exclusion is unconscionable, gross negligence, willful misconduct, fraud, or
            nonwaivable statutory rights, as determined under applicable law.
          </p>
        </Section>

        <Section number="24" title="Third-Party Products, Services, and Links">
          <p>
            Nova Lighting sells products manufactured by third parties and may use or link to services provided
            by payment processors, financing providers, manufacturers, carriers, social-media platforms, mapping
            providers, analytics providers, installers, or other third parties. Third parties are independent
            from Nova Lighting. Unless expressly stated in a signed agreement, Nova Lighting does not control,
            endorse, guarantee, or assume responsibility for:
          </p>
          <UL>
            <li>Third-party websites or content;</li>
            <li>Manufacturer conduct or warranties;</li>
            <li>Carrier services;</li>
            <li>Financing or payment services;</li>
            <li>Independent contractors or installers;</li>
            <li>Third-party privacy or security practices; or</li>
            <li>Products or services purchased directly from a third party.</li>
          </UL>
          <p>
            Your dealings with a third party may be governed by separate terms between you and that third party.
          </p>
          <p>Links are provided for convenience and do not imply endorsement.</p>
        </Section>

        <Section number="25" title="User Content, Reviews, and Submissions">
          <p>
            The Site may allow you to submit reviews, photographs, comments, questions, project information,
            designs, suggestions, testimonials, or other content, collectively referred to as "User Content."
          </p>
          <p>
            You retain ownership of your User Content. For User Content you choose to submit for public posting,
            such as a review or customer photograph, you grant Nova Lighting a worldwide, nonexclusive,
            royalty-free, fully paid, transferable, sublicensable license to host, store, reproduce, modify for
            formatting, publish, display, distribute, and otherwise use such User Content for operating,
            improving, marketing, and promoting Nova Lighting and its products and services. Project plans, room
            photographs, measurements, and similar materials submitted privately for a consultation or order may
            be used to provide the requested services, maintain business records, and improve internal
            operations, but will not be used in public marketing without separate permission.
          </p>
          <p>
            This license continues for content already used or incorporated into materials even if you later
            delete your account, subject to applicable privacy law.
          </p>
          <p>You represent and warrant that:</p>
          <OL>
            <li>You own the User Content or have all necessary permissions;</li>
            <li>The User Content is accurate and not misleading;</li>
            <li>
              The User Content does not infringe intellectual-property, privacy, publicity, contractual, or
              other rights;
            </li>
            <li>
              The User Content does not contain unlawful, defamatory, threatening, obscene, deceptive,
              discriminatory, or malicious material;
            </li>
            <li>The User Content does not contain malware or harmful code; and</li>
            <li>
              You have disclosed any material connection, compensation, discount, free product, employment
              relationship, or incentive associated with a review or endorsement.
            </li>
          </OL>
          <p>
            We may remove, restrict, decline to publish, or moderate User Content at our discretion, but we are
            not obligated to monitor all User Content.
          </p>
        </Section>

        <Section number="26" title="Feedback">
          <p>
            If you provide ideas, suggestions, concepts, or other feedback relating to Nova Lighting, the Site,
            or our products and services, you grant Nova Lighting the unrestricted right to use and commercialize
            that feedback without compensation, attribution, confidentiality obligation, or restriction.
          </p>
          <p>Do not submit confidential information as feedback.</p>
        </Section>

        <Section number="27" title="Copyright Complaints">
          <p>
            If you believe content on the Site infringes your copyright, send a written notice containing
            sufficient information to identify:
          </p>
          <OL>
            <li>The copyrighted work;</li>
            <li>The allegedly infringing material and its location;</li>
            <li>Your contact information;</li>
            <li>A statement of your good-faith belief that the use is unauthorized;</li>
            <li>
              A statement, under penalty of perjury, that the information in your notice is accurate and that
              you are authorized to act for the copyright owner; and
            </li>
            <li>Your physical or electronic signature.</li>
          </OL>
          <p>Notices should be sent to:</p>
          <address className="not-italic space-y-1">
            <p>NOVA LIGHTING, INC. d/b/a Nova Lighting</p>
            <p>Attn: Copyright Agent</p>
            <p>922 N 1430 W</p>
            <p>Orem, Utah 84057</p>
            <p>
              Email: <LegalEmail />
            </p>
          </address>
          <p>
            Nova Lighting may remove allegedly infringing material and terminate repeat infringers where
            appropriate.
          </p>
        </Section>

        <Section number="28" title="Suspension and Termination">
          <p>We may suspend, limit, or terminate your access to the Site or an account if:</p>
          <UL>
            <li>You violate these Terms;</li>
            <li>We reasonably suspect fraud, abuse, unauthorized access, or unlawful conduct;</li>
            <li>Your use creates legal, security, operational, or reputational risk;</li>
            <li>Required by a manufacturer, service provider, regulator, court, or law-enforcement agency;</li>
            <li>Necessary to protect Nova Lighting or another person; or</li>
            <li>We discontinue the Site or a feature.</li>
          </UL>
          <p>Termination does not eliminate obligations or liabilities that arose before termination.</p>
          <p>
            Provisions that by their nature should survive termination will survive, including
            intellectual-property provisions, warranty disclaimers, liability limitations, indemnity, dispute
            resolution, and miscellaneous provisions.
          </p>
        </Section>

        <Section number="29" title="Indemnification">
          <p>
            For a commercial, wholesale, trade, contractor, designer, builder, resale, business, or project
            transaction, and to the maximum extent permitted by law, you agree to defend, indemnify, and hold
            harmless the Nova Parties from third-party claims, demands, proceedings, damages, judgments, losses,
            liabilities, penalties, fines, costs, and reasonable attorneys' fees arising from or relating to the
            matters below. For a Consumer Order, this section applies only to the extent permitted by law and
            only to a third-party claim caused by your unlawful conduct, intentional misuse of a product, or
            knowing material breach of these Terms:
          </p>
          <OL>
            <li>Your unlawful or unauthorized use of the Site;</li>
            <li>Your material violation of these Terms;</li>
            <li>Your User Content;</li>
            <li>Your infringement or violation of another person's rights;</li>
            <li>Fraudulent, deceptive, or unauthorized activity through your account;</li>
            <li>Your resale, export, modification, misuse, or improper installation of a product; or</li>
            <li>Your failure to comply with applicable laws, codes, instructions, or warnings.</li>
          </OL>
          <p>
            This obligation does not apply to the extent a claim is caused by the gross negligence, willful
            misconduct, or other legally non-indemnifiable conduct of a Nova Party.
          </p>
          <p>
            Nova Lighting may control the defense and settlement of an indemnified claim, provided that Nova
            Lighting may not agree to a settlement requiring you to admit wrongdoing or pay an amount not
            covered by the indemnity without your consent, which will not be unreasonably withheld.
          </p>
        </Section>

        <Section number="30" title="Informal Dispute Resolution">
          <p>
            Before commencing arbitration or litigation, the complaining party must send the other party an
            individualized written Notice of Dispute.
          </p>
          <p>A notice to Nova Lighting must be sent to:</p>
          <address className="not-italic space-y-1">
            <p>NOVA LIGHTING, INC. d/b/a Nova Lighting</p>
            <p>Attn: Legal Department</p>
            <p>922 N 1430 W</p>
            <p>Orem, Utah 84057</p>
            <p>
              Email: <LegalEmail />
            </p>
          </address>
          <p>The notice must include:</p>
          <OL>
            <li>The complaining party's name and contact information;</li>
            <li>Any relevant account, invoice, or order number;</li>
            <li>A detailed description of the dispute;</li>
            <li>The facts and documents supporting the claim; and</li>
            <li>The specific relief requested.</li>
          </OL>
          <p>
            Nova Lighting will send notices to the most recent address or email associated with your account or
            transaction.
          </p>
          <p>
            The parties will attempt in good faith to resolve the dispute for at least 60 days after receipt of
            the notice. Any applicable limitation period will be tolled during this 60-day period.
          </p>
          <p>
            A party may proceed sooner when immediate injunctive relief is reasonably necessary to prevent
            imminent harm.
          </p>
        </Section>

        <Section number="31" title="Binding Individual Arbitration">
          <p>
            <strong className="font-semibold">
              PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR RIGHT TO GO TO COURT.
            </strong>
          </p>
          <p>
            Except for the matters specifically excluded below, you and Nova Lighting agree that any dispute,
            claim, or controversy arising from or relating to:
          </p>
          <UL>
            <li>The Site;</li>
            <li>These Terms;</li>
            <li>A product or service;</li>
            <li>An order or transaction;</li>
            <li>Advertising or communications;</li>
            <li>Your account;</li>
            <li>The relationship between you and Nova Lighting; or</li>
            <li>The validity, interpretation, performance, breach, or termination of these Terms</li>
          </UL>
          <p>will be resolved through final and binding individual arbitration rather than in court.</p>
          <p>
            This agreement applies to claims based on contract, tort, negligence, warranty, statute, regulation,
            misrepresentation, restitution, equity, or any other legal theory, whether the claim arose before or
            after acceptance of these Terms.
          </p>

          <SubHeading>Governing arbitration law</SubHeading>
          <p>
            The Federal Arbitration Act governs the interpretation and enforcement of this arbitration
            agreement.
          </p>

          <SubHeading>Arbitration administrator and rules</SubHeading>
          <p>
            The arbitration will be administered by the American Arbitration Association, or "AAA." Nova
            Lighting will comply with the AAA's applicable consumer-clause registration and fee requirements. If
            AAA declines to administer a consumer arbitration because Nova Lighting failed to comply with those
            requirements, the consumer may elect to pursue the dispute in a court of competent jurisdiction.
          </p>
          <p>
            For a transaction primarily for personal, family, or household purposes, the AAA Consumer
            Arbitration Rules and Mediation Procedures will apply.
          </p>
          <p>
            For a commercial or business transaction that is not a consumer transaction, the AAA Commercial
            Arbitration Rules will apply.
          </p>
          <p>The applicable AAA rules are incorporated into this section by reference.</p>
          <p>
            If AAA is unavailable or declines to administer the matter, the parties will attempt to select
            another nationally recognized arbitration administrator. If they cannot agree, a court with
            jurisdiction may appoint an administrator or arbitrator under applicable law.
          </p>

          <SubHeading>Location and manner</SubHeading>
          <p>
            Consumer arbitration may be conducted by telephone, video conference, written submissions, in the
            county where you reside, or at another reasonably convenient location permitted by the applicable
            rules.
          </p>
          <p>
            Nonconsumer arbitration will be conducted in Utah County, Utah, unless the parties agree otherwise.
          </p>

          <SubHeading>Fees</SubHeading>
          <p>
            Payment of filing, administrative, and arbitrator fees will be governed by applicable law and the
            AAA rules.
          </p>
          <p>
            Nova Lighting will pay fees it is required to pay under those rules or applicable law. Each party
            will otherwise bear its own attorneys' fees and costs unless a statute, rule, or arbitration award
            provides otherwise.
          </p>

          <SubHeading>Arbitrator's authority</SubHeading>
          <p>
            The arbitrator may award the same individualized relief that a court could award, subject to these
            Terms and applicable law.
          </p>
          <p>
            The arbitrator may not award relief for or against anyone who is not a party to the individual
            arbitration.
          </p>
          <p>
            The arbitrator will issue a reasoned written decision sufficient to explain the essential findings
            and conclusions.
          </p>
          <p>A court with jurisdiction may enter judgment on the arbitration award.</p>

          <SubHeading>Matters not required to be arbitrated</SubHeading>
          <p>Either party may bring an eligible individual claim in small-claims court.</p>
          <p>
            Either party may seek temporary or preliminary injunctive relief in court when necessary to preserve
            the status quo or prevent imminent misuse of intellectual property, unauthorized access, data theft,
            cybersecurity harm, or other irreparable harm while arbitration is pending.
          </p>
          <p>
            Questions concerning whether the parties formed an agreement to arbitrate will be decided by a court
            unless applicable law requires otherwise.
          </p>
        </Section>

        <Section number="32" title="Class-Action and Representative-Action Waiver">
          <p>
            <strong className="font-semibold">
              YOU AND NOVA LIGHTING AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN
              INDIVIDUAL CAPACITY.
            </strong>
          </p>
          <p>
            Neither party may bring or participate in a class action, collective action, consolidated action,
            mass action, private-attorney-general action, or other representative proceeding.
          </p>
          <p>
            The arbitrator may not combine claims belonging to different individuals or entities and may not
            preside over a representative or class proceeding.
          </p>
          <p>
            If a court determines that this waiver cannot lawfully be enforced for a particular claim or form of
            relief, only that claim or requested relief will proceed in court after all arbitrable claims have
            been completed. The remaining portions of the arbitration agreement will remain enforceable to the
            maximum extent permitted by law.
          </p>
        </Section>

        <Section number="33" title="Arbitration Opt-Out">
          <p>
            You may opt out of the arbitration agreement in Sections 31 and 32 by sending a written opt-out
            notice within 30 days after you first accept these Terms.
          </p>
          <p>Your notice must include:</p>
          <OL>
            <li>Your full name;</li>
            <li>Your mailing address;</li>
            <li>Your email address;</li>
            <li>Any relevant account number;</li>
            <li>A clear statement that you are opting out of the Nova Lighting arbitration agreement; and</li>
            <li>Your signature.</li>
          </OL>
          <p>Send the notice to:</p>
          <address className="not-italic space-y-1">
            <p>NOVA LIGHTING, INC. d/b/a Nova Lighting</p>
            <p>Attn: Arbitration Opt-Out</p>
            <p>922 N 1430 W</p>
            <p>Orem, Utah 84057</p>
            <p>
              Email: <LegalEmail />
            </p>
          </address>
          <p>
            Opting out will not affect your ability to use the Site or purchase products. An opt-out applies
            only to the individual who properly submits it and does not bind another account holder, company, or
            person.
          </p>
        </Section>

        <Section number="34" title="Governing Law and Court Venue">
          <p>
            Except for matters governed by the Federal Arbitration Act, these Terms and any dispute between you
            and Nova Lighting will be governed by the laws of the State of Utah, without regard to
            conflict-of-law principles.
          </p>
          <p>
            For disputes not subject to arbitration, you and Nova Lighting consent to the exclusive jurisdiction
            of the state and federal courts located in Utah County, Utah, except where applicable consumer law
            gives you a nonwaivable right to bring a claim elsewhere.
          </p>
          <p>
            Each party waives objections based on personal jurisdiction, venue, or inconvenient forum to the
            extent legally permitted.
          </p>
        </Section>

        <Section number="35" title="Jury-Trial Waiver">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, FOR ANY DISPUTE THAT PROCEEDS IN COURT RATHER THAN
            ARBITRATION, YOU AND NOVA LIGHTING KNOWINGLY AND VOLUNTARILY WAIVE THE RIGHT TO A TRIAL BY JURY.
          </p>
        </Section>

        <Section number="36" title="Time Limit for Claims">
          <p>
            To the maximum extent permitted by law, a claim for breach of contract or warranty arising from or
            relating to the Site, a product, a transaction, or these Terms must be commenced within one (1) year
            after the claim accrued.
          </p>
          <p>
            If applicable law does not permit that limitation for a particular claim, the shortest legally
            permitted period will apply.
          </p>
          <p>
            This section does not shorten a manufacturer warranty period or a nonwaivable statutory limitation
            period.
          </p>
        </Section>

        <Section number="37" title="International Use and Export Compliance">
          <p>The Site is controlled from the United States.</p>
          <p>
            We do not represent that the Site or its content is appropriate or legally available in every
            jurisdiction.
          </p>
          <p>
            You are responsible for complying with laws applicable to your location and use. You may not
            purchase, export, reexport, transfer, or use products or technology in violation of United States
            export controls, sanctions, embargoes, or other applicable trade restrictions.
          </p>
        </Section>

        <Section number="38" title="Force Majeure">
          <p>
            Nova Lighting will not be liable for delay, failure, interruption, shortage, or cancellation caused
            by circumstances beyond its reasonable control.
          </p>
          <p>
            Such circumstances may include natural disasters, severe weather, fire, flood, earthquake, epidemic,
            pandemic, war, terrorism, civil unrest, labor disputes, transportation interruptions, carrier
            failures, port congestion, customs delays, supply shortages, manufacturer delays, utility failures,
            internet outages, cyberattacks, government actions, changes in law, embargoes, or other events
            beyond Nova Lighting's reasonable control.
          </p>
          <p>
            Nova Lighting may allocate available inventory, extend performance dates, suspend performance, offer
            alternatives, or cancel affected portions of an order and refund amounts paid for products not
            provided.
          </p>
        </Section>

        <Section number="39" title="Assignment">
          <p>
            You may not assign or transfer these Terms, an account, without Nova Lighting's prior written
            consent. Any attempted assignment or transfer in violation of this section is void.
          </p>
          <p>
            Nova Lighting may, without your consent and, except as required by applicable law, without prior
            notice to you: (a) assign its rights to payment or other amounts due; and (b) assign these Terms, an
            account relationship, or an order, or delegate its associated obligations, to an affiliate or to a
            successor in connection with a merger, consolidation, reorganization, financing, sale of equity or
            assets, transfer of operations, change in control, or other disposition of all or substantially all
            of the business or assets to which these Terms relate. Any person assuming responsibility for an
            uncompleted order must agree to perform the obligations assigned to it.
          </p>
          <p>
            No assignment or delegation will reduce your rights under an accepted order or relieve Nova Lighting
            of any obligation or liability to the extent Nova Lighting remains responsible under applicable law.
            These Terms will bind and benefit the parties and their respective permitted successors and assigns.
          </p>
        </Section>

        <Section number="40" title="No Waiver">
          <p>A delay or failure to enforce a provision does not waive the right to enforce it later.</p>
          <p>A waiver must be in writing and applies only to the particular circumstance identified.</p>
        </Section>

        <Section number="41" title="Severability and Reformation">
          <p>
            If a provision of these Terms is found unlawful, invalid, or unenforceable, it will be enforced to
            the maximum extent permitted by law.
          </p>
          <p>
            If necessary, the provision will be modified to most closely reflect its lawful purpose. The
            remaining provisions will remain in effect unless applicable law requires otherwise.
          </p>
          <p>
            The arbitration and class-action provisions are also subject to their specific severability
            language.
          </p>
        </Section>

        <Section number="42" title="Entire Agreement and Order of Precedence">
          <p>
            These Terms, together with incorporated policies, applicable product terms, and the accepted order,
            constitute the entire agreement regarding your use of the Site and purchases through the Site.
          </p>
          <p>
            They supersede prior or contemporaneous communications on the same subject, except for a separate
            written agreement expressly approved by an authorized Nova Lighting representative.
          </p>
          <p>In the event of a direct conflict, the following order ordinarily applies:</p>
          <OL>
            <li>A separate signed written agreement;</li>
            <li>An accepted written order or quote containing transaction-specific terms;</li>
            <li>Product-specific or promotion-specific terms;</li>
            <li>The Return Policy or Shipping Policy with respect to its stated subject; and</li>
            <li>These Terms.</li>
          </OL>
          <p>No employee or representative may modify these Terms through an oral statement.</p>
        </Section>

        <Section number="43" title="No Third-Party Beneficiaries">
          <p>
            Except for the Nova Parties expressly protected by these Terms, these Terms do not create rights in
            any third party.
          </p>
        </Section>

        <Section number="44" title="Headings and Interpretation">
          <p>Headings are provided for convenience and do not limit the meaning of a provision.</p>
          <p>Words such as "including" and "includes" mean "including without limitation."</p>
          <p>
            These Terms will not be interpreted against a party merely because that party participated in
            drafting them.
          </p>
        </Section>

        <Section number="45" title="Contact Information">
          <p>Questions about these Terms may be directed to:</p>
          <address className="not-italic space-y-1">
            <p>NOVA LIGHTING, INC.</p>
            <p>Doing business as Nova Lighting</p>
            <p>Attn: Legal Department</p>
            <p>922 N 1430 W</p>
            <p>Orem, Utah 84057</p>
            <p>
              Phone:{" "}
              <a href="tel:+18012254459" className={linkCls}>
                801-225-4459
              </a>
            </p>
            <p>
              Email: <LegalEmail />
            </p>
          </address>
        </Section>
      </article>
    </div>
  );
};

export default TermsConditionsPage;
