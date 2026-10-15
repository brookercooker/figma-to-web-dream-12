import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Box, Image as ImageIcon, Video as VideoLucide, Shield, UserCircle2, KeyRound, LogOut, Camera, Eye, PanelLeftClose, PanelLeftOpen, Pencil } from "lucide-react";
import ChangeMyPasswordDialog from "./ChangeMyPasswordDialog";
import SiteManagerLogo from "./SiteManagerLogo";
import ChatPanel from "./designChat/ChatPanel";
import PreviewTools, { SubmitButton } from "./designChat/PreviewTools";
import { DesignChatProvider, useDesignChat } from "./designChat/DesignChatContext";
import { EditorSlotProvider, useEditorSlot } from "./designChat/EditorSlot";
import ConfirmDialog from "./ConfirmDialog";
import { toast } from "sonner";

const PagesTab = lazy(() => import("./PagesTab"));
const ObjectsTab = lazy(() => import("./ObjectsTab"));
const ImagesTab = lazy(() => import("./ImagesTab"));
const VideoTab = lazy(() => import("./VideoTab"));
const PreviewTab = lazy(() => import("./DesignChatTab"));
const DesignTab = lazy(() => import("./DesignTab"));
const ObjectDesignPage = lazy(() => import("./ObjectDesignPage"));

type TabKey = "preview" | "pages" | "objects" | "images" | "videos";

