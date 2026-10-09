import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Box, Image as ImageIcon, Video as VideoLucide, Shield, UserCircle2, KeyRound, LogOut, Camera, Star } from "lucide-react";
import ChangeMyPasswordDialog from "./ChangeMyPasswordDialog";
import SiteManagerLogo from "./SiteManagerLogo";

const PagesTab = lazy(() => import("./PagesTab"));
const ObjectsTab = lazy(() => import("./ObjectsTab"));
const ImagesTab = lazy(() => import("./ImagesTab"));
const VideoTab = lazy(() => import("./VideoTab"));
const DesignChatTab = lazy(() => import("./DesignChatTab"));

type TabKey = "pages" | "objects" | "images" | "videos" | "design-chat";

const TABS: { key: TabKey; label: string; Icon: typeof FileText }[] = [
  { key: "pages",   label: "Pages",   Icon: FileText },
  { key: "objects", label: "Objects", Icon: Box },
  { key: "images",  label: "Images",  Icon: ImageIcon },
  { key: "videos",  label: "Videos",  Icon: VideoLucide },
  { key: "design-chat", label: "Design Chat", Icon: Star },
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

export default function AdminIndex() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabKey = useMemo(() => {
    const seg = location.pathname.split("/")[2];
    if (seg === "objects" || seg === "images" || seg === "videos" || seg === "design-chat") return seg as TabKey;
    return "pages";
  }, [location.pathname]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [pwOpen, setPwOpen] = useState(false);
  const checkedFor = useRef<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const neededRef = useRef(0);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const row = rowRef.current, nav = navRef.current;
    if (!row || !nav) return;
    const measure = () => {
      if (!compact) {
        const over = nav.scrollWidth - nav.clientWidth;
        if (over > 1) { neededRef.current = row.clientWidth + over; setCompact(true); }
      } else if (row.clientWidth >= neededRef.current) {
        setCompact(false);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [compact, isAdmin]);


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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div ref={rowRef} className="w-full px-6 py-3 flex items-center gap-6">
          <h1 className="whitespace-nowrap">
            <SiteManagerLogo />
          </h1>
          <div aria-hidden className="h-9 w-px bg-border shrink-0" />
          <nav ref={navRef} className="flex-1 min-w-0 flex flex-nowrap items-center gap-1 overflow-hidden">
            {TABS.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/manage/${key}`)}
                  title={label}
                  aria-label={label}
                  className={`inline-flex items-center gap-2 whitespace-nowrap ${compact ? "px-3" : "px-4"} py-2 rounded-md text-sm font-medium transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {!compact && <span>{label}</span>}
                </button>
              );
            })}
          </nav>

          <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
            <Link to="/manage/capture">
              <Camera className="w-4 h-4" />
              {!compact && <span>Capture</span>}
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
              <Link to="/admin/users">
                <Shield className="w-4 h-4" />
                {!compact && <span>Admin</span>}
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 gap-2" aria-label="Account menu">
                <UserCircle2 className="w-5 h-5" />
                <span className="hidden 2xl:inline text-sm text-muted-foreground max-w-[180px] truncate">{email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

      <main className="w-full px-6 py-6">
        <Suspense fallback={<TabSkeleton />}>
          {tab === "pages" && <PagesTab />}
          {tab === "objects" && <ObjectsTab />}
          {tab === "images" && <ImagesTab />}
          {tab === "videos" && <VideoTab />}
          {tab === "design-chat" && <DesignChatTab />}
        </Suspense>
      </main>
    </div>
  );
}
