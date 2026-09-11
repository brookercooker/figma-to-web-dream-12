import { Link } from "react-router-dom";

const CS = "/coming-soon";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
          {/* Shop */}
          <div>
            <h2 className="font-sans text-xs font-semibold tracking-[0.15em] uppercase mb-4 text-foreground">
              Shop
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to={CS} className="hover:text-foreground transition-colors">Ceiling Lighting</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Wall & Bath</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Lamps</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Outdoor</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Fans</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Home & Decor</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Advanced Search</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h2 className="font-sans text-xs font-semibold tracking-[0.15em] uppercase mb-4 text-foreground">
              About
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">Our Story</Link></li>
              <li><Link to="/locations" className="hover:text-foreground transition-colors">Locations</Link></li>
              <li><Link to="/team" className="hover:text-foreground transition-colors">Meet the Team</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link to={CS} className="hover:text-foreground transition-colors">Ideas & Advice</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h2 className="font-sans text-xs font-semibold tracking-[0.15em] uppercase mb-4 text-foreground">
              Policies
            </h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/shipping-policy" className="hover:text-foreground transition-colors">Shipping Policy</Link></li>
              <li><Link to="/return-policy" className="hover:text-foreground transition-colors">Return Policy</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Showrooms */}
          <div className="col-span-2">
            <h2 className="font-sans text-xs font-semibold tracking-[0.15em] uppercase mb-4 text-foreground">
              <Link to="/locations" className="hover:text-accent transition-colors">Our Locations</Link>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm text-muted-foreground">
              {[
                { name: "Orem", address: "922 N 1430 W", city: "Orem, UT 84057", phone: "801-225-4459" },
                { name: "Sandy", address: "8699 S Sandy Parkway", city: "Sandy, UT 84070", phone: "801-562-8530" },
                { name: "Heber City", address: "162 S Main St", city: "Heber City, UT 84032", phone: "435-777-5949" },
                { name: "Midvale", address: "7515 S State St", city: "Midvale, UT 84047", phone: "801-566-1324" },
                { name: "Layton", address: "1565 W Hill Field Rd, #103", city: "Layton, UT 84041", phone: "801-721-5959" },
                { name: "St. George", address: "3284 Deseret Dr Unit 17", city: "St. George, UT 84790", phone: "801-823-9179" },
              ].map((s) => (
                <div key={s.name}>
                  <p className="font-medium text-foreground mb-0.5">{s.name}</p>
                  <p className="text-xs leading-relaxed">{s.address}</p>
                  <p className="text-xs leading-relaxed">{s.city}</p>
                  <a href={`tel:${s.phone}`} className="text-xs hover:text-foreground transition-colors">{s.phone}</a>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="font-sans text-xs font-semibold tracking-[0.15em] uppercase text-foreground">Connect</span>
              {[
                { label: "Instagram", href: "https://www.instagram.com/novalightingcompany/" },
                { label: "Facebook", href: "https://www.facebook.com/NovaLightingInc/" },
                { label: "Pinterest", href: "https://www.pinterest.com/novalightingcompany/" },
                { label: "TikTok", href: "https://www.tiktok.com/@novalightingcompany" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Nova Lighting on ${social.label}`}
                  className="hover:text-foreground transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>

          </div>
        </div>

        <div className="mt-10 sm:mt-14 border-t border-border pt-6 sm:pt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nova Lighting Co. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
