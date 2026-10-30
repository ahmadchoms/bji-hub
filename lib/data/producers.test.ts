process.env.DATA_SOURCE = "mock";

import { describe, it, expect } from "vitest";
import {
  getProducers,
  getProducerBySlug,
  getProducerById,
  mockProducers,
} from "./producers";

describe("Producers Data Access", () => {
  it("fetches all producers by default", async () => {
    const all = await getProducers();
    expect(all.length).toBeGreaterThanOrEqual(6);
  });

  it("filters producers by originId", async () => {
    const gayoProducers = await getProducers({ originId: "origin-gayo" });
    expect(gayoProducers.length).toBe(1);
    expect(gayoProducers[0]?.slug).toBe("koperasi-baburrayyan-gayo");
  });

  it("filters producers by kind", async () => {
    const farmers = await getProducers({ kind: "petani" });
    expect(farmers.length).toBeGreaterThanOrEqual(2);
    expect(farmers.every((f) => f.kind === "petani")).toBe(true);
  });

  it("finds producer by slug", async () => {
    const producer = await getProducerBySlug("kolektif-tani-sapan-toraja");
    expect(producer).not.toBeNull();
    expect(producer?.name).toBe("Kolektif Petani Sapan Toraja");
    expect(producer?.village).toContain("Toraja Utara");
  });

  it("returns null for non-existent slug", async () => {
    const producer = await getProducerBySlug("non-existent-producer");
    expect(producer).toBeNull();
  });

  it("finds producer by id", async () => {
    const producer = await getProducerById("prod-preanger-kencana");
    expect(producer).not.toBeNull();
    expect(producer?.name).toBe("Koperasi Gunung Kencana Preanger");
  });
});
