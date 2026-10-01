import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, Component, type ReactNode } from "react";
import { lazyRetry } from "../lazyRetry";

// lazyRetry is what keeps an open tab from blank-screening after a deploy
// ships new chunk hashes. These tests cover its three branches: succeed
// immediately, recover after one retry, and -- when both attempts fail --
// force exactly one reload (never loop).

class TestErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <div>boundary caught it</div> : this.props.children;
  }
}

function Loaded() {
  return <div>loaded ok</div>;
}

describe("lazyRetry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("resolves normally when the import succeeds on the first try", async () => {
    const factory = vi.fn(async () => ({ default: Loaded }));
    const LazyLoaded = lazyRetry(factory);

    render(
      <Suspense fallback={<div>loading</div>}>
        <LazyLoaded />
      </Suspense>,
    );

    await screen.findByText("loaded ok");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("retries once and recovers from a single transient failure", async () => {
    let calls = 0;
    const factory = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error("stale chunk");
      return { default: Loaded };
    });
    const LazyLoaded = lazyRetry(factory);

    render(
      <Suspense fallback={<div>loading</div>}>
        <LazyLoaded />
      </Suspense>,
    );

    await screen.findByText("loaded ok");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("forces exactly one reload when both attempts fail and no recent reload happened", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    const factory = vi.fn(async () => {
      throw new Error("stale chunk");
    });
    const LazyLoaded = lazyRetry(factory);

    render(
      <TestErrorBoundary>
        <Suspense fallback={<div>loading</div>}>
          <LazyLoaded />
        </Suspense>
      </TestErrorBoundary>,
    );

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    // The retry promise deliberately never resolves once reload() fires, so
    // the UI should still show the Suspense fallback -- not the error
    // boundary, and not a loaded/blank screen.
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("chunk:reloaded-at")).not.toBeNull();
  });

  it("does not loop: skips reload and surfaces the error if one just happened", async () => {
    window.sessionStorage.setItem("chunk:reloaded-at", String(Date.now()));
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    const factory = vi.fn(async () => {
      throw new Error("stale chunk");
    });
    const LazyLoaded = lazyRetry(factory);

    render(
      <TestErrorBoundary>
        <Suspense fallback={<div>loading</div>}>
          <LazyLoaded />
        </Suspense>
      </TestErrorBoundary>,
    );

    await screen.findByText("boundary caught it");
    expect(reload).not.toHaveBeenCalled();
  });
});
