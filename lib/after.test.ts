import { describe, it, expect, vi } from "vitest";
import { runAfterResponse } from "./after";

describe("runAfterResponse (A1)", () => {
  it("executes async background task reliably without throwing", async () => {
    let executed = false;
    runAfterResponse(async () => {
      executed = true;
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(executed).toBe(true);
  });

  it("catches errors in background task and logs without bubbling", async () => {
    expect(() => {
      runAfterResponse(async () => {
        throw new Error("Background failure");
      });
    }).not.toThrow();

    await new Promise((r) => setTimeout(r, 20));
  });
});
