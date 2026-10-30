import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Box, Image as ImageIcon, Video as VideoLucide, Shield, UserCircle2, KeyRound, LogOut, Camera, Eye, PanelLeftClose, PanelLeftOpen, Save, Trash2, Code, Loader2, Wrench } from "lucide-react";
import ChangeMyPasswordDialog from "./ChangeMyPasswordDialog";
import ChatPanel from "./designChat/ChatPanel";
import PreviewTools, { SubmitButton } from "./designChat/PreviewTools";
import { DesignChatProvider, useDesignChat } from "./designChat/DesignChatContext";
import { EditorSlotProvider, useEditorSlot } from "./designChat/EditorSlot";
import ConfirmDialog from "./ConfirmDialog";
import LibraryPicker from "./designChat/LibraryPicker";
import { toast } from "sonner";
import { ModeSwitchProvider } from "./designChat/ModeSwitchContext";
import ModeToggle from "./designChat/ModeToggle";
import HeaderActions from "./designChat/HeaderActions";
import ContentSyncNote from "./designChat/ContentSyncNote";
import ReviewChangesView from "./designChat/ReviewChangesView";
import { HEADER_HEIGHT_CLASS } from "./designChat/layout";
import { rememberTopDropAnchor } from "./designChat/TopDropPanel";
import ManualPageSwitcher, { useManualPageNavigation } from "./designChat/ManualPageSwitcher";
import ObjectEditorHeader, { type ObjectInfo } from "./designChat/ObjectEditorHeader";
import { requestObjectThumbnail } from "./objectThumbnailCapture";
import ManualHistoryControls from "./designChat/ManualHistoryControls";
import { manualHistoryShortcut } from "./designChat/manualEditHistory";
import { loadManualPages, workingPageFrom } from "./designChat/pageSelection";
import { referenceKey } from "./designChat/references";

const PagesTab = lazy(() => import("./PagesTab"));
const ObjectsTab = lazy(() => import("./ObjectsTab"));
const ImagesTab = lazy(() => import("./ImagesTab"));
const VideoTab = lazy(() => import("./VideoTab"));
const PreviewTab = lazy(() => import("./DesignChatTab"));
const DesignTab = lazy(() => import("./DesignTab"));

type TabKey = "preview" | "pages" | "objects" | "images" | "videos";

const TABS: { key: TabKey; label: string; Icon: typeof FileText }[] = [
  { key: "preview", label: "Preview", Icon: Eye },
  { key: "objects", label: "Objects", Icon: Box },
  { key: "images",  label: "Images",  Icon: ImageIcon },
  { key: "videos",  label: "Videos",  Icon: VideoLucide },
];

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-14 bg-muted rounded-lg" />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}

/**
 * The Site Manager: the design chat column always on the left, topped by the account menu and collapsible to a thin rail.
 * Tools (Pages and Capture) lives in the left header; the top bar starts with Preview, Objects, Images and Videos,
 * with Submit for Review at the right. Choosing a page in Pages points the chat at it. The chat and the
 * preview are kept alive while another tab is open, so nothing restarts when someone switches.
 */
export default function AdminIndex() {
  return (
    <DesignChatProvider>
      <EditorSlotProvider>
        <ModeSwitchProvider><AdminShell /></ModeSwitchProvider>
      </EditorSlotProvider>
    </DesignChatProvider>
  );
}

