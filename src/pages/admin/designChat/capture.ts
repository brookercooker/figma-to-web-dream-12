/**
 * An optional picture of the preview with the drawing on it. A web page can't read what is inside another site's frame, so
 * the only way to get a picture is the browser's own screen sharing, limited to this tab. The person agrees once (the
 * browser asks); after that a picture is taken when a request is sent, and sharing stops when drawing ends.
 */

export const MAX_IMAGE_WIDTH = 1600;
const MAX_DATA_CHARS = 1_800_000; // the design service refuses anything over about 2 million

type CropTargetLike = { fromElement(el: Element): Promise<unknown> };
type CroppableTrack = MediaStreamTrack & { cropTo?: (target: unknown) => Promise<void> };

export class PreviewCamera {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private cropped = false;
  /** Called when sharing stops by itself (the person pressed the browser's "Stop sharing"). */
  onEnded: (() => void) | null = null;

  static supported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function";
  }

  get active(): boolean { return this.stream !== null; }

  async start(area: HTMLElement): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!PreviewCamera.supported()) return { ok: false, error: "This browser can't take a picture of the preview. The drawing will still be sent as a written description." };
    this.stop();
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false,
        // Chrome: offer this tab first, and let it be chosen. Other browsers ignore these.
        preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude", monitorTypeSurfaces: "exclude",
      } as DisplayMediaStreamOptions);
      const track = stream.getVideoTracks()[0] as CroppableTrack | undefined;
      if (!track) { stream.getTracks().forEach((t) => t.stop()); return { ok: false, error: "No picture came through. The drawing will be sent without one." }; }
      const surface = (track.getSettings() as { displaySurface?: string }).displaySurface;
      if (surface && surface !== "browser") {
        stream.getTracks().forEach((t) => t.stop());
        return { ok: false, error: "Please choose this browser tab when asked, so the picture shows the preview." };
      }
      // Chrome can crop the picture to exactly the preview.
      const CropTarget = (window as unknown as { CropTarget?: CropTargetLike }).CropTarget;
      this.cropped = false;
      if (CropTarget && typeof track.cropTo === "function") {
        try { await track.cropTo(await CropTarget.fromElement(area)); this.cropped = true; } catch { /* the crop is worked out below instead */ }
      }
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();
      this.stream = stream;
      this.video = video;
      track.addEventListener("ended", () => { this.stop(); this.onEnded?.(); });
      return { ok: true };
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "AbortError");
      return { ok: false, error: denied ? "Picture sharing wasn't allowed. The drawing will be sent as a written description." : "The picture couldn't be started. The drawing will be sent without one." };
    }
  }

  /** A JPEG data address of the preview as it is now (smaller if it would be too big), or null if it can't be taken. */
  async grab(area: HTMLElement): Promise<string | null> {
    const video = this.video;
    if (!video || !this.stream || !video.videoWidth) return null;
    // Wait for a fresh frame, so anything just hidden (the toolbar) isn't in it.
    await new Promise<void>((r) => {
      const rv = (video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void }).requestVideoFrameCallback;
      if (rv) { rv.call(video, () => r()); setTimeout(r, 400); } else setTimeout(r, 200);
    });
    const vw = video.videoWidth, vh = video.videoHeight;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (!this.cropped) {
      // The picture is the whole tab: cut out the preview's rectangle. Refuse if the picture isn't the tab.
      const scale = vw / window.innerWidth;
      if (Math.abs(vh / window.innerHeight - scale) > 0.05 * scale) return null;
      const r = area.getBoundingClientRect();
      sx = Math.max(0, r.left * scale); sy = Math.max(0, r.top * scale);
      sw = Math.min(vw - sx, r.width * scale); sh = Math.min(vh - sy, r.height * scale);
    }
    if (sw < 8 || sh < 8) return null;
    const out = Math.min(1, MAX_IMAGE_WIDTH / sw);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * out);
    canvas.height = Math.round(sh * out);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    for (const q of [0.82, 0.65, 0.5]) {
      const url = canvas.toDataURL("image/jpeg", q);
      if (url.length <= MAX_DATA_CHARS) return url;
    }
    return null;
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) { this.video.srcObject = null; this.video = null; }
  }
}
