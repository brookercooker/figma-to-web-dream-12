import { useRef } from "react";
import { Loader2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PhoneChatButton({ working, unread, onOpen }: { working: boolean; unread: boolean; onOpen: () => void }) {
  return <Button type="button" size="icon" aria-label="Open chat" onClick={onOpen} className="nova-phone-chat-button fixed z-40 h-14 w-14 rounded-full shadow-lg">
    <MessageSquare className="h-6 w-6" aria-hidden />
    {working && <Loader2 className="absolute -inset-1 h-16 w-16 animate-spin text-primary" aria-label="Builder Working" />}
    {unread && <span data-chat-unread aria-label="New Chat Activity" className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-background bg-review" />}
  </Button>;
}
export function PhoneChatHeader({ onClose, review, onChat }: { onClose: () => void; review: boolean; onChat: () => void }) {
  const start = useRef<number | null>(null);
  return <div className="shrink-0 border-b">
    <div data-chat-handle className="flex h-5 touch-none items-center justify-center" aria-hidden onPointerDown={e => { start.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerUp={e => { if (start.current !== null && e.clientY - start.current > 60) onClose(); start.current = null; }}><span className="h-1 w-10 rounded-full bg-muted-foreground/40" /></div>
    <div className="flex h-10 items-center gap-2 px-3 pb-2">
      <span className="flex-1 text-sm font-medium">{review ? "Review Status" : "Chat"}</span>
      {review && <Button variant="ghost" size="sm" onClick={onChat}>Back to Chat</Button>}
      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Close chat" onClick={onClose}><X className="h-5 w-5" /></Button>
    </div>
  </div>;
}