import { describe, it, expect } from "vitest";
import { daysSinceRoast, getFreshness, FRESHNESS_WINDOWS } from "./freshness";

describe("lib/coffee/freshness (COF-1)", () => {
  const baseNow = new Date("2026-10-29T12:00:00.000Z");

  it("calculates daysSinceRoast correctly for Date and ISO strings", () => {
    const twoDaysAgo = new Date("2026-10-27T12:00:00.000Z");
    expect(daysSinceRoast(twoDaysAgo, baseNow)).toBe(2);
    expect(daysSinceRoast("2026-10-25T12:00:00.000Z", baseNow)).toBe(4);
    expect(daysSinceRoast(new Date("invalid"), baseNow)).toBe(0);
  });

  it("evaluates freshness state for Light roast across boundaries", () => {
    const w = FRESHNESS_WINDOWS.Light; // rest: 5, peakEnd: 21, goodEnd: 35

    // 2 days ago -> resting
    const day2 = new Date("2026-10-27T12:00:00.000Z");
    const resResting = getFreshness(day2, "Light", baseNow);
    expect(resResting.state).toBe("resting");
    expect(resResting.restDaysNeeded).toBe(3);

    // 5 days ago -> optimal
    const day5 = new Date("2026-10-24T12:00:00.000Z");
    const resOptimal = getFreshness(day5, "Light", baseNow);
    expect(resOptimal.state).toBe("optimal");
    expect(resOptimal.label).toContain("Optimal");

    // 25 days ago -> good
    const day25 = new Date("2026-10-04T12:00:00.000Z");
    const resGood = getFreshness(day25, "Light", baseNow);
    expect(resGood.state).toBe("good");

    // 40 days ago -> past_peak
    const day40 = new Date("2026-09-19T12:00:00.000Z");
    const resPast = getFreshness(day40, "Light", baseNow);
    expect(resPast.state).toBe("past_peak");
  });

  it("falls back gracefully when unknown roast level is provided", () => {
    const day5 = new Date("2026-10-24T12:00:00.000Z");
    const res = getFreshness(day5, "SuperDarkCustom", baseNow);
    // falls back to Medium (rest: 3, peakEnd: 16) -> 5 days is optimal
    expect(res.state).toBe("optimal");
  });
});
