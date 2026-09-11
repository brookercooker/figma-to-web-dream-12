import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/contexts/CartContext";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const Field = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">{label}</span>
    <input
      {...props}
      className="w-full bg-transparent border border-border focus:border-foreground outline-none px-3 py-2 text-sm text-foreground transition-colors"
    />
  </label>
);

const CheckoutPage = () => {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [orderId] = useState(
    () => `SBX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  );

  if (items.length === 0 && !placed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-20 text-center">
          <p className="font-serif text-2xl text-foreground mb-3">Nothing to check out.</p>
          <Link to="/catalog" className="text-sm text-link underline-offset-4 hover:underline">
            Browse the catalog
          </Link>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            Sandbox confirmation
          </p>
          <h1 className="font-serif text-4xl text-foreground mb-4">Order placed.</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Reference <span className="text-foreground">{orderId}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            This is a simulated order in the sandbox. No payment was charged and no fulfillment will occur.
          </p>
          <Link
            to="/"
            className="inline-block border border-foreground px-6 py-3 text-xs font-sans tracking-[0.15em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    setPlaced(true);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs currentLabel="Checkout" />
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2">Checkout</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10">
          Sandbox — no payment will be charged
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-10">
            <section>
              <h2 className="font-serif text-xl text-foreground mb-5">Contact</h2>
              <Field label="Email" type="email" required defaultValue="sandbox@example.com" />
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-5">Shipping</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name" required defaultValue="Sandbox" />
                <Field label="Last name" required defaultValue="Customer" />
                <div className="sm:col-span-2"><Field label="Address" required defaultValue="123 Demo Street" /></div>
                <Field label="City" required defaultValue="Salt Lake City" />
                <Field label="Postal code" required defaultValue="84101" />
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-2">Payment</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Payment is simulated. No card is required and no charge will be made.
              </p>
              <div className="border border-dashed border-border p-4 text-xs uppercase tracking-[0.18em] text-muted-foreground text-center">
                Fake gateway · auto-approved
              </div>
            </section>
          </div>

          <aside className="border border-border p-6 h-fit">
            <h2 className="font-serif text-xl text-foreground mb-5">Order</h2>
            <ul className="space-y-3 mb-5">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span className="text-foreground line-clamp-1 pr-3">
                    {i.name} <span className="text-muted-foreground">× {i.qty}</span>
                  </span>
                  <span className="text-foreground whitespace-nowrap">{fmt(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-4 flex justify-between text-base mb-6">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{fmt(subtotal)}</span>
            </div>
            <button
              type="submit"
              className="w-full bg-foreground text-background py-3 text-xs font-sans font-medium tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
            >
              Place simulated order
            </button>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="block w-full mt-3 text-center text-xs text-muted-foreground hover:text-foreground tracking-[0.1em] uppercase"
            >
              Back to cart
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
