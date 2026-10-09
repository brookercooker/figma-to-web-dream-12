import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const RELAY = (import.meta.env.VITE_DESIGN_RELAY_URL as string | undefined)?.replace(/\/$/, "") || "http://127.0.0.1:4321/__prototyper";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const EMBED_FN = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/lovable-embed-url` : "";

type Entry = { role: "user" | "assistant" | "note" | "error"; text: string };
type RelayState = { busy: boolean; job: { status: string } | null; previewVersion: number; history: Entry[] };

const STATUS_TEXT: Record<string, string> = {
  sending: "Sending your request…",
  working: "Designing your change…",
  publishing: "Finishing up…",
  updating: "Updating the preview…",
  paused: "Waiting for an approval",
};
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export default function DesignChatTab() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [relay, setRelay] = useState<RelayState | null>(null);
  const [relayDown, setRelayDown] = useState(false);
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const lastVersion = useRef<number | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout>>();
  const logEnd = useRef<HTMLDivElement>(null);

  const loadPreview = useCallback(async () => {
    if (!EMBED_FN) { setPreviewError("The preview isn't set up yet."); return; }
    try {
      const res = await fetch(EMBED_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(SUPABASE_KEY ? { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } : {}) },
        body: JSON.stringify({ parent_origin: window.location.origin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.embed_url) throw new Error(data.error || "Couldn't load the preview.");
      setEmbedUrl(data.embed_url);
      setPreviewError(null);
      clearTimeout(expiryTimer.current);
      const wait = Math.max(30_000, new Date(data.expires_at).getTime() - Date.now() - REFRESH_MARGIN_MS);
      expiryTimer.current = setTimeout(loadPreview, wait);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Couldn't load the preview.");
    }
  }, []);

  useEffect(() => { loadPreview(); return () => clearTimeout(expiryTimer.current); }, [loadPreview]);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`${RELAY}/api/state`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const s: RelayState = await res.json();
        if (stop) return;
        setRelay(s);
        setRelayDown(false);
        if (lastVersion.current !== null && s.previewVersion !== lastVersion.current) loadPreview();
        lastVersion.current = s.previewVersion;
      } catch {
        if (!stop) setRelayDown(true);
      }
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => { stop = true; clearInterval(t); };
  }, [loadPreview]);

  useEffect(() => { logEnd.current?.scrollIntoView?.({ block: "end" }); }, [relay?.history.length]);

  const send = async () => {
    const message = text.trim();
    if (!message || relay?.busy) return;
    setSendError(null);
    try {
      const res = await fetch(`${RELAY}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send that.");
      setText("");
    } catch (e) {
      setSendError(e instanceof TypeError ? "The design helper isn't reachable. Start it on this computer, then try again." : (e as Error).message);
    }
  };

  const busy = Boolean(relay?.busy);
  const status = busy && relay?.job ? STATUS_TEXT[relay.job.status] ?? "Working…" : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr] h-[calc(100vh-8rem)]">
      <section className="flex flex-col border rounded-lg bg-background min-h-0" aria-label="Design chat">
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm" role="log">
          {(relay?.history ?? []).length === 0 && (
            <p className="text-muted-foreground">Describe a change to the design, for example "make the headline larger".</p>
          )}
          {(relay?.history ?? []).map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-8 rounded-lg bg-primary text-primary-foreground px-3 py-2" : m.role === "error" ? "rounded-lg bg-destructive/10 text-destructive px-3 py-2" : "mr-8 rounded-lg bg-muted px-3 py-2"}>
              {m.text}
            </div>
          ))}
          <div ref={logEnd} />
        </div>
        <div className="border-t p-3 space-y-2">
          {relayDown && <p className="text-xs text-destructive">The design helper isn't running on this computer.</p>}
          {sendError && <p className="text-xs text-destructive" role="alert">{sendError}</p>}
          {status && <p className="text-xs text-muted-foreground" aria-live="polite">{status}</p>}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Describe a change…"
            rows={3}
            aria-label="Describe a change"
          />
          <Button onClick={send} disabled={!text.trim() || busy || relayDown} className="w-full gap-2">
            <Send className="w-4 h-4" /> Send
          </Button>
        </div>
      </section>

      <section className="flex flex-col border rounded-lg bg-background min-h-0" aria-label="Preview">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Preview</span>
          <Button variant="outline" size="sm" className="gap-2" onClick={loadPreview}>
            <RefreshCw className="w-4 h-4" /> Reload
          </Button>
        </div>
        {embedUrl ? (
          <iframe key={embedUrl} src={embedUrl} title="Design preview" className="flex-1 w-full rounded-b-lg bg-white" />
        ) : (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-6 text-center">
            {previewError ?? "Loading the preview…"}
          </div>
        )}
      </section>
    </div>
  );
}
