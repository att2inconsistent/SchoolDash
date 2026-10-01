import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { sellers, vendors, wallets } from '../../db/schema/index.js';
import { hashPassword } from '../auth/service.js';
import type { JwtPayload } from '../../middleware/auth.js';
import type { ChangePasswordInput, LoginInput, RegisterInput } from './schema.js';

const TOKEN_EXPIRES = '7d';
const SECRET = process.env['JWT_SECRET'];

if (!SECRET) {
  throw new Error('JWT_SECRET belum diisi di .env');
}

const secret: string = SECRET;

type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

function signToken(id: number): string {
  const payload: JwtPayload = { sub: id, role: 'seller' };
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRES });
}

function toPublicUser(row: typeof sellers.$inferSelect) {
  return { id: row.id, name: row.name, email: row.email, storeName: row.storeName };
}

/**
 * Kantin milik seller ini. Dipakai router seller (orders, wallet, menus)
  * supaya semua data yang diambil seller otomatis ter-scope ke kantin dirinya
  * sendiri — bukan kantin yang seller pilih dari parameter request.
 */
export async function getVendorForSeller(sellerId: number) {
  const [row] = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      sellerId: vendors.sellerId,
    })
    .from(vendors)
    .where(eq(vendors.sellerId, sellerId))
    .limit(1);

  if (!row) {
    throw { status: 404, message: 'Kantin tidak ditemukan.' } satisfies AppError;
  }

  return row;
}

export async function register(input: RegisterInput) {
  const exists = await db.query.sellers.findFirst({
    where: eq(sellers.email, input.email),
    columns: { id: true },
  });

  if (exists) {
    fail(409, 'Email sudah terdaftar.');
  }

  const passwordHash = await hashPassword(input.password);

  // Akun + kantin + dompet dibuat dalam satu transaksi: MenuContext.jsx:66-80
  // membuat kantin sendiri saat vendor tidak ditemukan, jadi kantin yang tidak
  // dibuat di sini akan jadi duplikat begitu seller frontend tersambung.
  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(sellers)
      .values({
        name: input.name,
        email: input.email,
        passwordHash,
        storeName: input.storeName,
      })
      .returning();

    if (!row) {
      throw new Error('Insert sellers tidak mengembalikan baris.');
    }

    await tx.insert(vendors).values({
      sellerId: row.id,
      name: input.storeName,
    });

    await tx.insert(wallets).values({
      ownerType: 'seller',
      ownerId: row.id,
      balance: 0,
    });

    return row;
  });

  return { token: signToken(created.id), user: toPublicUser(created) };
}

export async function login(input: LoginInput) {
  const row = await db.query.sellers.findFirst({
    where: eq(sellers.email, input.email),
  });

  // Pesan sama untuk email tidak terdaftar maupun password salah, supaya tidak
  // bisa dipakai menebak email yang ada.
  if (!row || !(await bcrypt.compare(input.password, row.passwordHash))) {
    fail(401, 'Email atau password salah.');
  }

  return { token: signToken(row.id), user: toPublicUser(row) };
}

export async function me(sellerId: number) {
  const row = await db.query.sellers.findFirst({
    where: eq(sellers.id, sellerId),
  });

  if (!row) {
    fail(404, 'Akun tidak ditemukan.');
  }

  return toPublicUser(row);
}

export async function changePassword(sellerId: number, input: ChangePasswordInput) {
  const row = await db.query.sellers.findFirst({
    where: eq(sellers.id, sellerId),
  });

  if (!row) {
    fail(404, 'Akun tidak ditemukan.');
  }

  if (!(await bcrypt.compare(input.currentPassword, row.passwordHash))) {
    fail(401, 'Password saat ini tidak sesuai.');
  }

  if (await bcrypt.compare(input.newPassword, row.passwordHash)) {
    fail(400, 'Password baru tidak boleh sama dengan password lama.');
  }

  await db
    .update(sellers)
    .set({ passwordHash: await hashPassword(input.newPassword) })
    .where(eq(sellers.id, sellerId));
}