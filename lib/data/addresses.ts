import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db/pool";
import type { BuyerAddress } from "@/types";

export interface UserAddressRecord {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockAddresses: UserAddressRecord[] = [];

export async function getUserAddresses(userId: string): Promise<UserAddressRecord[]> {
  if (!userId) return [];
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, user_id as "userId", label, recipient_name as "recipientName",
                phone, street_address as "streetAddress", city, province,
                postal_code as "postalCode", is_default as "isDefault",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM public.user_addresses
         WHERE user_id = $1
         ORDER BY is_default DESC, created_at DESC`,
        [userId],
      );
      return res.rows.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
      }));
    } catch (err) {
      logger.error("user_address.query_failed", err, { userId });
    }
  }

  return mockAddresses
    .filter((a) => a.userId === userId)
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

export async function saveUserAddress(
  userId: string,
  data: {
    id?: string;
    label?: string;
    recipientName: string;
    phone: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode?: string | null;
    isDefault?: boolean;
  },
): Promise<UserAddressRecord> {
  const pool = getPool();
  const id = data.id || randomUUID();
  const now = new Date().toISOString();
  const label = data.label || "Utama";
  const isDefault = Boolean(data.isDefault);

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (isDefault) {
        await client.query(
          `UPDATE public.user_addresses SET is_default = false WHERE user_id = $1`,
          [userId],
        );
      }
      const res = await client.query(
        `INSERT INTO public.user_addresses (
          id, user_id, label, recipient_name, phone, street_address, city, province, postal_code, is_default, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          label = EXCLUDED.label,
          recipient_name = EXCLUDED.recipient_name,
          phone = EXCLUDED.phone,
          street_address = EXCLUDED.street_address,
          city = EXCLUDED.city,
          province = EXCLUDED.province,
          postal_code = EXCLUDED.postal_code,
          is_default = EXCLUDED.is_default,
          updated_at = EXCLUDED.updated_at
        RETURNING id, user_id as "userId", label, recipient_name as "recipientName",
                  phone, street_address as "streetAddress", city, province,
                  postal_code as "postalCode", is_default as "isDefault",
                  created_at as "createdAt", updated_at as "updatedAt"`,
        [
          id,
          userId,
          label,
          data.recipientName,
          data.phone,
          data.streetAddress,
          data.city,
          data.province,
          data.postalCode ?? null,
          isDefault,
          now,
          now,
        ],
      );
      await client.query("COMMIT");
      return res.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("user_address.save_failed", err, { userId, id });
      throw err;
    } finally {
      client.release();
    }
  }

  if (isDefault) {
    mockAddresses.forEach((a) => {
      if (a.userId === userId) a.isDefault = false;
    });
  }

  const existingIdx = mockAddresses.findIndex((a) => a.id === id);
  const record: UserAddressRecord = {
    id,
    userId,
    label,
    recipientName: data.recipientName,
    phone: data.phone,
    streetAddress: data.streetAddress,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode ?? null,
    isDefault,
    createdAt: existingIdx >= 0 ? mockAddresses[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    mockAddresses[existingIdx] = record;
  } else {
    mockAddresses.unshift(record);
  }

  return record;
}

export async function deleteUserAddress(userId: string, addressId: string): Promise<boolean> {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `DELETE FROM public.user_addresses WHERE id = $1 AND user_id = $2`,
        [addressId, userId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      logger.error("user_address.delete_failed", err, { userId, addressId });
      throw err;
    }
  }

  const idx = mockAddresses.findIndex((a) => a.id === addressId && a.userId === userId);
  if (idx >= 0) {
    mockAddresses.splice(idx, 1);
    return true;
  }
  return false;
}

export async function syncUserAddresses(
  userId: string,
  addresses: Array<{
    id?: string;
    label?: string;
    recipientName: string;
    phone: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode?: string | null;
    isDefault?: boolean;
  }>,
): Promise<UserAddressRecord[]> {
  const pool = getPool();
  const now = new Date().toISOString();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM public.user_addresses WHERE user_id = $1`, [userId]);

      const inserted: UserAddressRecord[] = [];
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        const id = addr.id || randomUUID();
        const isDefault = addr.isDefault !== undefined ? addr.isDefault : i === 0;
        const res = await client.query(
          `INSERT INTO public.user_addresses (
            id, user_id, label, recipient_name, phone, street_address, city, province, postal_code, is_default, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, user_id as "userId", label, recipient_name as "recipientName",
                    phone, street_address as "streetAddress", city, province,
                    postal_code as "postalCode", is_default as "isDefault",
                    created_at as "createdAt", updated_at as "updatedAt"`,
          [
            id,
            userId,
            addr.label || (i === 0 ? "Utama" : `Alamat ${i + 1}`),
            addr.recipientName,
            addr.phone,
            addr.streetAddress,
            addr.city,
            addr.province,
            addr.postalCode ?? null,
            isDefault,
            now,
            now,
          ],
        );
        inserted.push(res.rows[0]);
      }
      await client.query("COMMIT");
      return inserted;
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error("user_address.sync_failed", err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  // Mock implementation
  for (let i = mockAddresses.length - 1; i >= 0; i--) {
    if (mockAddresses[i].userId === userId) {
      mockAddresses.splice(i, 1);
    }
  }

  const results: UserAddressRecord[] = addresses.map((addr, idx) => ({
    id: addr.id || randomUUID(),
    userId,
    label: addr.label || (idx === 0 ? "Utama" : `Alamat ${idx + 1}`),
    recipientName: addr.recipientName,
    phone: addr.phone,
    streetAddress: addr.streetAddress,
    city: addr.city,
    province: addr.province,
    postalCode: addr.postalCode ?? null,
    isDefault: addr.isDefault !== undefined ? addr.isDefault : idx === 0,
    createdAt: now,
    updatedAt: now,
  }));

  mockAddresses.unshift(...results);
  return results;
}

export function toBuyerAddress(record: UserAddressRecord): BuyerAddress {
  return {
    id: record.id,
    label: record.label,
    recipientName: record.recipientName,
    phone: record.phone,
    province: record.province,
    city: record.city,
    postalCode: record.postalCode || undefined,
    address: record.streetAddress,
    isPrimary: record.isDefault,
  };
}

export function _resetMockAddressesForTest() {
  mockAddresses.length = 0;
}
