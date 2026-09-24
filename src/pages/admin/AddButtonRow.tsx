import { Button } from "@/components/ui/button";

type Props = {
  label: string; // e.g. "Object" — rendered as "+ Add {label}"
  onClick: () => void;
  children?: React.ReactNode;
  subtle?: boolean;
  text?: string;
};

/**
 * Prominent "+ Add …" call to action, rendered on its own row directly below
 * the FilterBar. Sand gradient pill sized to content — not full-width — with
 * a subtle shine sweep on hover. Consistent across manager tools (Pages,
 * Landing Pages, Objects).
 */
export default function AddButtonRow({ label, onClick, children, subtle, text }: Props) {
  return (
    <div className="flex justify-start items-center gap-3 py-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Add New ${label}`}
        className={`group relative inline-flex items-center justify-center ${subtle ? "px-8 py-3.5 bg-[hsl(var(--nova-sand))] border-transparent" : "px-10 py-3.5 bg-[hsl(var(--nova-ink))]"} rounded-full border ${subtle ? "" : "border-[hsl(var(--nova-brass))]"} shadow-sm transition-all duration-300 ease-out hover:bg-[hsl(var(--nova-brass))] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--nova-brass))] focus-visible:ring-offset-2`}
      >
        <span className={`flex items-center gap-3 ${subtle ? "text-[hsl(var(--nova-ink))]" : "text-[hsl(var(--nova-sand))]"} group-hover:text-[hsl(var(--nova-ink))] transition-colors duration-300`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-80"
            aria-hidden
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className={`${"text-[15px]"} font-medium tracking-wide uppercase`}>
            {text ?? `Add New ${label}`}
          </span>
        </span>
        {!subtle && <span aria-hidden className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />}
      </button>
      {children}
    </div>
  );
}
