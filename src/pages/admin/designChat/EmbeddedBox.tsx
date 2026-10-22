import type { ReactNode } from "react";
import { Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { useDesignChatOptional } from "./DesignChatContext";

const EMBED_WIDTH: Record<"mobile" | "tablet" | "desktop", string> = { mobile: "390px", tablet: "820px", desktop: "100%" };

/** Embedded editors: the box the Site Manager's size buttons and Full screen act on. Without the chat: just the children. */
export default function EmbeddedBox({ chat, children }: { chat: ReturnType<typeof useDesignChatOptional>; children: ReactNode }) {
  if (!chat) return <>{children}</>;
  const { device, inFull, coverFull, toggleFull, editBoxRef, drawing } = chat;
  return (
    <div ref={editBoxRef} className={cn("relative flex h-full min-h-0 justify-center bg-muted", coverFull && "fixed inset-0 z-50 bg-background")}>
      <div className="h-full max-w-full overflow-y-auto bg-background" style={{ width: EMBED_WIDTH[device] }}>
        {children}
      </div>
      {inFull && !drawing.capturing && (
        <Button type="button" size="sm" aria-label="Exit full screen" title="Exit full screen" className="absolute right-4 top-4 z-40 gap-2 bg-foreground/80 text-background shadow-sm hover:bg-foreground/90" onClick={toggleFull}>
          <Minimize2 className="h-4 w-4" /> Minimize
        </Button>
      )}
    </div>
  );
}
