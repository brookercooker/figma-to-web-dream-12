import { useEffect, useRef, useState } from "react";

import heroAsset from "@/assets/hero-living-room.jpg.asset.json";
import heroPoster from "@/assets/hero-video-poster.jpg.asset.json";
import heroMp4 from "@/assets/hero-installed-lighting.mp4.asset.json";
import heroWebm from "@/assets/hero-installed-lighting.webm.asset.json";

/** Still shown on mobile / reduced-motion. */
const stillUrl = heroAsset.url;
/** First frame of the video — used as poster so playback starts seamlessly. */
const posterUrl = heroPoster.url;

/**
 * Full-bleed hero media.
 * Desktop + motion allowed  → ambient, muted, looping video (poster = hero still)
 * Mobile or reduced-motion  → the hero still image only (no video bytes fetched)
 */
const HeroMedia = ({ alt }: { alt: string }) => {
  const [useVideo, setUseVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => setUseVideo(wide.matches && !calm.matches);
    evaluate();

    wide.addEventListener("change", evaluate);
    calm.addEventListener("change", evaluate);
    return () => {
      wide.removeEventListener("change", evaluate);
      calm.removeEventListener("change", evaluate);
    };
  }, []);

  if (!useVideo) {
    return (
      <img
        src={stillUrl}
        alt={alt}
        className="h-full w-full object-cover"
        fetchPriority="high"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      poster={posterUrl}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-label={alt}
      tabIndex={-1}
    >
      <source src={heroWebm.url} type="video/webm" />
      <source src={heroMp4.url} type="video/mp4" />
    </video>
  );
};

export default HeroMedia;
