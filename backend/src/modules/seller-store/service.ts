import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { sellers, vendors } from '../../db/schema/index.js';
import type { UpdateStoreInput } from './schema.js';

type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

/**
 * Data kantin milik seller yang sedang login.
 *
 * `owner` dikembalikan sebagai email, bukan seller_id, karena MenuContext
 * mencari kantin dengan `v.owner === user.email` (MenuContext.jsx:57).
 */
export async function getStore(sellerId: number) {
  const [row] = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      tags: vendors.tags,
      rating: vendors.rating,
      time: vendors.time,
      image: vendors.image,
      sellerName: sellers.name,
      storeName: sellers.storeName,
      owner: sellers.email,
    })
    .from(vendors)
    .innerJoin(sellers, eq(vendors.sellerId, sellers.id))
    .where(eq(vendors.sellerId, sellerId))
    .limit(1);

  if (!row) {
    fail(404, 'Kantin tidak ditemukan.');
  }

  return row;
}

// ProfilePage mengirim tag sebagai string "Nasi, Goreng" (lihat
// storeForm.tags di ProfilePage.jsx). Pecah di sini, bukan di schema, supaya
// schema tetap bisa membedakan "tidak dikirim" dari "dikirim kosong".
function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((tag) => tag.slice(0, 30));
}

/**
 * Ubah profil kantin. Hanya `name` dan `tags` yang boleh diubah:
 * rating tidak boleh diset sendiri (nilai dari review), dan `sellerId`
 * jelas tidak boleh pindah.
 */
export async function updateStore(sellerId: number, input: UpdateStoreInput) {
  const patch: { name?: string; tags?: string[] } = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.tags !== undefined) patch.tags = parseTags(input.tags);

  const [row] = await db
    .update(vendors)
    .set(patch)
    .where(eq(vendors.sellerId, sellerId))
    .returning();

  if (!row) {
    fail(404, 'Kantin tidak ditemukan.');
  }

  return row;
}
