import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import ObjectThumbnail from "../ObjectThumbnail";
const capture = vi.hoisted(() => vi.fn());
vi.mock("../objectThumbnailCapture", () => ({ requestObjectThumbnail: capture }));
vi.mock("../signedThumb", () => ({ SignedThumbImg: ({ url, fallback }: any) => url ? <img src={url} alt="Object Preview" /> : fallback }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); capture.mockReset(); });
describe("object preview thumbnails", () => {
  it("shows a neutral placeholder then the generated thumbnail", async () => {
    let finish: (url: string) => void = () => {};
    capture.mockReturnValue(new Promise<string>(resolve => { finish = resolve; }));
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<QueryClientProvider client={new QueryClient()}><ObjectThumbnail id="draft-object" /></QueryClientProvider>);
    expect(container.querySelector("img")).toBeNull();
    expect(capture).toHaveBeenCalledWith("draft-object");
    await act(async () => finish("stored-preview.jpg"));
    expect(screen.getByAltText("Object Preview")).toHaveAttribute("src", "stored-preview.jpg");
  });
  it("keeps a stored thumbnail without capturing again", () => {
    render(<QueryClientProvider client={new QueryClient()}><ObjectThumbnail id="ready-object" storedThumb="existing.jpg" /></QueryClientProvider>);
    expect(screen.getByAltText("Object Preview")).toHaveAttribute("src", "existing.jpg");
    expect(capture).not.toHaveBeenCalled();
  });
});