/** Public markup is authoritative; never embed the Manager's bundled visitor routes. */
export const DEFAULT_PUBLIC_PREVIEW = "https://id-preview--aeb60cc1-b08d-4938-9d83-88c44335e167.lovable.app";

export function publicPreviewBase(embed: unknown, configured = import.meta.env.VITE_PUBLIC_SITE_URL || DEFAULT_PUBLIC_PREVIEW): string {
  const publicUrl = new URL(configured);
  if (publicUrl.protocol !== "https:" || publicUrl.origin === window.location.origin) throw new Error("The public preview address isn't available.");
  // An embed token belongs only to the project that issued it, never another project's origin.
  if (typeof embed === "string") {
    try {
      const signed = new URL(embed);
      if (signed.origin === publicUrl.origin) { signed.pathname = "/"; signed.hash = ""; signed.searchParams.delete("nova-edit"); return signed.toString(); }
    } catch { /* Use the public address, never a local saved copy. */ }
  }
  publicUrl.pathname = "/";
  publicUrl.hash = "";
  publicUrl.searchParams.delete("nova-edit");
  return publicUrl.toString();
}

export function publicPreviewPage(base: string, path: string | null): string {
  const url = new URL(base);
  const page = new URL(path || "/", url.origin);
  if (page.origin !== url.origin || /[\\\u0000-\u001f]/.test(path || "")) throw new Error("This preview page isn't available.");
  url.pathname = page.pathname === "/home" ? "/" : page.pathname;
  page.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.delete("nova-edit");
  url.hash = page.hash;
  return url.toString();
}