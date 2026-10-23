import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Pencil } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDesignChat, type WorkingPage } from "./DesignChatContext";
import { useModeSwitch } from "./ModeSwitchContext";
import { registerPreviewPage } from "./usePreviewPage";
import { workingPageFrom } from "./pageSelection";
import ModePageChooser from "./ModePageChooser";

export default function ModeToggle({ collapsed = false, onChat }: { collapsed?: boolean; onChat: () => void }) {
  const { mode, workingPage, selectPage, startEditing } = useDesignChat();
  const guard = useModeSwitch();
  const navigate = useNavigate();
  const [chooser, setChooser] = useState(false);
  const switching = useRef(false);
  const enter = async (page: WorkingPage) => {
    if (switching.current) return;
    switching.current = true;
    try {
      await guard?.requestManual(async () => {
        const target = page.id ? page : await registerPreviewPage(page);
        selectPage(workingPageFrom(target)); navigate("/manage/preview"); startEditing();
      });
    } catch { toast.error("Couldn't open this page for editing. Try again."); }
    finally { switching.current = false; }
  };
  const change = async (next: string) => {
    if (!next || next === mode || switching.current) return;
    if (next === "chat") { if (await guard?.requestChat()) { onChat(); navigate("/manage/preview"); } }
    else if (workingPage) await enter(workingPage);
    else setChooser(true);
  };
  return <>
    <ToggleGroup type="single" value={mode} onValueChange={(next) => void change(next)} aria-label="Editing Mode" data-mode-switch
      className={cn("shrink-0 gap-1 border-b bg-background p-2", collapsed ? "flex-col" : "grid w-full grid-cols-2")}>
      {([{ value: "chat", label: "Chat Mode", Icon: MessageSquare }, { value: "manual", label: "Manual Edit Mode", Icon: Pencil }] as const).map(({ value, label, Icon }) => <ToggleGroupItem key={value} value={value} aria-label={label} title={label}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            const next = value === "chat" ? "manual" : "chat";
            event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)?.focus();
            void change(next);
          }
        }} data-mode={value}
        className={cn("gap-1.5 text-xs leading-tight focus-visible:ring-2 focus-visible:ring-ring", collapsed ? "h-8 w-8 p-0" : "h-11 min-w-0 px-1",
          value === "manual" ? "data-[state=on]:bg-manual data-[state=on]:text-background data-[state=on]:font-semibold" : "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:font-semibold")}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden />{!collapsed && <span>{label}</span>}
      </ToggleGroupItem>)}
    </ToggleGroup>
    <ModePageChooser open={chooser} onOpenChange={setChooser} onChoose={(page) => { setChooser(false); void enter(page); }} />
  </>;
}