import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RELOAD_KEY = "chunk:reloaded-at";

/**
 * `React.lazy` wrapper that survives stale deploys.
 *
 * After a rebuild, an open tab still holds the previous chunk hashes. Importing
 * one throws "Failed to fetch dynamically imported module" and blanks the
 * screen. We retry once, then force a single reload (guarded so we can never
 * loop) to pick up the fresh asset manifest.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      try {
        return await factory();
      } catch {
        const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? 0);
        if (Date.now() - last > 10_000) {
          window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
          window.location.reload();
          // Never resolves — the reload takes over.
          return await new Promise<{ default: T }>(() => {});
        }
        throw err;
      }
    }
  });
}
