import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

const LAST_MANAGER_KEY = "sandbox:lastManagerRoute";
const DEFAULT_MANAGER_ROUTE = "/manage/pages";

const MiniSiteManagerMark = () => (
  <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true" className="shrink-0">
    <rect x="2.5" y="2.5" width="27" height="27" rx="5" fill="hsl(var(--glow, 38 50% 80%))" />
    <rect x="5" y="5" width="13" height="13" rx="1.75" fill="hsl(var(--brass, 38 31% 72%))" />
    <rect x="19.5" y="5" width="7.5" height="6" rx="1.5" fill="hsl(var(--cream, 0 0% 100%))" />
    <rect x="19.5" y="12.5" width="7.5" height="5.5" rx="1.5" fill="hsl(0 0% 13%)" />
    <rect x="5" y="19.5" width="17" height="7.5" rx="1.75" fill="hsl(var(--cream, 0 0% 100%))" />
    <circle cx="24.75" cy="23.25" r="2.75" fill="hsl(var(--garnet, 3 44% 36%))" />
    <rect x="2.5" y="2.5" width="27" height="27" rx="5" fill="none" stroke="hsl(0 0% 13%)" strokeWidth="1.4" />
  </svg>
);

const SandboxBanner = () => {
  const location = useLocation();
  const [target, setTarget] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MANAGER_ROUTE;
    return window.sessionStorage.getItem(LAST_MANAGER_KEY) || DEFAULT_MANAGER_ROUTE;
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/manage")) {
      const full = path + location.search;
      window.sessionStorage.setItem(LAST_MANAGER_KEY, full);
      setTarget(full);
    }
  }, [location.pathname, location.search]);

  return (
    <div className="sticky top-0 z-[100] bg-foreground text-background">

      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-1.5 text-[10px] sm:text-[11px] font-sans tracking-[0.2em] uppercase grid grid-cols-3 items-center">
        <Link
          to={target}
          className="justify-self-start inline-flex items-center gap-1.5 hover:opacity-80"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <MiniSiteManagerMark />
          <span>Site Manager</span>
        </Link>
        <span className="justify-self-center text-center">Sandbox Site</span>
        <span aria-hidden />
      </div>
    </div>
  );
};

export default SandboxBanner;
