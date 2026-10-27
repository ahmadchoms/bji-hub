delete process.env.RAJAONGKIR_API_KEY;

import { describe, it, expect, beforeEach } from "vitest";
import { trackShipmentWaybill, _clearTrackingCacheForTest } from "./shipping";

describe("trackShipmentWaybill (F8 Courier Tracking Cache)", () => {
  beforeEach(() => {
    _clearTrackingCacheForTest();
  });

  it("returns tracking manifests for a valid waybill", async () => {
    const res = await trackShipmentWaybill("SOCAG0011223344", "jne");
    expect(res).toBeDefined();
    expect(res.waybillNumber).toBe("SOCAG0011223344");
    expect(res.courierName).toBe("JNE");
    expect(res.manifests.length).toBeGreaterThan(0);
  });

  it("caches tracking results for identical courier and waybill", async () => {
    const res1 = await trackShipmentWaybill("TEST-AWB-CACHE", "tiki");
    const res2 = await trackShipmentWaybill("TEST-AWB-CACHE", "tiki");

    // Identical object returned from cache
    expect(res1).toBe(res2);
  });

  it("refreshes when cache is cleared", async () => {
    const res1 = await trackShipmentWaybill("TEST-AWB-REFRESH", "pos");
    _clearTrackingCacheForTest();
    const res2 = await trackShipmentWaybill("TEST-AWB-REFRESH", "pos");

    expect(res1).not.toBe(res2);
    expect(res1.waybillNumber).toBe(res2.waybillNumber);
  });
});
