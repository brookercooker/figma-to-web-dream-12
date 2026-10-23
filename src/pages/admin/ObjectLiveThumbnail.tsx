import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "lucide-react";
import { objectRegistry } from "@/components/objects/registry";
import { ThumbnailContext } from "@/lib/thumbnail";

const MAX_LIVE = 12;
const MOUNT_TIMEOUT = 8000;
const leases = new Map<object, { active: boolean; update: (active: boolean) => void }>();
function allocate() {
  let count = [...leases.values()].filter((entry) => entry.active).length;
  for (const entry of leases.values()) {
    if (!entry.active && count < MAX_LIVE) {
      entry.active = true; count++; entry.update(true);
    }
  }
}
function requestLease(key: object, update: (active: boolean) => void) {
  leases.set(key, { active: false, update }); allocate();
  return () => { leases.delete(key); allocate(); };
}

class PreviewBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Mounted({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return null;
}

/** Read-only miniature; viewport leases bound the number of real components mounted. */
export default function ObjectLiveThumbnail({ componentKey, storedThumb }: {
  componentKey?: string | null; storedThumb?: string | null;
}) {
  const cell = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const committed = useRef(false);
  const entry = componentKey ? objectRegistry[componentKey] : undefined;
  useEffect(() => { setFailure(null); committed.current = false; }, [componentKey, storedThumb]);
  useEffect(() => {
    const el = cell.current;
    if (!el || storedThumb || !entry) return;
    if (typeof ResizeObserver === "undefined" || typeof IntersectionObserver === "undefined") {
      setFailure("Preview observers unavailable"); return;
    }
    const resize = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width));
    setWidth(el.getBoundingClientRect().width); resize.observe(el);
    const observer = new IntersectionObserver(([item]) => setVisible(item?.isIntersecting ?? false), { rootMargin: "80px" });
    observer.observe(el);
    return () => { resize.disconnect(); observer.disconnect(); };
  }, [entry, storedThumb]);
  useEffect(() => {
    if (!visible || !entry || storedThumb || failure || width <= 0) { setActive(false); return; }
    return requestLease({}, setActive);
  }, [visible, entry, storedThumb, failure, width > 0]);
  useEffect(() => {
    if (!active) return;
    committed.current = false;
    const timer = window.setTimeout(() => { if (!committed.current) setFailure("Component mount timed out"); }, MOUNT_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [active, componentKey]);
  const Live = entry?.component;
  const fallback = !storedThumb && (!Live || failure);
  return (
    <div ref={cell} aria-hidden="true" {...{ inert: "" }}
      data-object-thumbnail={storedThumb ? "stored" : fallback ? "fallback" : active ? "live" : "pending"}
      data-preview-reason={fallback ? failure ?? "Component not registered" : undefined}
      className="relative h-full w-full overflow-hidden bg-muted pointer-events-none">
      {storedThumb ? <img src={storedThumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        : fallback ? <span className="grid h-full w-full place-items-center"><Box className="h-8 w-8 text-muted-foreground" /></span>
        : active && Live ? <PreviewBoundary key={componentKey} onError={() => setFailure("Component threw while rendering")}>
          <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-muted" />}>
            <div className="absolute left-0 top-0 bg-background text-foreground" style={{ width: 1280, transform: `scale(${width / 1280})`, transformOrigin: "top left" }}>
              <ThumbnailContext.Provider value={true}><Live /></ThumbnailContext.Provider>
              <Mounted onMount={() => { committed.current = true; }} />
            </div>
          </Suspense>
        </PreviewBoundary> : <div className="absolute inset-0 animate-pulse bg-muted" />}
    </div>
  );
}