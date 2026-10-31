import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, FileText, Film, Image as ImageIcon, Loader2, Mic, Paperclip, Pencil, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ApprovalCard from "./ApprovalCard";
import ReviewProblems from "./ReviewProblems";
import { DEFAULT_UPLOADS, postToHelper } from "./helper";
import { useDesignChat } from "./DesignChatContext";
import { fmtDur, fmtSize, isWorking, problemsModel, visibleText, workHint, workLabel } from "./logic";
import { useAttachments } from "./useAttachments";
import { useHint } from "./useHint";
import { useVoice } from "./useVoice";
import { kindLabel, referenceKey, withReferences } from "./references";
import { useModeSwitch } from "./ModeSwitchContext";

const SUGGESTIONS = [
  "Make the headline larger",
  "Change the main button to our brand colour",
  "Add a short section about our showroom hours below the intro",
];

const fmtTime = (ts?: number) => (ts ? new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");

/**
 * The chat, always on the right of the Site Manager: what was said, the live "working on it" line, problems the person can
 * fix, the page they picked to work on, and the box to type in.
 */
export default function ChatPanel() {
  const { state, offline, refreshSoon, workingPage, clearWorkingPage, drawing, editing, preview, refs } = useDesignChat();
  const modeSwitch = useModeSwitch();
  const [text, setText] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [dragging, setDragging] = useState(false);
  const { hint, setHint } = useHint();
  const textRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = textRef.current; if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 150)}px`; } }, [text]);
  const fileRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const dragDepth = useRef(0);
  const valueRef = useRef("");
  valueRef.current = text;

  const attachments = useAttachments(state?.uploads, setHint);
  // A library item was picked in the top bar: put the cursor in the box so the person can say what to do with it.
  useEffect(() => { if (refs.focusTick) textRef.current?.focus(); }, [refs.focusTick]);
  const voice = useVoice(useCallback(() => valueRef.current, []), setText, setHint);

  const busy = Boolean(state?.busy);
  const working = isWorking(state);
  const messages = useMemo(
    () => (state?.history ?? []).map((e, i) => ({ e, i, shown: visibleText(e) })).filter((m) => m.shown !== null),
    [state?.history],
  );
  const problems = problemsModel(state);
  const rules = state?.uploads ?? DEFAULT_UPLOADS;

  // A clock for the working line.
  useEffect(() => {
    if (!working) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [working]);

  // Keep the newest message in view, unless the person has scrolled up to read.
  const onScroll = () => {
    const el = logRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  useLayoutEffect(() => {
    const el = logRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, working, problems?.title, state?.approval?.id]);

  // The box grows as the person types, up to half the window.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, Math.round(window.innerHeight * 0.5))}px`;
  }, [text]);

  const send = async () => {
    const message = text.trim();
    if (busy || offline) return;
    const hasDrawing = drawing.strokes.length > 0;
    // A service that hasn't been updated would drop the drawing and send the words alone, so don't send it at all.
    if (hasDrawing && state?.drawing !== true) {
      setHint("The design service hasn't been updated to take drawings yet, so this would be sent without your drawing. Ask whoever runs the service to update it, or remove the drawing and send again.", true);
      return;
    }
    if (!message) {
      if (hasDrawing) setHint("Say what you'd like done with your drawing.", true);
      else if (refs.references.length && !attachments.files.length) setHint("Say what you'd like done with the attached item(s).", true);
      else if (attachments.files.length) setHint(`Say what you'd like done with the attached file${attachments.files.length > 1 ? "s" : ""}.`, true);
      return;
    }
    if (attachments.uploading) { setHint("Still uploading your files. One moment."); return; }
    if (editing && (!modeSwitch || !await modeSwitch.requestChat())) return;
    voice.stop();
    // The drawing: ask the site what is under it, and take the picture if it was switched on.
    let marks: unknown;
    let image: string | null = null;
    if (hasDrawing) {
      setHint("Reading your drawing…");
      const d = await drawing.prepare();
      if (d) { marks = d.marks; image = d.image; }
    }
    const res = await postToHelper("/send", {
      message: withReferences(message, refs.references), uploadIds: attachments.ids(), ...(workingPage ? { page: workingPage } : {}),
      ...(marks ? { marks } : {}), ...(image ? { image } : {}),
    });
    if (res.ok) {
      const took = Number(res.data?.marks ?? 0);
      const expected = hasDrawing && marks ? (marks as { marks: unknown[] }).marks.length : 0;
      setText(""); attachments.clear(); refs.clearReferences(); drawing.cancel();
      setHint(expected && took !== expected ? "Your request was sent, but the service didn't take in your drawing." : expected ? `Sent with ${took} ${took === 1 ? "mark" : "marks"}${res.data?.picture ? " and a picture" : ""}.` : "", expected > 0 && took !== expected);
    } else setHint(res.error, true);
    refreshSoon();
  };


  const job = state?.job;
  const hintForWork = job && state ? workHint(job, state, now) : "";
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

  return (
    <section className="flex h-full flex-col bg-background min-h-0 overflow-hidden" aria-label="Design Chat">
      <div ref={logRef} onScroll={onScroll} className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 flex flex-col gap-2.5 text-sm", editing && "hidden")} role="log">
        {messages.length === 0 && (
          <div className="text-muted-foreground space-y-2">
            <p>Describe a change to the site. You'll see it in the Preview tab. To work on one page, pick it in the Pages tab. Nothing goes live until you press Submit for Review.</p>
            <p>
              {state?.review?.mode === "simulated"
                ? "Demo mode: your changes are checked once together by fixed rules, not by Claude reading the code, and they go live automatically if the check passes."
                : "When you submit, your changes are checked once together, and they go live automatically if the check passes."}
            </p>
            <p>Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => { setText(s); textRef.current?.focus(); }}
                  className="rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:bg-muted text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(({ e, i, shown }) => (
          <div key={i} className={cn(
            "max-w-[92%] rounded-lg px-3 py-2 whitespace-pre-wrap break-words leading-snug",
            e.role === "user" && "self-end bg-primary text-primary-foreground",
            e.role === "assistant" && "self-start bg-muted",
            e.role === "note" && "self-stretch max-w-none bg-amber-50 text-amber-900 text-xs",
            e.role === "error" && "self-stretch max-w-none bg-destructive/10 text-destructive",
          )}>
            {shown}
            {(e.role === "user" || e.role === "assistant") && e.ts ? <time className="mt-1 block text-[11px] opacity-70">{fmtTime(e.ts)}</time> : null}
          </div>
        ))}

        {working && job && state && (
          <div role="status" className="self-stretch grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 rounded-lg border bg-muted/60 px-3 py-2.5">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((n) => <i key={n} className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${n * 0.2}s` }} />)}
            </span>
            <span className="font-medium">{workLabel(job, now)}</span>
            <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">{fmtDur(now - job.startedAt)}</span>
            {hintForWork && <span className="col-span-3 text-xs text-muted-foreground">{hintForWork}</span>}
          </div>
        )}

        {state?.approval && <ApprovalCard approval={state.approval} onAnswered={refreshSoon} />}

        <ReviewProblems />
      </div>

      <form
        className={cn("border-t p-3 flex flex-col gap-2", editing && "[&>*:not(:last-child)]:hidden", dragging && "outline-2 outline-dashed outline-primary -outline-offset-4 bg-muted")}
        autoComplete="off"
        onSubmit={(e) => { e.preventDefault(); send(); }}
        onDragEnter={(e) => { if (hasFiles(e)) { e.preventDefault(); dragDepth.current++; setDragging(true); } }}
        onDragOver={(e) => { if (hasFiles(e)) e.preventDefault(); }}
        onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
        onDrop={(e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth.current = 0; setDragging(false); attachments.add(e.dataTransfer.files); }}
      >
        {workingPage && (
          <div className="flex items-center gap-2 rounded-md border bg-muted py-1 pl-2.5 pr-1 text-xs" aria-label="Page the chat is working on">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">
              <span className="text-muted-foreground">Working on </span>
              <strong>{workingPage.name}</strong>
              <span className="ml-1.5 font-mono text-muted-foreground">{workingPage.path}</span>
            </span>
            <button type="button" aria-label="Stop Working on This Page" title="Stop Working on This Page" onClick={clearWorkingPage}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {drawing.strokes.length > 0 && (
          <div className="flex items-center gap-2 rounded-md border bg-muted py-1 pl-2.5 pr-1 text-xs" aria-label="Your drawing on the preview">
            <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">
              <strong>{drawing.strokes.length} {drawing.strokes.length === 1 ? "mark" : "marks"}</strong>
              <span className="text-muted-foreground"> on the preview will be sent with this request{drawing.picture ? ", with a picture" : ""}</span>
            </span>
            <button type="button" aria-label="Remove the drawing" title="Remove the drawing" onClick={drawing.cancel}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {refs.references.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Library items for this request">
            {refs.references.map((r) => {
              const Icon = r.kind === "image" ? ImageIcon : r.kind === "video" ? Film : Box;
              return (
                <span key={referenceKey(r)} className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted py-0.5 pl-1 pr-1 text-xs">
                  {r.thumb ? <img src={r.thumb} alt="" className="h-5 w-5 rounded-full object-cover" /> : <Icon className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
                  <span className="text-muted-foreground">{kindLabel(r.kind)}</span>
                  <span className="max-w-[180px] truncate">{r.name}</span>
                  <button type="button" aria-label={`Remove ${r.name}`} onClick={() => refs.removeReference(referenceKey(r))}
                    className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {attachments.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Attached Files">
            {attachments.files.map((f) => (
              <span key={f.key} className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted py-0.5 pl-2.5 pr-1 text-xs">
                <span className="max-w-[220px] truncate">{f.name}</span>
                {f.status === "uploading"
                  ? <Loader2 className="h-3 w-3 animate-spin" aria-label="Uploading" />
                  : <span className="text-muted-foreground">{fmtSize(f.size)}</span>}
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => attachments.remove(f.key)}
                  className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <Textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
          onPaste={(e) => {
            const pasted = Array.from(e.clipboardData?.files ?? []);
            if (!pasted.length) return;
            e.preventDefault();
            attachments.addPasted(pasted);
          }}
          placeholder="Describe the change you want, for example: add a contact section with an email address and phone number"
          aria-label="Describe a Change"
          rows={2}
          onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 6 * 22 + 18)}px`; }}
          className="min-h-[62px] max-h-[150px] resize-none overflow-y-auto leading-snug"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept={rules.accept}
            onChange={(e) => { attachments.add(e.target.files); e.target.value = ""; }}
          />
          <Button type="button" variant="outline" size="icon" className="rounded-full shrink-0" title="Attach pictures or documents"
            aria-label="Attach pictures or documents" onClick={() => fileRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="button" variant={drawing.on ? "default" : "outline"} size="icon" className="rounded-full shrink-0"
            onClick={drawing.toggle} disabled={!drawing.available || !preview.loaded || editing} aria-pressed={drawing.on}
            aria-label={drawing.on ? "Stop drawing and remove the marks" : "Draw on the preview"}
            title={editing ? "Drawing isn't available while editing a page" : !drawing.available ? "Open the Preview tab to draw on it" : drawing.on ? "Stop drawing and remove the marks" : "Draw on the preview"}>
            <Pencil className="h-4 w-4" />
          </Button>
          {voice.supported && (
            <Button type="button" variant={voice.listening ? "destructive" : "outline"} size="icon"
              className={cn("rounded-full shrink-0", voice.listening && "animate-pulse")}
              title="Speak your request" aria-label="Speak your request" aria-pressed={voice.listening} onClick={voice.toggle}>
              <Mic className="h-4 w-4" />
            </Button>
          )}
          {(offline || hint.text) && <span role="status" className={cn("flex-1 min-w-0 text-xs", offline || hint.bad ? "text-destructive" : "text-muted-foreground")}>
            {offline ? "Can't reach the design service right now. It will keep trying." : hint.text}
          </span>}
          <Button type="submit" disabled={busy || offline || attachments.uploading} className="ml-auto gap-2">
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </section>
  );
}
