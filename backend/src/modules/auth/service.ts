import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { students, wallets } from '../../db/schema/index.js';
import type { JwtPayload } from '../../middleware/auth.js';
import type { ChangePasswordInput, LoginInput, RegisterInput } from './schema.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES = '7d';

const SECRET = process.env['JWT_SECRET'];

if (!SECRET) {
  throw new Error('JWT_SECRET belum diisi di .env');
}

const secret: string = SECRET;

// Bentuk error yang dikenali app.ts: status + pesan yang dikirim apa adanya ke UI
type AppError = { status: number; message: string };

function fail(status: number, message: string): never {
  throw { status, message } satisfies AppError;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function signToken(id: number): string {
  const payload: JwtPayload = { sub: id, role: 'student' };
  return jwt.sign(payload, secret, { expiresIn: TOKEN_EXPIRES });
}

// hash & id internal tidak pernah dikirim ke frontend
function toPublicUser(row: typeof students.$inferSelect) {
  return { id: row.id, name: row.name, email: row.email, kelas: row.kelas };
}

export async function register(input: RegisterInput) {
  const exists = await db.query.students.findFirst({
    where: eq(students.email, input.email),
    columns: { id: true },
  });

  if (exists) {
    fail(409, 'Email sudah terdaftar.');
  }

  const passwordHash = await hashPassword(input.password);

  // Akun + dompet dibuat dalam satu transaksi supaya tidak ada siswa tanpa saldo.
  const created = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(students)
      .values({
        name: input.name,
        email: input.email,
        passwordHash,
        kelas: input.kelas,
      })
      .returning();

    if (!row) {
      throw new Error('Insert students tidak mengembalikan baris.');
    }

    await tx.insert(wallets).values({
      ownerType: 'student',
      ownerId: row.id,
      balance: 0,
    });

    return row;
  });

  return { token: signToken(created.id), user: toPublicUser(created) };
}

export async function login(input: LoginInput) {
  const row = await db.query.students.findFirst({
    where: eq(students.email, input.email),
  });

  // Pesan yang sama untuk email tidak ada maupun password salah, supaya
  // tidak bisa dipakai menebak email yang terdaftar.
  if (!row || !(await bcrypt.compare(input.password, row.passwordHash))) {
    fail(401, 'Email atau password salah.');
  }

  return { token: signToken(row.id), user: toPublicUser(row) };
}

export async function me(studentId: number) {
  const row = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!row) {
    fail(404, 'Akun tidak ditemukan.');
  }

  return toPublicUser(row);
}

export async function changePassword(studentId: number, input: ChangePasswordInput) {
  const row = await db.query.students.findFirst({
    where: eq(students.id, studentId),
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
    .update(students)
    .set({ passwordHash: await hashPassword(input.newPassword) })
    .where(eq(students.id, studentId));
}
