import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Konfigurasi Drizzle Kit.
 *
 * Sumber kebenaran koneksi: variabel `PG*` di .env (gaya libpq),
 * sama seperti yang dipakai psql. `DATABASE_URL` juga tetap didukung
 * bila kamu lebih suka gaya itu.
 *
 * Jalankan lewat script di package.json (bukan `npx drizzle-kit` langsung)
 * supaya path relatif di bawah ini di-resolve dari root backend/:
 *
 *   npm run db:generate   # buat file SQL migrasi dari src/db/schema/
 *   npm run db:push       # push schema langsung ke database (dev)
 *   npm run db:studio     # buka GUI Drizzle Studio
 *   npm run db:query      # cek koneksi / jalankan SQL bebas
 */

const url = process.env.DATABASE_URL;
const host = process.env.PGHOST;
const database = process.env.PGDATABASE;

if (!url && (!host || !database)) {
  throw new Error(
    "Koneksi database belum di-set. Isi PGHOST + PGDATABASE (atau DATABASE_URL) di .env",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: url
    ? { url }
    : {
        host: host!,
        port: Number(process.env.PGPORT ?? 5432),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: database!,
      },
});
