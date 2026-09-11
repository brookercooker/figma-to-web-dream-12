import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCart } from "@/contexts/CartContext";

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const CartPage = () => {
  const { items, subtotal, setQty, remove } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs currentLabel="Cart" />
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2">Your Cart</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10">
          Sandbox — checkout is simulated
        </p>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl text-foreground mb-3">Your cart is empty.</p>
            <Link to="/catalog" className="text-sm text-link underline-offset-4 hover:underline">
              Browse the catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
            <ul className="divide-y divide-border border-y border-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 sm:gap-6 py-6">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 bg-secondary/40 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain p-2" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg text-foreground leading-tight mb-1">{item.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">{fmt(item.price)}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-4 text-sm">{item.qty}</span>
                        <button
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground self-start whitespace-nowrap">
                    {fmt(item.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <aside className="border border-border p-6 h-fit">
              <h2 className="font-serif text-xl text-foreground mb-6">Summary</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="border-t border-border my-4" />
              <div className="flex justify-between text-base mb-6">
                <span className="text-foreground">Estimated total</span>
                <span className="text-foreground">{fmt(subtotal)}</span>
              </div>
              <Link
                to="/checkout"
                className="block w-full bg-foreground text-background py-3 text-center text-xs font-sans font-medium tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
              >
                Checkout
              </Link>
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                No payment will be charged.
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
