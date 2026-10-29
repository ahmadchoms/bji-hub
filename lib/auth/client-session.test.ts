/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNavbarAuth, clearCachedAuth } from "./client-session";

describe("useNavbarAuth (PERF-1)", () => {
  beforeEach(() => {
    clearCachedAuth();
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
    vi.restoreAllMocks();
  });

  it("skips /api/me fetch when no session cookies exist", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useNavbarAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.authenticated).toBe(false);
    expect(result.current.role).toBe("guest");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetches /api/me when session cookie is present and updates state", async () => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "sb-mock-token=123",
    });

    const mockResponse = {
      authenticated: true,
      role: "seller",
      user: { firstName: "Budi" },
      storeName: "Kopi Budi",
      activeOrdersCount: 2,
      unreadCount: 5,
    };

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useNavbarAuth());

    await waitFor(() => {
      expect(result.current.authenticated).toBe(true);
    });

    expect(result.current.role).toBe("seller");
    expect(result.current.storeName).toBe("Kopi Budi");
    expect(result.current.user?.firstName).toBe("Budi");
    expect(fetchSpy).toHaveBeenCalledWith("/api/me", expect.objectContaining({ credentials: "same-origin" }));
  });

  it("uses cached sessionStorage and does not refetch if fresh", async () => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "biji-mock-session=buyer",
    });

    sessionStorage.setItem(
      "biji_me_cache",
      JSON.stringify({
        timestamp: Date.now(),
        data: {
          isLoading: false,
          authenticated: true,
          role: "buyer",
          user: { firstName: "CachedUser" },
          storeName: null,
          activeOrdersCount: 1,
          unreadCount: 0,
        },
      })
    );

    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useNavbarAuth());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.authenticated).toBe(true);
    expect(result.current.user?.firstName).toBe("CachedUser");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
