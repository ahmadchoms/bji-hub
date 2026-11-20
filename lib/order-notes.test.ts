import { describe, it, expect } from "vitest";
import { parseB2BTaxInfo, formatB2BTaxNote } from "./order-notes";

describe("order-notes B2B parsing & formatting", () => {
  it("formats B2B tax note correctly", () => {
    expect(formatB2BTaxNote("PT Kopi Aroma", "01.234.567.8-901.000")).toBe(
      "[FAKTUR B2B: PT Kopi Aroma NPWP: 01.234.567.8-901.000]",
    );
    expect(formatB2BTaxNote("", "01.234.567.8-901.000")).toBe(
      "[FAKTUR B2B: NPWP: 01.234.567.8-901.000]",
    );
    expect(formatB2BTaxNote("", "")).toBe("");
  });

  it("parses B2B tax note and extracts clean notes", () => {
    const raw = "Tolong kirim sebelum jam 3 sore | [FAKTUR B2B: PT Kopi Aroma NPWP: 01.234.567.8-901.000]";
    const res = parseB2BTaxInfo(raw);
    expect(res.companyName).toBe("PT Kopi Aroma");
    expect(res.npwp).toBe("01.234.567.8-901.000");
    expect(res.cleanNotes).toBe("Tolong kirim sebelum jam 3 sore");
  });

  it("handles notes without B2B tax note gracefully", () => {
    const raw = "Request giling halus untuk tubruk";
    const res = parseB2BTaxInfo(raw);
    expect(res.companyName).toBeNull();
    expect(res.npwp).toBeNull();
    expect(res.cleanNotes).toBe("Request giling halus untuk tubruk");
  });

  it("handles null or undefined input", () => {
    expect(parseB2BTaxInfo(null)).toEqual({ companyName: null, npwp: null, cleanNotes: "" });
    expect(parseB2BTaxInfo(undefined)).toEqual({ companyName: null, npwp: null, cleanNotes: "" });
  });
});
