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

const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc space-y-3 pl-6">{children}</ul>
);

const PrivacyPolicyPage = () => {
  useEffect(() => {
    document.title = "Privacy Policy | Nova Lighting";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Nova Lighting Privacy Policy: the personal information we collect, how we use and disclose it, cookies, advertising choices, retention, security, and your privacy rights.",
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground">
            NOVA LIGHTING, INC. d/b/a Nova Lighting
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective Date: August 13, 2026 Last Updated: August 13, 2026
          </p>
          <p className="mt-6 text-base leading-relaxed text-foreground">
            This Privacy Policy explains how NOVA LIGHTING, INC., a Utah corporation ("Nova," "we," "us," or
            "our") collects, uses, shares, and retains personal information when individuals interact with us
            online or offline. It is intended to provide notice of our information practices; it is not a
            contract and does not create rights beyond those provided by applicable law.
          </p>
        </header>

        <Section number="1" title="Scope of This Policy">
          <p>
            This Policy applies to personal information collected through www.novalighting.com and other
            websites or online services that link to it (collectively, the "Site"), and through our showrooms,
            telephone and email orders, trade and contractor accounts, design consultations, product inquiries,
            deliveries, returns, warranties, promotions, events, and other customer or business interactions
            (collectively with the Site, the "Services").
          </p>
          <p>
            This Policy applies to consumers as well as business contacts acting for designers, contractors,
            builders, property owners, vendors, manufacturers, and other organizations. It does not apply to
            information processed solely in an employment or job-applicant context, which may be governed by a
            separate notice.
          </p>
          <p>
            For purposes of this Policy, "personal information" means information that identifies, relates to,
            describes, is reasonably capable of being associated with, or could reasonably be linked with an
            individual or household. It does not include information that applicable law treats as public,
            deidentified, or aggregated.
          </p>
        </Section>

        <Section number="2" title="Personal Information We Collect">
          <p>
            We collect the categories of personal information described in the table below. The specific
            information we collect depends on how you interact with us. We collect information directly from
            you, automatically through technology when you use our website, and from third parties such as
            designers, contractors, manufacturers, sales representatives, and service providers. We may collect
            the following categories of personal information:
          </p>
          <p>
            <strong className="font-semibold">Contact and identity information.</strong> Name, billing and
            shipping address, email address, telephone number, signature, account username, and other
            identifiers you provide.
          </p>
          <p>
            <strong className="font-semibold">Account and preference information.</strong> Login credentials,
            saved addresses, wish lists, product preferences, communication preferences, trade-account details,
            and account settings.
          </p>
          <p>
            <strong className="font-semibold">Transaction and commercial information.</strong> Products
            considered or purchased, quotes, orders, invoices, discounts, delivery details, returns, refunds,
            warranties, service history, and related records.
          </p>
          <p>
            <strong className="font-semibold">Payment, credit, and financing information.</strong> Payment
            method, billing details, transaction tokens, limited payment-card details received from processors,
            and information submitted in connection with financing, credit, resale, tax-exemption, or
            fraud-prevention activities. Payment and financing providers may collect information directly under
            their own privacy notices.
          </p>
          <p>
            <strong className="font-semibold">Project and design information.</strong> Room or project details,
            measurements, plans, photographs, property or installation addresses, style preferences, budgets,
            product specifications, and information about designers, contractors, builders, owners, or other
            project participants.
          </p>
          <p>
            <strong className="font-semibold">Communications and content.</strong> Emails, texts, chats, call
            information, product reviews, survey responses, warranty or return documentation, photographs, and
            other information you choose to provide. Calls, chats, browsing sessions, or showroom activity may
            be recorded where disclosed and permitted by law.
          </p>
          <p>
            <strong className="font-semibold">Device and online activity information.</strong> IP address,
            device identifiers, browser and operating-system information, cookie and pixel identifiers,
            referring pages, pages and products viewed, searches, clicks, cart activity, approximate location
            inferred from an IP address, and interactions with emails, advertisements, and the Site.
          </p>
          <p>
            <strong className="font-semibold">Marketing and inferred information.</strong> Marketing
            preferences, campaign engagement, likely interests, customer segments, and inferences generated from
            shopping, transaction, and online activity information.
          </p>
          <p>
            <strong className="font-semibold">Compliance and security information.</strong>{" "}
            Identity-verification information, fraud indicators, access and security logs, tax or resale
            documentation, and government-issued or business identifiers when reasonably necessary for an
            account, transaction, or legal obligation.
          </p>
          <p>
            We do not ask you to provide sensitive personal information unless it is reasonably necessary for a
            transaction, account, legal requirement, or other purpose disclosed when the information is
            collected. Please do not send sensitive information through an unsecured channel or unless we
            request it.
          </p>
        </Section>

        <Section number="3" title="Sources of Personal Information">
          <List>
            <li>We collect personal information from the following categories of sources:</li>
            <li>
              Directly from you, including when you browse, create an account, request a quote, place an order,
              communicate with us, visit a showroom, or request service.
            </li>
            <li>
              Automatically from your browser or device through cookies, pixels, logs, and similar technologies.
            </li>
            <li>
              From people or organizations involved in a transaction or project, such as a designer, contractor,
              builder, property owner, purchaser, recipient, or trade-account administrator.
            </li>
            <li>
              From manufacturers, distributors, sales representatives, carriers, payment and financing
              providers, fraud-prevention providers, and other service providers or business partners.
            </li>
            <li>
              From advertising, analytics, social-media, and marketing partners, subject to their practices and
              your settings.
            </li>
            <li>
              From public records and publicly available business, professional, property, or social-media
              information where relevant to our Services.
            </li>
          </List>
        </Section>

        <Section number="4" title="How We Use Personal Information">
          <p>We use personal information for the following business and commercial purposes:</p>
          <List>
            <li>
              Provide the Site and Services; create and administer accounts; prepare quotes; process payments;
              accept, fulfill, ship, and deliver orders; and provide invoices and order updates.
            </li>
            <li>
              Coordinate with manufacturers, distributors, drop shippers, carriers, designers, contractors,
              builders, and other people involved in an order or project.
            </li>
            <li>
              Provide product information, design assistance, customer service, returns, refunds, replacement
              parts, recalls, warranty assistance, and dispute resolution.
            </li>
            <li>
              Offer and administer trade accounts, financing, tax exemptions, promotions, events, and customer
              programs.
            </li>
            <li>
              Personalize the Site and product recommendations and remember preferences and cart activity.
            </li>
            <li>
              Measure Site use, campaign performance, and customer engagement; conduct analytics and research;
              and improve our products, Services, operations, and marketing.
            </li>
            <li>
              Send transactional messages and, consistent with your choices and applicable law, marketing
              communications and advertising.
            </li>
            <li>
              Authenticate users, process payments, manage risk, prevent fraud and abuse, secure systems and
              premises, and protect customers, employees, and property.
            </li>
            <li>
              Comply with accounting, tax, recordkeeping, legal, regulatory, and contractual obligations;
              establish or defend legal claims; and enforce our policies and agreements.
            </li>
            <li>
              Evaluate or complete a financing, merger, reorganization, sale, transfer, or other business
              transaction.
            </li>
          </List>
          <p>
            We may also use information for another purpose that is disclosed when the information is
            collected, with your direction or consent, or as otherwise permitted by law.
          </p>
        </Section>

        <Section number="5" title="How We Disclose Personal Information">
          <p>
            We may disclose the categories of personal information described above to the following categories
            of recipients when reasonably necessary for the purposes described in this Policy:
          </p>
          <p>
            <strong className="font-semibold">Service providers and contractors.</strong> Website, ecommerce,
            hosting, cloud, customer-relationship-management, communications, call or chat, payment, financing,
            fraud-prevention, security, analytics, marketing, document-management, accounting, and
            professional-service providers that perform services for us.
          </p>
          <p>
            <strong className="font-semibold">Manufacturers, distributors, and fulfillment partners.</strong> We
            may provide contact, order, delivery, project, warranty, and related information to manufacturers,
            distributors, sales representatives, drop shippers, carriers, installers, and delivery providers to
            quote, source, fulfill, deliver, service, or support products.
          </p>
          <p>
            <strong className="font-semibold">Project and account participants.</strong> At your direction or
            when reasonably necessary for the transaction, we may communicate with a designer, contractor,
            builder, property owner, purchaser, recipient, account administrator, or other participant about an
            order or project.
          </p>
          <p>
            <strong className="font-semibold">Analytics, advertising, and marketing partners.</strong> We may
            disclose online identifiers, device and activity information, commercial information, approximate
            location, and inferences to providers that measure use, attribute campaigns, personalize
            advertising, or help us reach customers. Some disclosures may be treated as a "sale," "sharing," or
            use for "targeted advertising" under certain state laws even when no money changes hands.
          </p>
          <p>
            <strong className="font-semibold">Professional advisors and authorities.</strong> We may disclose
            information to lawyers, accountants, auditors, insurers, financial institutions, regulators, law
            enforcement, courts, or other authorities when reasonably necessary to obtain advice, comply with
            law, respond to lawful process, protect rights or safety, or address fraud and misconduct.
          </p>
          <p>
            <strong className="font-semibold">Business-transaction recipients.</strong> We may disclose
            information to affiliates, lenders, investors, buyers, sellers, transaction partners, and advisors
            in connection with due diligence, financing, a merger, reorganization, sale of assets or equity,
            transfer of operations, bankruptcy, or similar transaction.
          </p>
          <p>
            <strong className="font-semibold">Other recipients at your direction.</strong> We may disclose
            information when you direct us to do so, consent to the disclosure, or intentionally interact with
            a third party through the Services.
          </p>
          <p>
            Nova does not sell personal information for money. See Section 7 for disclosures involving online
            advertising and the choices that may apply.
          </p>
        </Section>

        <Section number="6" title="Cookies and Similar Technologies">
          <p>
            We and our providers may use cookies, pixels, tags, web beacons, local storage, software
            development kits, server logs, and similar technologies to operate and secure the Site, remember
            your choices, maintain carts and accounts, understand use, improve performance, measure campaigns,
            and support advertising.
          </p>
          <p>These technologies generally fall into the following categories:</p>
          <p>
            <strong className="font-semibold">Essential technologies.</strong> Required for core Site
            functions, checkout, account access, security, fraud prevention, and load balancing.
          </p>
          <p>
            <strong className="font-semibold">Functional technologies.</strong> Remember choices and provide
            enhanced features, such as saved carts, preferences, or chat.
          </p>
          <p>
            <strong className="font-semibold">Analytics technologies.</strong> Help us understand traffic,
            navigation, conversions, errors, and how the Site and communications perform.
          </p>
          <p>
            <strong className="font-semibold">Advertising technologies.</strong> Help measure campaigns, build
            audiences, and deliver or personalize advertising on this Site or other services.
          </p>
          <p>
            Where available, you can manage nonessential technologies through our cookie preference center. You
            may also adjust browser settings, but blocking some technologies may affect Site functionality.
            Browser settings and industry opt-out tools may not control every technology or apply across every
            browser or device.
          </p>
          <p>
            A browser's general "Do Not Track" setting is not uniform and may not be recognized by the Site. It
            is different from an opt-out preference signal, such as Global Privacy Control, that applicable law
            may require us to honor as described below.
          </p>
        </Section>

        <Section number="7" title="Sale, Sharing, and Targeted Advertising Choices">
          <p>
            Although Nova does not sell personal information for money, our use of certain advertising,
            analytics, or audience-matching technologies may be considered a sale or sharing of personal
            information or processing for targeted advertising under some state laws. The information involved
            may include online identifiers, device and Site activity information, approximate location,
            commercial information, and inferences, and the recipients may include advertising networks,
            social-media platforms, and analytics or marketing partners.
          </p>
          <p>
            Where applicable, you may opt out by using the "Your Privacy Choices" link on the Site or by
            submitting a request under Section 12. We also process recognized opt-out preference signals, such
            as Global Privacy Control, as required by applicable law. A browser-based signal ordinarily applies
            to the browser or device from which it is sent; if you are logged into an account, we will apply it
            more broadly when required and reasonably able to associate it with your account.
          </p>
          <p>
            We do not knowingly sell or share for cross-context behavioral advertising the personal information
            of individuals under 16 years of age.
          </p>
        </Section>

        <Section number="8" title="Payment and Financing Providers">
          <p>
            Payment-card and financing information may be collected directly by third-party processors or
            financing providers. Nova may receive transaction status, a token, limited card details, or
            information needed to complete an order, but the provider's handling of information it collects
            directly is governed by its own privacy notice and terms. Financing decisions are made by the
            applicable provider, not by Nova, unless expressly stated otherwise.
          </p>
        </Section>

        <Section number="9" title="Marketing and Communication Choices">
          <p>
            You may unsubscribe from promotional emails by using the unsubscribe link in the message or
            contacting us. If you receive promotional text messages, you may opt out by replying STOP or
            following the instructions in the message. Consent to marketing texts is not a condition of
            purchase. We may continue to send nonmarketing communications concerning your account, order,
            delivery, warranty, recall, security, legal notice, or other transaction where permitted by law.
          </p>
        </Section>

        <Section number="10" title="Retention of Personal Information">
          <p>
            We retain personal information only for as long as reasonably necessary for the purposes described
            in this Policy or as permitted or required by law. The retention period for a particular record
            depends on the nature and sensitivity of the information, the transaction or relationship, warranty
            and product-life considerations, fraud and security needs, applicable limitation periods, and tax,
            accounting, legal, contractual, and recordkeeping requirements.
          </p>
          <p>
            For example, account information generally is retained while the account remains active and for a
            reasonable period afterward; order, invoice, payment, tax, return, and warranty records generally
            are retained for applicable business and legal recordkeeping periods; and cookie, analytics,
            marketing, security, and technical records generally are retained according to the useful life and
            settings of the applicable technology, subject to legal and operational needs. We may retain
            deidentified or aggregated information where it cannot reasonably be used to identify you.
          </p>
        </Section>

        <Section number="11" title="Security">
          <p>
            We use reasonable administrative, technical, and physical safeguards designed to protect personal
            information in light of its nature and the risks presented. No security measure, transmission
            method, or storage system is completely secure, and we cannot guarantee absolute security. You are
            responsible for maintaining the confidentiality of your account credentials and for notifying us if
            you suspect unauthorized use of your account.
          </p>
        </Section>

        <Section number="12" title="Your Privacy Rights">
          <p>
            Depending on where you live, how you interact with us, and whether an applicable privacy law covers
            Nova's processing, you may have the right to:
          </p>
          <List>
            <li>
              Confirm whether we process your personal information and access or obtain a copy of it.
            </li>
            <li>Correct inaccurate personal information.</li>
            <li>Delete personal information, subject to lawful exceptions.</li>
            <li>Obtain certain information in a portable and readily usable format.</li>
            <li>
              Opt out of a sale or sharing of personal information or processing for targeted advertising.
            </li>
            <li>
              Limit certain uses or disclosures of sensitive personal information, where applicable.
            </li>
            <li>
              Opt out of certain profiling in furtherance of decisions producing legal or similarly significant
              effects, where applicable.
            </li>
            <li>Appeal our denial of a request, where applicable.</li>
            <li>Use an authorized agent to submit a request where permitted by law.</li>
            <li>
              Receive equal service and pricing without unlawful discrimination for exercising a privacy right.
            </li>
          </List>
          <p>
            To submit a request, contact us at{" "}
            <a
              href="mailto:info@novalighting.com"
              className="underline underline-offset-4 hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              info@novalighting.com
            </a>
            , or call{" "}
            <a
              href="tel:+18012254459"
              className="underline underline-offset-4 hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              801-225-4459
            </a>
            . Please describe the request and provide information reasonably necessary to locate the relevant
            records. Do not send a copy of a government identification document unless we specifically request
            it through a secure method.
          </p>
          <p>
            We will verify a request to the degree appropriate to the right requested and the nature of the
            information, which may include matching information you provide against our records or asking you
            to use an existing account. We may deny or limit a request where permitted by law, including when
            we cannot verify it, an exception applies, or the request is excessive or abusive.
          </p>
          <p>
            If applicable law provides an appeal right, you may appeal by replying to our decision or
            contacting us with the subject line "Privacy Appeal."
          </p>
          <p>
            An authorized agent must provide proof of authority, and we may also verify your identity or
            confirm the authorization directly with you unless law provides otherwise. We will respond within
            the period required by applicable law.
          </p>
        </Section>

        <Section number="13" title="State-Specific Disclosures">
          <p>
            This section supplements the rest of the Policy for residents of states with comprehensive consumer
            privacy laws, including California and Utah, when the applicable law covers Nova's processing.
          </p>
          <p>
            <strong className="font-semibold">Collection, use, and disclosure.</strong> During the preceding 12
            months, we may have collected the categories described in Section 2 from the sources described in
            Section 3, used them for the purposes described in Section 4, and disclosed them to the categories
            of recipients described in Section 5. The specific categories involved depend on your interactions
            with us.
          </p>
          <p>
            <strong className="font-semibold">Sale, sharing, and targeted advertising.</strong> Nova has not
            sold personal information for money. During the preceding 12 months, Nova has sold or shared, as
            those terms are defined by applicable law, online identifiers, device and activity information,
            approximate location, commercial information, and inferences with advertising, social-media,
            analytics, or marketing partners for targeted or cross-context behavioral advertising. Instructions
            for opting out appear in Section 7.
          </p>
          <p>
            <strong className="font-semibold">Sensitive personal information.</strong> Nova does not use or
            disclose sensitive personal information for the purpose of inferring characteristics about an
            individual or for purposes that trigger a right to limit under California law, unless a different
            practice is disclosed at or before collection.
          </p>
          <p>
            <strong className="font-semibold">California direct-marketing disclosure.</strong> Nova does not
            disclose personal information to third parties for their own direct-marketing purposes in a manner
            that requires a separate customer-information disclosure under California's "Shine the Light" law.
            If this practice changes, this Policy will be updated as required.
          </p>
          <p>
            <strong className="font-semibold">Financial incentives.</strong> Nova does not offer a financial
            incentive or price or service difference in exchange for personal information unless the material
            terms and any required notice are presented when you choose to participate.
          </p>
        </Section>

        <Section number="14" title="Children's Privacy">
          <p>
            The Services are intended for adults and are not directed to children under 13. We do not knowingly
            collect personal information online from children under 13. If you believe a child has provided
            personal information to us, contact us using Section 18 so we can take appropriate steps. We do not
            knowingly sell or share for cross-context behavioral advertising the personal information of
            individuals under 16.
          </p>
        </Section>

        <Section number="15" title="Third-Party Sites and Services">
          <p>
            The Services may link to or integrate with websites, applications, social networks, payment or
            financing providers, manufacturers, or other services that Nova does not control. Their privacy
            practices are governed by their own notices. A link or integration does not mean that Nova controls
            or endorses the third party's privacy practices.
          </p>
        </Section>

        <Section number="16" title="Processing in the United States">
          <p>
            Nova operates from the United States, and we and our providers may process personal information in
            the United States and other locations where we or they operate. If you access the Services from
            outside the United States, privacy laws and protections in those locations may differ from those in
            your jurisdiction.
          </p>
        </Section>

        <Section number="17" title="Changes to This Policy">
          <p>
            We may update this Policy from time to time to reflect changes in our practices, Services, or legal
            obligations. We will post the revised Policy and update the "Last Updated" date. If required by
            law, we will provide additional notice or obtain consent before a material change applies to
            previously collected personal information. Changes apply prospectively from their effective date
            unless law permits otherwise.
          </p>
        </Section>

        <Section number="18" title="Contact Us">
          <p>For questions about this Policy or our privacy practices, contact:</p>
          <p>
            <strong className="font-semibold">NOVA LIGHTING, INC. d/b/a Nova Lighting</strong>
          </p>
          <address className="not-italic space-y-1">
            <p>Attn: Legal Department</p>
            <p>922 N 1430 W</p>
            <p>Orem, Utah 84057</p>
            <p>
              Phone:{" "}
              <a
                href="tel:+18012254459"
                className="underline underline-offset-4 hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                801-225-4459
              </a>
            </p>
            <p>
              Email:{" "}
              <a
                href="mailto:info@novalighting.com"
                className="underline underline-offset-4 hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                info@novalighting.com
              </a>
            </p>
          </address>
        </Section>
      </article>
    </div>
  );
};

export default PrivacyPolicyPage;
