import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Camera, Loader2, SwitchCamera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog";

type UnavailableReason = "unsupported" | "denied" | "notfound" | "error";
interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  onCapture(file: File): void;
  onUnavailable(reason: UnavailableReason): void;
}

function photoName() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `photo-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.jpg`;
}

export default function CameraCaptureSheet({ open, onOpenChange, onCapture, onUnavailable }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const callbacks = useRef({ onOpenChange, onCapture, onUnavailable });
  callbacks.current = { onOpenChange, onCapture, onUnavailable };
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [canFlip, setCanFlip] = useState(false);
  const [taken, setTaken] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [shotError, setShotError] = useState("");
  const shootingRef = useRef(false);

  const stop = () => {
    generation.current++;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };
  const close = () => {
    stop();
    callbacks.current.onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setFacing("environment");
      setTaken(0);
      setCanFlip(false);
      return;
    }
    let cancelled = false;
    let ownedStream: MediaStream | null = null;
    const session = ++generation.current;
    setReady(false);
    setShooting(false);
    shootingRef.current = false;
    setShotError("");
    const unavailable = (reason: UnavailableReason) => {
      if (cancelled || generation.current !== session) return;
      stop();
      callbacks.current.onOpenChange(false);
      callbacks.current.onUnavailable(reason);
    };
    const start = async () => {
      // Deferring also lets StrictMode cancel its first mount without opening two cameras.
      await Promise.resolve();
      if (cancelled) return;
      if (!navigator.mediaDevices?.getUserMedia) { unavailable("unsupported"); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 4096 }, height: { ideal: 2160 } },
          audio: false,
        });
        if (cancelled || generation.current !== session) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        ownedStream = stream;
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) { unavailable("error"); return; }
        video.srcObject = stream;
        await video.play();
        if (cancelled || generation.current !== session) return;
        setReady(video.videoWidth > 0 && video.videoHeight > 0);
        // Labels and device IDs become available after permission is granted.
        try {
          const devices = await navigator.mediaDevices.enumerateDevices?.();
          if (!cancelled && generation.current === session) {
            setCanFlip((devices?.filter((device) => device.kind === "videoinput").length ?? 0) > 1);
          }
        } catch { /* The camera remains usable when device enumeration is unavailable. */ }
      } catch (error) {
        const name = error instanceof Error ? error.name : "";
        unavailable(name === "NotAllowedError" || name === "PermissionDeniedError" ? "denied"
          : name === "NotFoundError" || name === "DevicesNotFoundError" ? "notfound" : "error");
      }
    };
    const onVisibility = () => { if (document.hidden) close(); };
    document.addEventListener("visibilitychange", onVisibility);
    void start();
    return () => {
      cancelled = true;
      generation.current++;
      document.removeEventListener("visibilitychange", onVisibility);
      ownedStream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === ownedStream) {
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    };
  }, [open, facing]);

  const shutter = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || !video.videoWidth || !video.videoHeight || shootingRef.current) return;
    const session = generation.current;
    shootingRef.current = true;
    setShooting(true);
    setShotError("");
    const finish = (blob: Blob | null) => {
      if (session !== generation.current) return;
      shootingRef.current = false;
      setShooting(false);
      if (!blob) { setShotError("Photo couldn't be taken. Please try again."); return; }
      callbacks.current.onCapture(new File([blob], photoName(), { type: "image/jpeg" }));
      setTaken((count) => count + 1);
    };
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) { finish(null); return; }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(finish, "image/jpeg", 0.92);
    } catch { finish(null); }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}>
      <DialogPortal>
        <DialogPrimitive.Content aria-describedby={undefined} className="capture-app fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-primary text-primary-foreground outline-none">
          <header className="capture-safe-top capture-safe-x shrink-0">
            <div className="flex items-center justify-between p-3">
              <DialogTitle className="text-base">Camera</DialogTitle>
              <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={close} aria-label="Close camera" title="Close camera"><X className="h-6 w-6" /></Button>
            </div>
          </header>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera" className="h-full w-full object-contain" onLoadedData={() => setReady(!!streamRef.current && (videoRef.current?.videoWidth ?? 0) > 0)} />
            {!ready && <div role="status" className="absolute inset-0 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin motion-reduce:animate-none" aria-label="Starting camera" /></div>}
          </div>
          <footer className="capture-safe-bottom capture-safe-x shrink-0">
            <div className="space-y-2 p-4">
              <div aria-live="polite" className="min-h-5 text-center text-sm">{shotError || `${taken} taken`}</div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="justify-self-start">{canFlip && <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-primary-foreground/10 hover:text-primary-foreground" disabled={!ready || shooting} onClick={() => { stop(); setReady(false); setFacing((value) => value === "environment" ? "user" : "environment"); }} aria-label="Flip camera" title="Flip camera"><SwitchCamera className="h-6 w-6" /></Button>}</div>
                <Button variant="secondary" className="h-20 w-20 rounded-full border-4 border-primary-foreground bg-primary-foreground text-primary hover:bg-primary-foreground/90" disabled={!ready || shooting} onClick={shutter} aria-label="Take picture" title="Take picture"><Camera className="h-7 w-7" /></Button>
                <Button variant="ghost" className="h-12 justify-self-end hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={close}>Done</Button>
              </div>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}