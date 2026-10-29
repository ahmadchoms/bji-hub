import { describe, it, expect } from "vitest";
import { daysSinceRoast, getFreshness, FRESHNESS_WINDOWS } from "./freshness";
import { roastDateSchema } from "@/lib/validations/listing.schema";

describe("lib/coffee/freshness (COF-1 & N5/N6)", () => {
  const baseNow = new Date("2026-10-29T12:00:00.000Z");

  it("calculates daysSinceRoast correctly for Date and ISO strings", () => {
    const twoDaysAgo = new Date("2026-10-27T12:00:00.000Z");
    expect(daysSinceRoast(twoDaysAgo, baseNow)).toBe(2);
    expect(daysSinceRoast("2026-10-25T12:00:00.000Z", baseNow)).toBe(4);
  });

  it("returns null for invalid, empty, or corrupt roast dates (N5)", () => {
    expect(daysSinceRoast(new Date("invalid"), baseNow)).toBeNull();
    expect(daysSinceRoast("", baseNow)).toBeNull();
    expect(daysSinceRoast(null, baseNow)).toBeNull();
    expect(daysSinceRoast(undefined, baseNow)).toBeNull();
    expect(getFreshness(new Date("invalid"), "Medium", baseNow)).toBeNull();
    expect(getFreshness(null, "Medium", baseNow)).toBeNull();
  });

  it("returns null for dates more than 1 day in the future (N5)", () => {
    // 5 days in the future
    const futureDate = new Date("2026-11-03T12:00:00.000Z");
    expect(daysSinceRoast(futureDate, baseNow)).toBeNull();
    expect(getFreshness(futureDate, "Medium", baseNow)).toBeNull();
  });

  it("tolerates same-day timezone leeway within 1 day future by returning 0", () => {
    // 6 hours ahead of now
    const laterToday = new Date("2026-10-29T18:00:00.000Z");
    expect(daysSinceRoast(laterToday, baseNow)).toBe(0);
  });

  it("returns null for dates older than 3 years (N5)", () => {
    // 4 years ago
    const fourYearsAgo = new Date("2022-10-20T12:00:00.000Z");
    expect(daysSinceRoast(fourYearsAgo, baseNow)).toBeNull();
    expect(getFreshness(fourYearsAgo, "Medium", baseNow)).toBeNull();
  });

  it("correctly parses YYYY-MM-DD format anchored to WIB (+07:00)", () => {
    // 2026-10-28 00:00:00 WIB is 2026-10-27 17:00:00 UTC
    // BaseNow is 2026-10-29 12:00:00 UTC -> ~1.79 days -> 1 day difference
    const days = daysSinceRoast("2026-10-28", baseNow);
    expect(days).toBe(1);
  });

  it("evaluates freshness state for Light roast across boundaries and translates to Masa istirahat (N6)", () => {
    const w = FRESHNESS_WINDOWS.Light; // rest: 5, peakEnd: 21, goodEnd: 35

    // 2 days ago -> resting (Masa istirahat)
    const day2 = new Date("2026-10-27T12:00:00.000Z");
    const resResting = getFreshness(day2, "Light", baseNow)!;
    expect(resResting).not.toBeNull();
    expect(resResting.state).toBe("resting");
    expect(resResting.restDaysNeeded).toBe(3);
    expect(resResting.label).toContain("Masa istirahat");
    expect(resResting.label).not.toContain("Degassing");

    // 5 days ago -> optimal
    const day5 = new Date("2026-10-24T12:00:00.000Z");
    const resOptimal = getFreshness(day5, "Light", baseNow)!;
    expect(resOptimal.state).toBe("optimal");
    expect(resOptimal.label).toContain("Optimal");

    // 25 days ago -> good
    const day25 = new Date("2026-10-04T12:00:00.000Z");
    const resGood = getFreshness(day25, "Light", baseNow)!;
    expect(resGood.state).toBe("good");

    // 40 days ago -> past_peak
    const day40 = new Date("2026-09-19T12:00:00.000Z");
    const resPast = getFreshness(day40, "Light", baseNow)!;
    expect(resPast.state).toBe("past_peak");
  });

  it("validates roastDateSchema correctly", () => {
    // Valid past date
    expect(roastDateSchema.safeParse("2026-10-15").success).toBe(true);
    // Invalid regex format
    expect(roastDateSchema.safeParse("15-10-2026").success).toBe(false);
    expect(roastDateSchema.safeParse("not-a-date").success).toBe(false);
    // Future date (year 2030)
    expect(roastDateSchema.safeParse("2030-01-01").success).toBe(false);
    // 4 years ago (year 2020)
    expect(roastDateSchema.safeParse("2020-01-01").success).toBe(false);
  });
});
