/**
 * PROTOTYPE MODE — in-memory data engine.
 *
 * This project runs as a clickable prototype: there is no backend, no auth and
 * no network. Everything the UI reads or writes lives in the arrays below and
 * resets on page refresh.
 *
 * The engine mimics the small slice of the supabase-js API the app uses:
 *   from(table).select/insert/update/upsert/delete + filters/order/limit
 *   storage.from(bucket).upload/remove/getPublicUrl/createSignedUrl(s)
 *   auth.*  (always signed in as a demo admin)
 *   functions.invoke(name)  (canned responses)
 */

export type Row = Record<string, any>;

export const db: Record<string, Row[]> = {};

export function table(name: string): Row[] {
  if (!db[name]) db[name] = [];
  return db[name];
}

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `id-${Math.random().toString(36).slice(2)}-${Date.now()}`);

const nowIso = () => new Date().toISOString();

export function slugify(input: string): string {
  const base = String(input || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "item";
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Insert defaults (stand in for the database defaults and triggers)   */
/* ------------------------------------------------------------------ */

const TABLE_DEFAULTS: Record<string, () => Row> = {
  pages: () => ({
    tags: [], notes: null, description: null, archived_at: null,
    page_type: "Static page", status: "Live", build_status: "draft",
    start_at: null, end_at: null, scaffold_dismissed: false,
    thumbnail_url: null, preview_url: null,
  }),
  objects: () => ({ tags: [], archived_at: null, status: "Planned", notes: null }),
  object_registry: () => ({
    labels: [], intended_pages: [], archived_at: null, status: "Draft",
    thumbnail_url: null, preview_url: null,
  }),
  images: () => ({ tags: [], archived_at: null, visibility: "gated" }),
  videos: () => ({ tags: [], archived_at: null, visibility: "gated", alt_text: "", description: "" }),
  tags: () => ({ parent_id: null, depth: 0, color_index: 0, scope: "images" }),
};

function applyDefaults(name: string, row: Row): Row {
  const out: Row = { ...(TABLE_DEFAULTS[name]?.() ?? {}), ...row };
  if (out.id == null) out.id = uid();
  if (!out.created_at) out.created_at = nowIso();
  if (!("updated_at" in out) || !out.updated_at) out.updated_at = nowIso();
  if ("slug_id" in out === false || !out.slug_id) {
    if (name === "pages" || name === "objects" || name === "object_registry") {
      out.slug_id = slugify(out.name ?? name);
    } else if (name === "images") {
      out.slug_id = slugify(out.filename ?? "image");
    } else if (name === "videos") {
      out.slug_id = slugify(out.name ?? "video");
    }
  }
  if (name === "tags" && out.parent_id) {
    const parent = table("tags").find((t) => t.id === out.parent_id);
    out.depth = (parent?.depth ?? 0) + 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

type Pred = (row: Row) => boolean;

const val = (row: Row, col: string) => row?.[col];

function likeToRegex(pattern: string, flags: string) {
  const escaped = String(pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/%/g, ".*").replace(/_/g, ".")}$`, flags);
}

/* ------------------------------------------------------------------ */
/* Query builder                                                       */
/* ------------------------------------------------------------------ */

interface Result<T = any> {
  data: T;
  error: null | { message: string };
  count: number | null;
  status: number;
  statusText: string;
}

class Query implements PromiseLike<Result> {
  private preds: Pred[] = [];
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row[] = [];
  private orderBy: { col: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private rangeSpec: { from: number; to: number } | null = null;
  private returning = false;
  private singleMode: "none" | "single" | "maybe" = "none";
  private countMode = false;
  private headMode = false;
  private onConflict: string | null = null;

  constructor(private name: string) {}

  /* --- verbs --- */
  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.op = "select";
    this.returning = true;
    if (opts?.count) this.countMode = true;
    if (opts?.head) this.headMode = true;
    return this;
  }
  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }
  upsert(payload: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    this.onConflict = opts?.onConflict ?? "id";
    return this;
  }
  update(patch: Row) {
    this.op = "update";
    this.payload = [patch];
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  /* --- filters --- */
  eq(col: string, v: any) { this.preds.push((r) => val(r, col) === v); return this; }
  neq(col: string, v: any) { this.preds.push((r) => val(r, col) !== v); return this; }
  gt(col: string, v: any) { this.preds.push((r) => val(r, col) > v); return this; }
  gte(col: string, v: any) { this.preds.push((r) => val(r, col) >= v); return this; }
  lt(col: string, v: any) { this.preds.push((r) => val(r, col) < v); return this; }
  lte(col: string, v: any) { this.preds.push((r) => val(r, col) <= v); return this; }
  in(col: string, list: any[]) {
    const set = new Set(list ?? []);
    this.preds.push((r) => set.has(val(r, col)));
    return this;
  }
  is(col: string, v: any) {
    this.preds.push((r) => (v === null ? val(r, col) == null : val(r, col) === v));
    return this;
  }
  not(col: string, op: string, v: any) {
    if (op === "is") this.preds.push((r) => (v === null ? val(r, col) != null : val(r, col) !== v));
    else if (op === "in") { const s = new Set(v ?? []); this.preds.push((r) => !s.has(val(r, col))); }
    else this.preds.push((r) => val(r, col) !== v);
    return this;
  }
  ilike(col: string, pattern: string) {
    const re = likeToRegex(pattern, "i");
    this.preds.push((r) => re.test(String(val(r, col) ?? "")));
    return this;
  }
  like(col: string, pattern: string) {
    const re = likeToRegex(pattern, "");
    this.preds.push((r) => re.test(String(val(r, col) ?? "")));
    return this;
  }
  contains(col: string, v: any[]) {
    this.preds.push((r) => {
      const arr = val(r, col);
      return Array.isArray(arr) && (v ?? []).every((x) => arr.includes(x));
    });
    return this;
  }
  overlaps(col: string, v: any[]) {
    this.preds.push((r) => {
      const arr = val(r, col);
      return Array.isArray(arr) && (v ?? []).some((x) => arr.includes(x));
    });
    return this;
  }
  match(obj: Row) {
    Object.entries(obj).forEach(([k, v]) => this.eq(k, v));
    return this;
  }
  filter(col: string, op: string, v: any) {
    switch (op) {
      case "eq": return this.eq(col, v);
      case "neq": return this.neq(col, v);
      case "in": return this.in(col, String(v).replace(/[()]/g, "").split(","));
      case "is": return this.is(col, v === "null" ? null : v);
      default: return this.eq(col, v);
    }
  }
  or(expr: string) {
    // Supports the simple "col.op.value,col.op.value" form used by the UI.
    const parts = String(expr).split(",").map((p) => p.trim()).filter(Boolean);
    const subs: Pred[] = parts.map((p) => {
      const [col, op, ...rest] = p.split(".");
      const raw = rest.join(".");
      if (op === "is") return (r: Row) => (raw === "null" ? val(r, col) == null : val(r, col) === raw);
      if (op === "ilike") { const re = likeToRegex(raw, "i"); return (r: Row) => re.test(String(val(r, col) ?? "")); }
      if (op === "neq") return (r: Row) => String(val(r, col)) !== raw;
      return (r: Row) => String(val(r, col)) === raw;
    });
    this.preds.push((r) => subs.some((f) => f(r)));
    return this;
  }

  /* --- shaping --- */
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  range(from: number, to: number) { this.rangeSpec = { from, to }; return this; }
  single() { this.singleMode = "single"; this.returning = true; return this; }
  maybeSingle() { this.singleMode = "maybe"; this.returning = true; return this; }
  throwOnError() { return this; }
  abortSignal() { return this; }
  returns() { return this; }
  csv() { return this; }

  /* --- execution --- */
  private matching(): Row[] {
    return table(this.name).filter((r) => this.preds.every((p) => p(r)));
  }

  private run(): Result {
    const rows = table(this.name);
    let out: Row[] = [];

    if (this.op === "insert") {
      out = this.payload.map((p) => applyDefaults(this.name, p));
      rows.unshift(...out);
    } else if (this.op === "upsert") {
      const key = this.onConflict ?? "id";
      out = this.payload.map((p) => {
        const keys = key.split(",").map((k) => k.trim());
        const existing = rows.find((r) => keys.every((k) => r[k] === p[k]));
        if (existing) {
          Object.assign(existing, p, { updated_at: nowIso() });
          return existing;
        }
        const created = applyDefaults(this.name, p);
        rows.unshift(created);
        return created;
      });
    } else if (this.op === "update") {
      out = this.matching();
      out.forEach((r) => Object.assign(r, this.payload[0], { updated_at: nowIso() }));
    } else if (this.op === "delete") {
      out = this.matching();
      const doomed = new Set(out);
      for (let i = rows.length - 1; i >= 0; i--) if (doomed.has(rows[i])) rows.splice(i, 1);
    } else {
      out = this.matching();
      for (const o of [...this.orderBy].reverse()) {
        out = [...out].sort((a, b) => {
          const av = a[o.col], bv = b[o.col];
          if (av === bv) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          const cmp = av > bv ? 1 : -1;
          return o.asc ? cmp : -cmp;
        });
      }
      if (this.rangeSpec) out = out.slice(this.rangeSpec.from, this.rangeSpec.to + 1);
      if (this.limitN != null) out = out.slice(0, this.limitN);
    }

    const count = this.countMode ? out.length : null;
    const clone = out.map((r) => ({ ...r }));

    if (this.headMode) {
      return { data: null, error: null, count, status: 200, statusText: "OK" };
    }
    if (this.singleMode !== "none") {
      if (clone.length === 0) {
        return this.singleMode === "maybe"
          ? { data: null, error: null, count, status: 200, statusText: "OK" }
          : { data: null, error: { message: "No rows found" }, count, status: 406, statusText: "Not Acceptable" };
      }
      return { data: clone[0], error: null, count, status: 200, statusText: "OK" };
    }
    if (!this.returning && this.op !== "select") {
      return { data: null, error: null, count, status: 200, statusText: "OK" };
    }
    return { data: clone, error: null, count, status: 200, statusText: "OK" };
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    let result: Result;
    try {
      result = this.run();
    } catch (e) {
      result = { data: null, error: { message: String((e as Error).message ?? e) }, count: null, status: 500, statusText: "Error" };
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const uploads = new Map<string, string>(); // `${bucket}/${path}` -> object URL
const pathAssets = new Map<string, string>(); // bucket-agnostic path -> bundled URL

function storageFrom(bucket: string) {
  const keyOf = (path: string) => `${bucket}/${path}`;
  const urlFor = (path: string) =>
    uploads.get(keyOf(path)) ?? pathAssets.get(path) ?? `/prototype-asset/${bucket}/${path}`;
  return {
    async upload(path: string, file: any) {
      try {
        if (typeof File !== "undefined" && file instanceof Blob) {
          uploads.set(keyOf(path), URL.createObjectURL(file));
        }
      } catch { /* ignore */ }
      return { data: { path, fullPath: keyOf(path) }, error: null };
    },
    async update(path: string, file: any) { return this.upload(path, file); },
    async remove(paths: string[]) {
      (paths ?? []).forEach((p) => uploads.delete(keyOf(p)));
      return { data: (paths ?? []).map((p) => ({ name: p })), error: null };
    },
    async list() { return { data: [], error: null }; },
    async download() { return { data: null, error: { message: "Downloads are disabled in prototype mode" } }; },
    getPublicUrl(path: string) {
      return { data: { publicUrl: urlFor(path) } };
    },
    async createSignedUrl(path: string) {
      return { data: { signedUrl: urlFor(path) }, error: null };
    },
    async createSignedUrls(paths: string[]) {
      return { data: (paths ?? []).map((p) => ({ path: p, signedUrl: urlFor(p) })), error: null };
    },
    async createSignedUploadUrl(path: string) {
      return { data: { signedUrl: urlFor(path), path, token: "prototype" }, error: null };
    },
  };
}

/** Register a real (bundled or remote) URL for a storage path. */
export function registerAsset(bucket: string, path: string, url: string) {
  uploads.set(`${bucket}/${path}`, url);
  pathAssets.set(path, url);
}

/* ------------------------------------------------------------------ */
/* Auth — always signed in as the demo admin                           */
/* ------------------------------------------------------------------ */

export const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@novalighting.com",
  created_at: "2026-01-05T16:00:00Z",
  last_sign_in_at: nowIso(),
  user_metadata: { full_name: "Demo Admin" },
  app_metadata: { provider: "prototype" },
};

const DEMO_SESSION = {
  access_token: "prototype-access-token",
  refresh_token: "prototype-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: DEMO_USER,
};

const auth = {
  async getSession() { return { data: { session: DEMO_SESSION }, error: null }; },
  async getUser() { return { data: { user: DEMO_USER }, error: null }; },
  onAuthStateChange(cb: (evt: string, session: any) => void) {
    setTimeout(() => cb("INITIAL_SESSION", DEMO_SESSION), 0);
    return { data: { subscription: { unsubscribe() {} } } };
  },
  async signInWithPassword() { return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null }; },
  async signInWithOAuth() { return { data: { provider: "prototype", url: null }, error: null }; },
  async signUp() { return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null }; },
  async signOut() { return { error: null }; },
  async updateUser() { return { data: { user: DEMO_USER }, error: null }; },
  async resetPasswordForEmail() { return { data: {}, error: null }; },
  async refreshSession() { return { data: { session: DEMO_SESSION, user: DEMO_USER }, error: null }; },
};

/* ------------------------------------------------------------------ */
/* Edge functions — canned responses                                   */
/* ------------------------------------------------------------------ */

import { demoReviews, demoUsers } from "./seed";

async function invoke(name: string, opts?: { body?: any }) {
  const body = opts?.body ?? {};
  switch (name) {
    case "verify-render-token":
      return { data: { valid: true }, error: null };
    case "admin-bootstrap":
      return { data: { ok: true, role: "admin" }, error: null };
    case "google-reviews":
      return { data: { reviews: demoReviews, aggregate: { rating: 4.9, count: 1284, locations: 6 }, fetchedAt: nowIso(), cached: true }, error: null };
    case "mailchimp-subscribe":
    case "contact-inquiry":
      return { data: { success: true, prototype: true }, error: null };
    case "admin-users":
      if (body?.action === "list" || !body?.action) return { data: { users: demoUsers }, error: null };
      return { data: { ok: true, prototype: true }, error: null };
    case "capture-thumbnail":
      return { data: { ok: false, skipped: "prototype", error: "Thumbnail capture is disabled in prototype mode" }, error: null };
    case "reverse-geocode":
      return { data: { place_name: "Salt Lake City, Utah" }, error: null };
    case "publish-assets":
    case "backfill-fallbacks":
      return { data: { ok: true, prototype: true, processed: 0 }, error: null };
    default:
      return { data: { ok: true, prototype: true }, error: null };
  }
}

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

export function createPrototypeClient() {
  return {
    from: (name: string) => new Query(name) as any,
    rpc: async (fn: string) => {
      if (fn === "has_role" || fn === "is_admin" || fn === "is_site_user") {
        return { data: true, error: null };
      }
      return { data: null, error: null };
    },
    storage: { from: storageFrom },
    auth,
    functions: { invoke },
    channel: () => ({
      on() { return this; },
      subscribe() { return this; },
      unsubscribe() { return Promise.resolve("ok"); },
    }),
    removeChannel: () => Promise.resolve("ok"),
  };
}
