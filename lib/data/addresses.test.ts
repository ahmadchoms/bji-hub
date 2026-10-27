import { describe, it, expect, beforeEach } from "vitest";

process.env.DATA_SOURCE = "mock";

import {
  getUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  syncUserAddresses,
  toBuyerAddress,
  _resetMockAddressesForTest,
} from "./addresses";

describe("addresses data module", () => {
  beforeEach(() => {
    _resetMockAddressesForTest();
  });

  it("returns empty list for unknown user", async () => {
    const list = await getUserAddresses("unknown-user");
    expect(list).toEqual([]);
  });

  it("saves a new address and retrieves it", async () => {
    const addr = await saveUserAddress("user-1", {
      label: "Rumah",
      recipientName: "Budi",
      phone: "081234567890",
      streetAddress: "Jl. Sudirman No. 12",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12190",
      isDefault: true,
    });

    expect(addr.id).toBeDefined();
    expect(addr.userId).toBe("user-1");
    expect(addr.isDefault).toBe(true);

    const list = await getUserAddresses("user-1");
    expect(list.length).toBe(1);
    expect(list[0].streetAddress).toBe("Jl. Sudirman No. 12");

    const buyerAddr = toBuyerAddress(list[0]);
    expect(buyerAddr.address).toBe("Jl. Sudirman No. 12");
    expect(buyerAddr.isPrimary).toBe(true);
  });

  it("handles isDefault toggle when adding a second default address", async () => {
    await saveUserAddress("user-1", {
      label: "Kantor",
      recipientName: "Budi",
      phone: "081234567890",
      streetAddress: "Jl. Gatot Subroto",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      isDefault: true,
    });

    await saveUserAddress("user-1", {
      label: "Rumah",
      recipientName: "Budi",
      phone: "081234567890",
      streetAddress: "Jl. Melati No. 5",
      city: "Bandung",
      province: "Jawa Barat",
      isDefault: true,
    });

    const list = await getUserAddresses("user-1");
    expect(list.length).toBe(2);
    // The newly added default should be isDefault: true, the first one unset
    const defaultAddr = list.find((a) => a.isDefault);
    expect(defaultAddr?.label).toBe("Rumah");
  });

  it("deletes an address", async () => {
    const saved = await saveUserAddress("user-1", {
      label: "Gudang",
      recipientName: "Budi",
      phone: "081234567890",
      streetAddress: "Jl. Industri",
      city: "Bekasi",
      province: "Jawa Barat",
    });

    const deleted = await deleteUserAddress("user-1", saved.id);
    expect(deleted).toBe(true);

    const list = await getUserAddresses("user-1");
    expect(list.length).toBe(0);
  });

  it("syncs user addresses in batch", async () => {
    await syncUserAddresses("user-2", [
      {
        recipientName: "Siti",
        phone: "08987654321",
        streetAddress: "Jl. Dago No. 1",
        city: "Bandung",
        province: "Jawa Barat",
        isDefault: true,
      },
      {
        label: "Kantor",
        recipientName: "Siti",
        phone: "08987654321",
        streetAddress: "Jl. Riau No. 2",
        city: "Bandung",
        province: "Jawa Barat",
        isDefault: false,
      },
    ]);

    const list = await getUserAddresses("user-2");
    expect(list.length).toBe(2);
    expect(list[0].streetAddress).toBe("Jl. Dago No. 1");
    expect(list[0].isDefault).toBe(true);
  });
});
