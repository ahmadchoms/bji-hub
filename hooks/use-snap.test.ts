/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSnap } from "./use-snap";

describe("useSnap hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const existing = document.getElementById("midtrans-snap-script");
    if (existing) existing.remove();
    delete (window as unknown as { snap?: unknown }).snap;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("injects snap script if window.snap is missing", () => {
    renderHook(() => useSnap());
    const script = document.getElementById("midtrans-snap-script") as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toContain("snap/snap.js");
  });

  it("sets ready to true once window.snap is available", () => {
    const { result } = renderHook(() => useSnap());
    expect(result.current.ready).toBe(false);

    (window as unknown as { snap: { pay: () => void } }).snap = { pay: vi.fn() };

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.ready).toBe(true);
  });
});
