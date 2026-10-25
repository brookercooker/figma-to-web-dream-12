import { useEffect } from "react";
import { startSiteManifestBridge } from "../siteManifest";

/** Owns the off-screen receiver only when PreviewPanel has no mounted public frame. */
export default function ManifestReceiverFrame() {
  useEffect(startSiteManifestBridge, []);
  return null;
}