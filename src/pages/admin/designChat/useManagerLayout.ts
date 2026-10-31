import { useEffect, useState } from "react";

export type ManagerTier = "phone" | "tablet" | "laptop" | "wide";

export function tierFor(width: number): ManagerTier {
  if (width < 640) return "phone";
  if (width < 1024) return "tablet";
  if (width < 1280) return "laptop";
  return "wide";
}

/** Toolbar buttons show their words from this width; below it they become icons with hints (Save always keeps its word). */
export const LABEL_MIN_WIDTH = 1100;

export const PANEL_WIDTH_KEY = "nova-manager-panel-width";
export function clampPanelWidth(width: number, tier: ManagerTier): number {
  const min = tier === "tablet" ? 280 : 300;
  return Math.round(Math.min(420, Math.max(min, width)));
}

export function useManagerLayout() {
  const read = () => (typeof window === "undefined" ? 1440 : window.innerWidth);
  const [width, setWidth] = useState(read);
  useEffect(() => {
    const on = () => setWidth(read());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const tier = tierFor(width);
  return { width, tier, labels: width >= LABEL_MIN_WIDTH, phone: tier === "phone" };
}

/** Keeps `--kb-inset` on <html> equal to the part of the screen the on-screen keyboard covers. */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--kb-inset", `${Math.round(inset)}px`);
    };
    on();
    vv.addEventListener("resize", on);
    vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); document.documentElement.style.removeProperty("--kb-inset"); };
  }, []);
}
