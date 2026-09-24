import { Suspense, useEffect, useRef, useState } from "react";
import { objectRegistry } from "@/components/objects/registry";
import ObjectSections, { parseSections } from "@/components/ObjectSections";

const BASE_W = 1280;
const BASE_H = 800;

/** Small, non-interactive scaled-down render of an object, loaded when visible. */
export default function ObjectMiniPreview({
  componentKey, content, thumbnailUrl, width = 96, height = 60,
}: { componentKey?: string | null; content?: unknown; thumbnailUrl?: string | null; width?: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const scale = width / BASE_W;
  const sections = parseSections(content as any);
  const entry = componentKey ? objectRegistry[componentKey] : undefined;
  const C = entry?.component as React.ComponentType | undefined;

  let body: React.ReactNode = null;
  if (thumbnailUrl) {
    body = <img src={thumbnailUrl} alt="" className="w-full h-full object-cover object-top" />;
  } else if (visible && (sections.length || C)) {
    body = (
      <div
        inert
        aria-hidden
        className="pointer-events-none origin-top-left bg-background"
        style={{ width: BASE_W, minHeight: BASE_H, transform: `scale(${scale})` }}
      >
        <Suspense fallback={null}>
          {sections.length ? <ObjectSections sections={sections} /> : C ? <C /> : null}
        </Suspense>
      </div>
    );
  } else if (!sections.length && !C) {
    body = <div className="w-full h-full flex items-center justify-center text-[9px] uppercase tracking-wider text-muted-foreground">Empty</div>;
  }

  return (
    <div
      ref={ref}
      className="shrink-0 overflow-hidden rounded border bg-muted/30"
      style={{ width, height }}
    >
      {body}
    </div>
  );
}
