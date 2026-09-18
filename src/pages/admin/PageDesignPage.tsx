import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteManagerLogo from "./SiteManagerLogo";

const DesignTab = lazy(() => import("./DesignTab"));

/**
 * Standalone page-design screen. Reached from the Edit button on a page row
 * in the Pages tab (`/manage/design?page=<id>`) — there is no Design tab.
 */
export default function PageDesignPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="w-full px-6 py-3 flex items-center gap-4">
          <h1 className="whitespace-nowrap"><SiteManagerLogo /></h1>
          <div aria-hidden className="h-9 w-px bg-border shrink-0" />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/manage/pages"><ArrowLeft className="w-4 h-4" /> Back to pages</Link>
          </Button>
        </div>
      </header>
      <main className="w-full px-6 py-6">
        <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
          <DesignTab />
        </Suspense>
      </main>
    </div>
  );
}