function AdminShell() {
  const designChat = useDesignChat();
  const { workingPage, editing, mode, stopEditing, clearWorkingPage, objectOpen, closeObject } = designChat;
  const manual = mode === "manual";
  const editingHeaderRef = useRef<HTMLDivElement>(null);
  const previousMode = useRef(mode);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    setAnnouncement(manual ? "Manual Edit Mode. You are editing by hand." : "Chat Mode. Claude makes the changes.");
    if (manual) editingHeaderRef.current?.focus();
    else requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Describe a Change"]')?.focus());
  }, [mode, manual]);
  const { setSlot, saveAll, discardAll, hasChanges, requestAdd, historyControls } = useEditorSlot();
  // Saves the editor's held changes, then leaves edit mode; on a failed save it stays in edit mode.
  const [finishing, setFinishing] = useState(false);
  // Save Changes is enabled only while the editor holds unsaved edits; editors expose that as a function, so it is checked often.
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!manual) { setDirty(false); return; }
    const check = () => setDirty(hasChanges());
    check();
    const id = window.setInterval(check, 400);
    return () => window.clearInterval(id);
  }, [manual, hasChanges]);
  useEffect(() => {
    if (!manual || finishing) return;
    const shortcut = (event: KeyboardEvent) => {
      const action = manualHistoryShortcut(event);
      if (!action) return;
      event.preventDefault(); historyControls?.[action]();
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [manual, finishing, historyControls]);
  const pageNavigation = useManualPageNavigation(finishing, setFinishing);
  const finishingRef = useRef(false);
  const finishEditing = async (thenClear = false) => {
    if (finishingRef.current) return false;
    finishingRef.current = true;
    setFinishing(true);
    try {
      const ok = await saveAll();
      if (ok) { stopEditing(); if (thenClear) clearWorkingPage(); }
      return ok;
    } finally { finishingRef.current = false; setFinishing(false); }
  };
  const [objectInfo, setObjectInfo] = useState<ObjectInfo | null>(null);
  // `?editObject=<id>` (Tools > Objects, or the old designer address) opens that object in the editor.
  const loc = useLocation();
  const opened = useRef<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const id = params.get("editObject");
    if (!id || opened.current === loc.search) return;
    opened.current = loc.search;
    const returnPage = params.get("returnPage");
    void loadManualPages().then((pages) => {
      const page = pages.find((p) => p.id === returnPage) ?? pages.find((p) => p.path === "/") ?? pages[0];
      if (!page) { toast.error("Couldn't open the object editor. Try again."); return; }
      designChat.selectPage(workingPageFrom(page));
      designChat.startEditing();
      designChat.openObject(id, params.get("section") ?? undefined, { from: returnPage && page.id === returnPage ? "page" : "objects" });
      navigate("/manage/preview", { replace: true });
    }).catch(() => toast.error("Couldn't open the object editor. Try again."));
  }, [loc.search]); // eslint-disable-line react-hooks/exhaustive-deps
  const leaveObject = () => {
    const fromObjects = objectOpen?.from === "objects";
    closeObject();
    if (fromObjects) { stopEditing(); navigate("/manage/objects"); }
  };
  useEffect(() => { if (!objectOpen) setObjectInfo(null); }, [objectOpen]);
  const saveChanges = async () => {
    const had = hasChanges();
    if (objectOpen) {
      // Object editor: save the object, refresh its thumbnail, then go back to the page scrolled to it.
      if (finishingRef.current) return;
      finishingRef.current = true; setFinishing(true);
      try {
        const ok = await saveAll();
        if (!ok) return;
        if (had) { toast.success("Changes saved."); void requestObjectThumbnail(objectOpen.id, true).catch(() => {}); }
        // Opened from Tools > Objects, saving stays in the object editor.
        if (objectOpen.from !== "objects") closeObject();
      } finally { finishingRef.current = false; setFinishing(false); }
      return;
    }
    const ok = await finishEditing();
    if (ok && had) toast.success("Changes saved.");
  };
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const doDiscard = async () => { try { await discardAll(); stopEditing(); toast("Changes discarded."); } catch { /* Keep editing if restoration failed. */ } };
  const discardEditing = () => { if (!hasChanges()) doDiscard(); else setConfirmDiscard(true); };
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = useMemo(() => {
    const seg = location.pathname.split("/")[2];
    if (seg === "preview" || seg === "objects" || seg === "images" || seg === "videos") return seg as TabKey;
    return "pages";
  }, [location.pathname]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [pwOpen, setPwOpen] = useState(false);
  // The chat column can be collapsed to a thin rail; remembered in this browser (without storage it just starts expanded).
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("siteManager:chatCollapsed") === "true"; } catch { return false; }
  });
  const reviewShown = designChat.reviewOpen && !manual && !chatCollapsed;
  useEffect(() => {
    try { localStorage.setItem("siteManager:chatCollapsed", String(chatCollapsed)); } catch { /* no storage: ignore */ }
  }, [chatCollapsed]);
  // Editing only exists on the Preview tab.
  useEffect(() => { if (tab !== "preview" && editing) void finishEditing(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  // Entering edit mode opens a collapsed chat column; leaving it puts it back the way it was.
  const collapsedBeforeEdit = useRef<boolean | null>(null);
  useEffect(() => {
    if (editing) {
      if (collapsedBeforeEdit.current === null) {
        collapsedBeforeEdit.current = chatCollapsed;
        if (chatCollapsed) setChatCollapsed(false);
      }
    } else if (collapsedBeforeEdit.current !== null) {
      setChatCollapsed(collapsedBeforeEdit.current);
      collapsedBeforeEdit.current = null;
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps
  const checkedFor = useRef<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  // How much of the top bar has to be shortened to fit: 0 = everything, 1 = only the open tab's name, 2 = also the size buttons, 3 = no names at all (icons with hints).
  const [squeeze, setSqueeze] = useState(0);
  const compact = squeeze >= 1;
  const [, setTick] = useState(0);
  const needsMeasure = useRef(true);
  // Once the Preview tab has been opened it stays alive (hidden) behind the other tabs, so it doesn't reload.
  const [previewOpened, setPreviewOpened] = useState(tab === "preview");
  useEffect(() => { if (tab === "preview") setPreviewOpened(true); }, [tab]);

  // Does the top bar fit? Show everything, measure, and shorten step by step until it does. Redone when the window changes
  // size and when the bar's other buttons change (they differ between tabs).
  const remeasure = () => { needsMeasure.current = true; setSqueeze(0); setTick((t) => t + 1); };
  useLayoutEffect(() => {
    if (!needsMeasure.current) return;
    const nav = navRef.current;
    const row = rowRef.current;
    if (((nav && nav.scrollWidth - nav.clientWidth > 1) || (row && row.scrollWidth - row.clientWidth > 1)) && squeeze < 3) setSqueeze(squeeze + 1);
    else needsMeasure.current = false;
  });
  useLayoutEffect(() => { remeasure(); }, [tab, isAdmin, editing]);
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let width = row.clientWidth;
    const ro = new ResizeObserver(() => { if (row.clientWidth !== width) { width = row.clientWidth; remeasure(); } });
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) { if (mounted) { setIsAdmin(false); setEmail(""); } return; }
      if (mounted) setEmail(userRes.user?.email ?? "");
      if (checkedFor.current === uid) return;
      const { data } = await (supabase as any).rpc("has_role", { _user_id: uid, _role: "admin" });
      if (!mounted) return;
      checkedFor.current = uid;
      setIsAdmin(!!data);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === "SIGNED_OUT") { checkedFor.current = null; setIsAdmin(false); return; }
      if (evt === "SIGNED_IN") { checkedFor.current = null; check(); }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      <div className="flex h-screen flex-col overflow-hidden bg-background lg:flex-row">
        {/* Right: the top bar and whichever tab is open. */}
        <div data-picker-area className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header data-top-bar className={cn("z-30 w-full shrink-0 border-b bg-background", HEADER_HEIGHT_CLASS)}>
            <div ref={rowRef} className="flex h-full w-full items-center gap-1 px-2 sm:gap-3 sm:px-4">
              <nav ref={navRef} className="flex-1 min-w-0 flex flex-nowrap items-center gap-1 overflow-hidden" aria-label="Site Manager Sections">
                {TABS.map(({ key, label, Icon }) => {
                  const active = tab === key;
                  const className = `inline-flex shrink-0 items-center gap-2 whitespace-nowrap ${compact ? (active && squeeze < 3 ? "px-2.5" : "w-8 px-0") : "px-3"} py-2 rounded-md text-sm font-medium transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                  }`;
                  const showLabel = !compact || (active && squeeze < 3);
                  // On the Preview, Objects, Images and Videos pick an item for the chat; on a management tab, or while editing by hand, they navigate.
                  if (!editing && tab === "preview" && (key === "objects" || key === "images" || key === "videos")) return (
                    <LibraryPicker key={key} kind={key} label={label} Icon={Icon} active={active} showLabel={showLabel} className={className}
                      addedRefs={designChat.refs.references}
                      onDeselectAll={(refKind) => { for (const r of designChat.refs.references) if (r.kind === refKind) designChat.refs.removeReference(referenceKey(r)); }}
                      onPick={(ref) => { if (designChat.refs.references.some(r => r.kind === ref.kind && r.id === ref.id)) designChat.refs.removeReference(referenceKey(ref)); else designChat.refs.addReference(ref); setChatCollapsed(false); }}
                      onOpenFull={() => navigate(`/manage/${key}`)} />
                  );
                  // In Manual Edit Mode they open the editor's picker and add the choice beneath the original, staying in the editor.
                  const addInEditor = manual && tab === "preview" && !objectOpen && (key === "objects" || key === "images" || key === "videos");
                  return (
                    <Button variant="ghost" size="sm"
                      key={key}
                      onClick={(event) => { if (addInEditor) { rememberTopDropAnchor(event.currentTarget); if (requestAdd(key)) return; } navigate(`/manage/${key}`); }}
                      title={label}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      className={`${className} data-[picker-open=true]:bg-accent data-[picker-open=true]:text-accent-foreground`}
                    >
                      <Icon className="w-4 h-4" />
                      {showLabel && <span>{label}</span>}
                    </Button>
                  );
                })}
              </nav>

              <PreviewTools showViewControls={tab === "preview"} tight={squeeze >= 2} />

              <div aria-hidden className={cn("h-9 w-px bg-border shrink-0", compact && "hidden")} />
              {!manual && !editing && <SubmitButton compact={compact} />}
              {manual && (
                <><span aria-live="polite" className="max-w-28 shrink-0 text-xs text-muted-foreground">{dirty ? `${Math.max(1, historyControls?.changeCount ?? 0)} unsaved ${Math.max(1, historyControls?.changeCount ?? 0) === 1 ? "change" : "changes"}` : ""}</span>
                <Button type="button" size="sm" variant={dirty ? "default" : "outline"} className="shrink-0 gap-1.5" aria-label="Save Changes" title="Save Changes" disabled={finishing || !dirty} onClick={() => void saveChanges()}>
                  <Save className="h-4 w-4" aria-hidden />{!compact && (finishing ? "Saving…" : "Save Changes")}
                </Button></>
              )}

            </div>
          </header>

          <ChangeMyPasswordDialog open={pwOpen} onOpenChange={setPwOpen} />

          <div className="relative min-h-0 flex-1">
          <main className="relative h-full overflow-y-auto">
            {previewOpened && (
              <div className={tab === "preview" && !editing ? "h-full" : "hidden"}>
                <Suspense fallback={null}>
                  <PreviewTab />
                </Suspense>
              </div>
            )}
            {tab === "preview" && editing && workingPage?.id && (
              <div className="h-full w-full">
                <Suspense fallback={<TabSkeleton />}>
                  {objectOpen ? (
                    <DesignTab key={`object-${objectOpen.id}`} embedded pageId={workingPage.id} objectId={objectOpen.id} onObjectInfo={setObjectInfo} />
                  ) : (
                    <DesignTab key={workingPage.id} embedded pageId={workingPage.id} onNavigate={pageNavigation.requestPath} returnTo={designChat.returnTo} />
                  )}
                </Suspense>
              </div>
            )}
            {tab !== "preview" && (
              <div className="w-full px-6 py-6">
                <Suspense fallback={<TabSkeleton />}>
                  {tab === "pages" && <PagesTab />}
                  {tab === "objects" && <ObjectsTab />}
                  {tab === "images" && <ImagesTab />}
                  {tab === "videos" && <VideoTab />}
                </Suspense>
              </div>
            )}
          </main>
          {manual && <div data-manual-outline aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 ring-1 ring-inset ring-manual" />}
          </div>
        </div>

        {/* Left: the chat column, on every tab, with its own header (account and collapse).
            Collapsed, it shrinks to a thin rail with an expand button; the chat stays mounted (hidden) so typed text and attachments survive. */}
        <aside
          className={cn(
            "flex shrink-0 flex-col border-t lg:order-first lg:h-screen lg:border-r lg:border-t-0 lg:transition-[width] lg:duration-200",
            chatCollapsed && !manual ? "h-auto lg:w-12" : "h-[45vh] lg:w-[clamp(320px,26vw,400px)]",
          )}
          aria-label={manual ? "Manual Mode" : "Chat"}
        >
          <div data-chat-header className={cn("flex shrink-0", HEADER_HEIGHT_CLASS, " items-center gap-2 border-b bg-background px-3", chatCollapsed && !manual && "h-auto flex-wrap px-1.5 py-2 lg:flex-col lg:flex-nowrap")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 shrink-0 gap-2 px-0" aria-label="Account Menu">
                    <UserCircle2 className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                        <Shield className="w-4 h-4 mr-2" /> Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/manage/developer")}>
                        <Code className="w-4 h-4 mr-2" /> Developer Review
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setPwOpen(true)}>
                    <KeyRound className="w-4 h-4 mr-2" /> Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            <TooltipProvider delayDuration={200}>
              <DropdownMenu>
                <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild>
                  <Button variant={tab === "pages" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 shrink-0"
                    aria-label="Tools" aria-pressed={tab === "pages"} aria-current={tab === "pages" ? "page" : undefined}>
                    <Wrench className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger></TooltipTrigger><TooltipContent>Tools</TooltipContent></Tooltip>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => navigate("/manage/pages")} aria-current={tab === "pages" ? "page" : undefined}
                    className={tab === "pages" ? "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground" : undefined}>
                    <FileText className="mr-2 h-4 w-4" aria-hidden />Pages
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/manage/capture")}>
                    <Camera className="mr-2 h-4 w-4" aria-hidden />Capture
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipProvider>
            <HeaderActions />
            <div className={cn("flex-1", chatCollapsed && !manual && "hidden")} />
            {manual && <ManualHistoryControls disabled={finishing} />}
            {!manual && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={chatCollapsed ? "Expand Chat" : "Collapse Chat"} title={chatCollapsed ? "Expand Chat" : "Collapse Chat"} aria-expanded={!chatCollapsed} onClick={() => setChatCollapsed(!chatCollapsed)}>
              {chatCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>}
          </div>
          {!reviewShown && <ModeToggle collapsed={chatCollapsed && !manual} onChat={() => setChatCollapsed(false)} />}
          <ContentSyncNote />
          {reviewShown && <ReviewChangesView onShowPreview={() => { if (tab !== "preview") navigate("/manage/preview"); }} />}
          {manual && workingPage && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={editingHeaderRef} tabIndex={-1} className="flex shrink-0 flex-col gap-2 border-b px-3 py-3">
                {designChat.state?.busy && <p role="status" className="flex items-center gap-1.5 text-xs font-medium"><Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />Claude Is Still Working on a Change</p>}
                {objectOpen
                  ? <ObjectEditorHeader info={objectInfo} backLabel={objectOpen.from === "objects" ? "Back to Objects" : `Back to ${workingPage.name}`} disabled={finishing} onLeave={leaveObject} />
                  : <ManualPageSwitcher navigation={pageNavigation} />}
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="flex-1 gap-1.5" disabled={finishing || !dirty} onClick={discardEditing}><Trash2 className="h-4 w-4" aria-hidden />Discard Changes</Button>
                </div>
              </div>
              <div ref={setSlot} aria-label="Page Editing Options" role="region" className="min-h-0 flex-1 overflow-y-auto" />
            </div>
          )}
          <div hidden={manual || chatCollapsed || reviewShown} className={cn("min-h-0 flex-1", (manual || chatCollapsed || reviewShown) && "hidden")} aria-hidden={manual || chatCollapsed || reviewShown}>
            <ChatPanel />
          </div>
        </aside>
      </div>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard Your Changes?"
        description="Everything you changed since your last save in this editor will be lost. This can't be undone."
        confirmLabel="Discard Changes"
        onConfirm={() => { setConfirmDiscard(false); doDiscard(); }}
      />
    </>
  );
}
