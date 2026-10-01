import { and, asc, eq, exists, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '../../config/db.js';
import { categories, menuItems, sellers, vendors } from '../../db/schema/index.js';

export interface CatalogFilters {
  q?: string;
  category?: string;
  vendorId?: number;
}

// Urutan tombol di UI. `categories` tidak punya kolom urutan, jadi diurutkan di
// sini supaya urutan frontend tidak ikut berubah kalau baris DB diurutkan lain.
const CATEGORY_ORDER = ['berat', 'minuman', 'cemilan', 'sehat'];

// ILIKE memperlakukan % dan _ sebagai wildcard. Escape dulu supaya pencarian
// "50%" tidak ikut jadi wildcard.
function likePattern(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  return `%${trimmed.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function ilikeAny(columns: readonly AnyPgColumn[], pattern: string) {
  return sql.join(
    columns.map((column) => sql`${column} ILIKE ${pattern} ESCAPE '\\'`),
    sql` OR `
  );
}

// Tag vendor disimpan sebagai text[], jadi harus di-unwrap di dalam subquery
// untuk bisa dicocokkan per elemen.
function tagsMatchQuery(pattern: string) {
  return sql`EXISTS (
    SELECT 1 FROM unnest(${vendors.tags}) AS tag
    WHERE tag ILIKE ${pattern} ESCAPE '\\'
  )`;
}

// Filter kategori dipakai dua arah: menu dicocokkan langsung ke kolomnya,
// vendor dicek punya minimal satu menu aktif di kategori tersebut.
function menuCategoryFilter(category: string) {
  return exists(
    db
      .select({ one: sql`1` })
      .from(menuItems)
      .where(
        and(
          eq(menuItems.vendorId, vendors.id),
          eq(menuItems.category, category as (typeof menuItems.category.enumValues)[number]),
          eq(menuItems.active, true)
        )
      )
  );
}

export async function listCategories() {
  const rows = await db.select().from(categories);

  return rows
    .slice()
    .sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.key) - CATEGORY_ORDER.indexOf(b.key)
    )
    .map((row) => ({ key: row.key, label: row.label }));
}

export async function listVendors(filters: CatalogFilters = {}) {
  const pattern = likePattern(filters.q ?? '');
  const conditions = [];

  // Tanpa filter, ambil semua kantin. Cantin tanpa akun penjual tetap tampil
  // (sellerId nullable) — owner-nya null.
  if (pattern) {
    conditions.push(sql`(${ilikeAny([vendors.name], pattern)} OR ${tagsMatchQuery(pattern)})`);
  }

  const category = filters.category?.trim();
  if (category && category !== 'semua') {
    conditions.push(menuCategoryFilter(category));
  }

  const rows = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      tags: vendors.tags,
      rating: vendors.rating,
      time: vendors.time,
      image: vendors.image,
      // `owner` di frontend berupa email. Di DB sudah dinormalisasi jadi
      // seller_id, jadi dipetakan balik di sini.
      owner: sellers.email,
    })
    .from(vendors)
    .leftJoin(sellers, eq(vendors.sellerId, sellers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(vendors.id));

  return rows.map((row) => ({ ...row, owner: row.owner ?? null }));
}

export async function listMenus(filters: CatalogFilters = {}) {
  const pattern = likePattern(filters.q ?? '');
  const conditions = [eq(menuItems.active, true)];

  if (filters.vendorId !== undefined) {
    conditions.push(eq(menuItems.vendorId, filters.vendorId));
  }

  const category = filters.category?.trim();
  if (category && category !== 'semua') {
    conditions.push(
      eq(menuItems.category, category as (typeof menuItems.category.enumValues)[number])
    );
  }

  // `searchMenuItems` di frontend mencocokkan kata kunci ke nama/deskripsi menu
  // ATAU ke nama/tag kantinnya, jadi keduanya ikut dicari di sini.
  if (pattern) {
    const menuMatch = ilikeAny([menuItems.name, menuItems.description], pattern);

    conditions.push(
      sql`(${menuMatch}
        OR ${vendors.name} ILIKE ${pattern} ESCAPE '\\'
        OR ${tagsMatchQuery(pattern)})`
    );
  }

  return db
    .select({
      id: menuItems.id,
      vendorId: menuItems.vendorId,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      category: menuItems.category,
      image: menuItems.image,
      vendorName: vendors.name,
    })
    .from(menuItems)
    .innerJoin(vendors, eq(menuItems.vendorId, vendors.id))
    .where(and(...conditions))
    .orderBy(asc(menuItems.id));
}

export async function getVendorById(vendorId: number) {
  const row = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      tags: vendors.tags,
      rating: vendors.rating,
      time: vendors.time,
      image: vendors.image,
      owner: sellers.email,
    })
    .from(vendors)
    .leftJoin(sellers, eq(vendors.sellerId, sellers.id))
    .where(eq(vendors.id, vendorId))
    .limit(1);

  const found = row[0];
  if (!found) return null;

  return { ...found, owner: found.owner ?? null };
}

export async function getMenuById(menuId: number) {
  const row = await db
    .select({
      id: menuItems.id,
      vendorId: menuItems.vendorId,
      name: menuItems.name,
      description: menuItems.description,
      price: menuItems.price,
      category: menuItems.category,
      image: menuItems.image,
      active: menuItems.active,
      vendorName: vendors.name,
    })
    .from(menuItems)
    .innerJoin(vendors, eq(menuItems.vendorId, vendors.id))
    .where(eq(menuItems.id, menuId))
    .limit(1);

  return row[0] ?? null;
}
