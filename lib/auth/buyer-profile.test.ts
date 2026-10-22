import { describe, it, expect } from "vitest";
import {
  readBuyerProfileCookie,
  serializeBuyerProfile,
  BUYER_PROFILE_COOKIE,
  MAX_COOKIE_SIZE_BYTES,
} from "./buyer-profile";

describe("Buyer Profile Cookie Validation", () => {
  it("returns default empty profile when cookie is missing", () => {
    const store = { get: () => undefined };
    const profile = readBuyerProfileCookie(store);
    expect(profile).toEqual({ addresses: [] });
  });

  it("returns default empty profile when cookie contains invalid JSON", () => {
    const store = { get: () => ({ value: "not-json" }) };
    const profile = readBuyerProfileCookie(store);
    expect(profile).toEqual({ addresses: [] });
  });

  it("returns default empty profile when schema validation fails (e.g. addresses > 10)", () => {
    const invalidAddresses = Array.from({ length: 15 }, (_, i) => ({
      id: `addr-${i}`,
      label: "Rumah",
      recipientName: "Ahmad",
      phone: "081234567890",
      province: "Jawa Barat",
      city: "Bandung",
      address: "Jl. Riau No. 1",
      isPrimary: i === 0,
    }));
    const store = {
      get: () => ({
        value: JSON.stringify({ name: "Ahmad", addresses: invalidAddresses }),
      }),
    };
    const profile = readBuyerProfileCookie(store);
    expect(profile).toEqual({ addresses: [] });
  });

  it("parses valid buyer profile correctly", () => {
    const validData = {
      name: "Budi Santoso",
      phone: "081234567890",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      address: "Jl. Sudirman No. 10",
      addresses: [
        {
          id: "addr-1",
          label: "Kantor",
          recipientName: "Budi Santoso",
          phone: "081234567890",
          province: "DKI Jakarta",
          city: "Jakarta Selatan",
          address: "Jl. Sudirman No. 10",
          isPrimary: true,
        },
      ],
    };
    const store = {
      get: (name: string) =>
        name === BUYER_PROFILE_COOKIE ? { value: JSON.stringify(validData) } : undefined,
    };
    const profile = readBuyerProfileCookie(store);
    expect(profile.name).toBe("Budi Santoso");
    expect(profile.addresses.length).toBe(1);
    expect(profile.addresses[0].city).toBe("Jakarta Selatan");
  });

  it("throws when serialized buyer profile exceeds 4KB", () => {
    const hugeAddress = "A".repeat(300);
    const data = {
      name: "Huge Profile",
      addresses: Array.from({ length: 10 }, (_, i) => ({
        id: `addr-${i}`,
        label: "Label " + i,
        recipientName: "Recipient " + i,
        phone: "081234567890",
        province: "Provinsi yang sangat panjang sekali " + i,
        city: "Kota yang sangat panjang sekali " + i,
        address: hugeAddress,
        isPrimary: i === 0,
      })),
    };
    // If under 4KB, create artificial huge string
    const oversized = {
      name: "Huge",
      address: "X".repeat(5000),
      addresses: [],
    };
    expect(() => serializeBuyerProfile(oversized as any)).toThrow(/melebihi batas 4KB/);
  });
});
