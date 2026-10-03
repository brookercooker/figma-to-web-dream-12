import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pipeline connection test -- staff chat tab.
 *
 * This is the real-infra counterpart to the "simple-seed-site" pipeline test
 * (see claude/pipeline-test-plan.md in the Nova Lighting project): same shape
 * (chat -> live Lovable preview -> explicit submit-for-review -> request
 * feed), applied to the real Brooklyn Prototype project/repo instead of the
 * disposable test site, to prove the real GitHub/Lovable/Cloudflare/Supabase
 * wiring actually works end to end.
 *
 * Deliberate scope note: unlike the rest of this app (which currently reads
 * from the in-memory `@/prototype/client` mock -- see that file's own
 * comment), this tab is the one place that talks to the REAL Supabase
 * project already provisioned for Brooklyn Prototype. It follows the same
 * RLS convention as the rest of that schema (`is_site_user()` gates writes,
 * `authenticated` can read) -- see the migration applied alongside this
 * file. Nothing here touches the mocked Pages/Objects/Images/Videos tabs.
 */

const LOVABLE_PREVIEW_URL =
  "https://id-preview--f9b2e62f-9648-44be-ad77-9e823be093ea.lovable.app";

type RequestStatus =
  | "queued"
  | "lovable_designing"
  | "claude_reviewing"
  | "draft_ready"
  | "published"
  | "rejected"
  | "failed";

interface DesignMessage {
  id: string;
  body: string;
  sender: "staff" | "claude";
  created_at: string;
}

interface ChatRequest {
  id: string;
  prompt: string;
  status: RequestStatus;
  preview_url: string | null;
  draft_branch: string | null;
  claude_notes: string | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  queued: "Queued",
  lovable_designing: "Lovable is designing…",
  claude_reviewing: "Claude is reviewing…",
  draft_ready: "Draft ready",
  published: "Published",
  rejected: "Rejected",
  failed: "Failed",
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const variant =
    status === "draft_ready" || status === "published"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

export default function ChatTab() {
  const [sessionReady, setSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [messages, setMessages] = useState<DesignMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [requests, setRequests] = useState<ChatRequest[]>([]);

  // Ensure there's a signed-in user to satisfy is_site_user()-gated writes.
  // Mirrors the pipeline test's useStaffSession, trimmed to this one tab.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (mounted) setSessionReady(true);
        return;
      }
      const { error } = await supabase.auth.signInAnonymously();
      if (!mounted) return;
      if (error) {
        setAuthError(error.message);
        return;
      }
      setSessionReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    let mounted = true;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("design_messages" as any)
        .select("id, body, sender, created_at")
        .order("created_at", { ascending: true })
        .limit(200);
      if (mounted && data) setMessages(data as unknown as DesignMessage[]);
    };
    const loadRequests = async () => {
      const { data } = await supabase
        .from("chat_requests" as any)
        .select("id, prompt, status, preview_url, draft_branch, claude_notes, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (mounted && data) setRequests(data as unknown as ChatRequest[]);
    };
    loadMessages();
    loadRequests();

    const channel = supabase
      .channel("manage-chat-tab")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "design_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as unknown as DesignMessage]);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_requests" },
        () => {
          loadRequests();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionReady]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from("design_messages" as any).insert({ body, sender: "staff" });
    setSending(false);
    if (error) {
      toast.error(`Couldn't send: ${error.message}`);
      return;
    }
    setDraft("");
  }

  async function submitForReview() {
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.from("chat_requests" as any).insert({
      prompt: note.trim() || "Review the latest Lovable changes from the live design chat above.",
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setNote("");
    setSubmitted(true);
    toast.success("Submitted for review");
  }

  if (authError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Couldn't start a session: {authError}. Double-check Anonymous Sign-ins is enabled in this
        project's Supabase Auth settings.
      </div>
    );
  }
  if (!sessionReady) {
    return <div className="text-sm text-muted-foreground">Starting session…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Pipeline connection test — this tab talks to the real Supabase project behind Brooklyn
        Prototype, independent of the mocked data the rest of Site Manager shows right now.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-md border border-border">
          <div className="border-b border-border px-3 py-2 text-sm font-medium text-foreground">
            Design chat
          </div>
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: 360 }}>
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No messages yet — type a change below and watch it happen in the live preview.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                  m.sender === "staff"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.body}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Describe a change…"
              rows={2}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button type="button" onClick={sendMessage} disabled={sending || !draft.trim()} className="self-end gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-muted/30 p-6 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Live preview — unreviewed, Lovable's raw output
          </p>
          <p className="text-sm text-muted-foreground">
            Opens in a new tab — Lovable's login doesn't carry over when embedded here.
          </p>
          <Button asChild>
            <a href={LOVABLE_PREVIEW_URL} target="_blank" rel="noreferrer" className="gap-2">
              Open live preview <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
        <p className="text-sm font-medium text-foreground">Happy with it?</p>
        <p className="text-xs text-muted-foreground">
          Submitting creates a chat_requests row for the reviewer to pick up — nothing goes live
          until a build is reviewed and approved.
        </p>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the reviewer"
          rows={2}
          disabled={submitting}
        />
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        {submitted && <p className="text-sm text-primary">Submitted — see the feed below.</p>}
        <Button
          type="button"
          onClick={() => {
            setSubmitted(false);
            submitForReview();
          }}
          disabled={submitting}
          className="self-start"
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Requests</p>
        {requests.length === 0 && (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{r.prompt}</p>
              {r.error_message && (
                <p className="mt-1 text-xs text-destructive">{r.error_message}</p>
              )}
              {r.preview_url && (
                <a
                  href={r.preview_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Draft preview <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