const TABS: { key: TabKey; label: string; Icon: typeof FileText }[] = [
  { key: "preview", label: "Preview", Icon: Eye },
  { key: "pages",   label: "Pages",   Icon: FileText },
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
 * The Site Manager: the design chat column always on the left (topped by the logo and Submit for review; it can be collapsed
 * to a thin rail, which moves Submit for review into the top bar),
 * and next to it the tabs along the top (the preview of the site, then Pages, Objects, Images and Videos, each its own screen),
 * with the account menu at the right end of the top bar. Choosing a page in the Pages tab points the chat at it. The chat and the
 * preview are kept alive while another tab is open, so nothing restarts when someone switches.
 */
export default function AdminIndex() {
  return (
    <DesignChatProvider>
      <EditorSlotProvider>
        <AdminShell />
      </EditorSlotProvider>
    </DesignChatProvider>
  );
}

function AdminShell() {
  const designChat = useDesignChat();
  const { workingPage, editing, startEditing, stopEditing, clearWorkingPage, selectPage, previewLocation, previewPage, objectOpen, closeObject } = designChat;
  const { setSlot, saveAll, discardAll, hasChanges } = useEditorSlot();
  // Saves the editor's held changes, then leaves edit mode; on a failed save it stays in edit mode.
  const [finishing, setFinishing] = useState(false);
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
  const saveChanges = async () => {
    const had = hasChanges();
    const ok = await finishEditing();
    if (ok && had) toast.success("Changes saved.");
  };
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const doDiscard = () => { discardAll(); stopEditing(); toast("Changes discarded."); };
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
  // The page the button edits: the one the visitor is on in the preview, or, before the preview reports, the working page.
  const editTarget = previewLocation ? previewPage : workingPage?.id ? workingPage : null;
  const noPageHere = !!previewLocation && !previewPage;
  const showEditButton = (tab === "preview" || editing) && (!!editTarget || noPageHere);
  const toggleEditing = () => {
    if (editing) { void finishEditing(); return; }
    if (!editTarget?.id) return;
    selectPage({ id: editTarget.id, name: editTarget.name, path: editTarget.path });
    startEditing();
  };
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
    if (nav && nav.scrollWidth - nav.clientWidth > 1 && squeeze < 3) setSqueeze(squeeze + 1);
    else needsMeasure.current = false;
  });
  useLayoutEffect(() => { remeasure(); }, [tab, isAdmin, showEditButton, editing]);
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
      <div className="flex h-screen flex-col overflow-hidden bg-background lg:flex-row">
        {/* Right: the top bar (tabs, preview tools, Capture, account menu) and whichever tab is open. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-30 w-full shrink-0 border-b bg-background">
            <div ref={rowRef} className="flex w-full items-center gap-3 px-4 py-2.5">
              <nav ref={navRef} className="flex-1 min-w-0 flex flex-nowrap items-center gap-1 overflow-hidden" aria-label="Site Manager sections">
                {TABS.map(({ key, label, Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(`/manage/${key}`)}
                      title={label}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex items-center gap-2 whitespace-nowrap ${compact ? "px-2.5" : "px-3"} py-2 rounded-md text-sm font-medium transition-colors border ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {(!compact || (active && squeeze < 3)) && <span>{label}</span>}
                    </button>
                  );
                })}
              </nav>

              {showEditButton && (
                <Button
                  type="button"
                  variant={editing ? "default" : "outline"}
                  size="sm"
                  className={cn("h-9 shrink-0 gap-2", squeeze >= 2 && "w-9 px-0", !editing && !editTarget && "cursor-not-allowed opacity-50")}
                  aria-pressed={editing}
                  aria-label={editing ? "Editing" : "Edit page"}
                  title={editing ? `Editing ${workingPage?.name ?? ""} — press to save your changes and return to the chat` : editTarget ? `Edit ${editTarget.name}` : "This address isn't a page in the Site Manager."}
                  disabled={editing && finishing}
                  aria-disabled={!editing && !editTarget}
                  onClick={toggleEditing}
                >
                  <Pencil className="h-4 w-4" />
                  {squeeze < 2 && <span>{editing ? "Editing" : "Edit page"}</span>}
                </Button>
              )}
              <PreviewTools showViewControls={tab === "preview"} tight={squeeze >= 2} />

              <div aria-hidden className="h-9 w-px bg-border shrink-0" />
              {chatCollapsed && <SubmitButton />}
              <Button asChild variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Link to="/manage/capture" aria-label="Capture" title="Capture">
                  <Camera className="w-4 h-4" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0 gap-2" aria-label="Account menu">
                    <UserCircle2 className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                        <Shield className="w-4 h-4 mr-2" /> Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setPwOpen(true)}>
                    <KeyRound className="w-4 h-4 mr-2" /> Change password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <ChangeMyPasswordDialog open={pwOpen} onOpenChange={setPwOpen} />

          <main className="relative min-h-0 flex-1 overflow-y-auto">
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
                    <ObjectDesignPage
                      key={objectOpen.id}
                      embedded
                      objectId={objectOpen.id}
                      focusSection={objectOpen.section}
                      onBack={async () => { const ok = await saveAll(); if (ok) closeObject(); }}
                    />
                  ) : (
                    <DesignTab embedded pageId={workingPage.id} />
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
        </div>

        {/* Left: the chat column, on every tab, with its own header (logo, Submit for review, collapse); the account menu sits at the right end of the top bar.
            Collapsed, it shrinks to a thin rail with an expand button; the chat stays mounted (hidden) so typed text and attachments survive. */}
        <aside
          className={cn(
            "flex shrink-0 flex-col border-t lg:order-first lg:h-screen lg:border-r lg:border-t-0 lg:transition-[width] lg:duration-200",
            chatCollapsed ? "h-auto lg:w-12" : "h-[45vh] lg:w-[clamp(320px,26vw,400px)]",
          )}
          aria-label="Chat"
        >
          {chatCollapsed && (
            <div className="flex shrink-0 justify-start p-1.5 lg:justify-center">
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Expand chat" title="Expand chat" aria-expanded={false} onClick={() => setChatCollapsed(false)}>
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className={cn("flex shrink-0 items-center gap-2 border-b bg-background px-3 py-2.5", chatCollapsed && "hidden")}>
            <h1 className="whitespace-nowrap">
              <SiteManagerLogo />
            </h1>
            <div className="flex-1" />
            <SubmitButton />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Collapse chat" title="Collapse chat" aria-expanded={true} onClick={() => setChatCollapsed(true)}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
          <div className={cn("min-h-0 flex-1", (chatCollapsed || editing) && "hidden")}>
            <ChatPanel />
          </div>
          {editing && workingPage && (
            <div className={cn("flex min-h-0 flex-1 flex-col", chatCollapsed && "hidden")}>
              <div className="flex shrink-0 items-start gap-2 border-b px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Editing</p>
                  <p className="truncate text-sm font-medium" title={workingPage.name}>{workingPage.name}</p>
                  <button type="button" disabled={finishing} onClick={() => void finishEditing(true)} className="mt-0.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                    Stop working on this page
                  </button>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button type="button" size="sm" disabled={finishing} onClick={() => void saveChanges()}>{finishing ? "Saving…" : "Save changes"}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={finishing} onClick={discardEditing}>Discard changes</Button>
                </div>
              </div>
              <div ref={setSlot} aria-label="Page editing options" role="region" className="min-h-0 flex-1 overflow-y-auto" />
            </div>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard your changes?"
        description="Everything you changed since your last save in this editor will be lost. This can't be undone."
        confirmLabel="Discard changes"
        onConfirm={() => { setConfirmDiscard(false); doDiscard(); }}
      />
    </>
  );
}
