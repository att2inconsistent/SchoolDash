/**
 * Perintah query database dari terminal.
 *
 *   npm run db:query                       # cek koneksi + daftar tabel
 *   npm run db:query -- "SELECT 1 AS cek"   # jalankan SQL bebas
 *   npm run db:query -- "CREATE TABLE ..."  # DDL/DML juga boleh
 *
 * Koneksi dibaca dari variabel PG* di .env (gaya libpq).
 * DATABASE_URL juga didukung bila diisi — diprioritaskan lebih dulu.
 * Database otomatis dibuat bila belum ada.
 *
 * File ini dijalankan lewat tsx dan sengaja di-luar tsconfig "include".
 */
import "dotenv/config";
import pg from "pg";

const log = (...args: unknown[]) => console.log(...args);

function die(message: string): never {
  // stdout, bukan stderr: di PowerShell console.error dibungkus jadi
  // NativeCommandError yang berantakan. Exit code tetap 1.
  console.log(`[GAGAL] ${message}`);
  process.exit(1);
}

/**
 * Susun opsi koneksi pg.
 * `database` dipakai untuk menimpa DB target (mis. maintenance -> "postgres").
 *
 * Tipe return sengaja dibiarkan di-infer (union dari dua bentuk) supaya
 * langsung cocok dengan parameter `ClientConfig` milik pg tanpa perlu
 * `import type` — dan tetap aman kalau ada field yang lupa diisi.
 */
function connConfig(database?: string) {
  const url = process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    if (database) u.pathname = `/${database}`;
    return { connectionString: u.toString() };
  }
  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: database ?? process.env.PGDATABASE,
  };
}

/** Nama database target, dari DATABASE_URL atau PGDATABASE. */
function resolveDbName(): string {
  const url = process.env.DATABASE_URL;
  if (url) {
    const name = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
    if (name) return name;
  }
  const name = process.env.PGDATABASE;
  if (name) return name;
  return die(
    "Nama database belum di-set. Isi PGDATABASE (atau DATABASE_URL) di .env.",
  );
}

/** Terjemahkan kode error Postgres ke bahasa yang manusiawi. */
function describeError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  switch (e.code) {
    case "28P01":
      return (
        "Password salah (28P01). Buka backend/.env lalu ganti " +
        "PGPASSWORD dengan password user postgres kamu."
      );
    case "3D000":
      return "Database tidak ditemukan (3D000).";
    case "ECONNREFUSED":
      return "Postgres tidak bisa dihubungi di port " +
        `${process.env.PGPORT ?? 5432}. Pastikan layanan ` +
        "'postgresql-x64-18' sedang berjalan.";
    case "ENOTFOUND":
      return "Host database tidak ditemukan. Cek PGHOST di .env.";
    default:
      return e.message ?? String(err);
  }
}

/** Nama identifier selalu di-quote — nama seperti "sch-dash" wajib. */
function escapeIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Cetak array of row object sebagai tabel sederhana (tanpa dependensi). */
function printTable(rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    log("(0 baris)");
    return;
  }
  const cols = Object.keys(rows[0]!);
  const widths = cols.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length)),
  );
  const pad = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i]!)).join(" | ");

  log(pad(cols));
  log(widths.map((w) => "-".repeat(w)).join("-+-"));
  for (const row of rows) {
    log(pad(cols.map((c) => String(row[c] ?? ""))));
  }
  log(`(${rows.length} baris)`);
}

async function main(): Promise<void> {
  const dbName = resolveDbName();

  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    die("Koneksi belum di-set. Isi PGHOST + PGDATABASE di backend/.env.");
  }

  // ── 1. Maintenance: pastikan database target sudah ada ────────────
  const admin = new pg.Client(connConfig("postgres"));
  try {
    await admin.connect();
    const found = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (found.rowCount === 0) {
      log(`[...] Membuat database "${dbName}"`);
      await admin.query(`CREATE DATABASE ${escapeIdent(dbName)}`);
      log(`[OK]  Database "${dbName}" dibuat.`);
    } else {
      log(`[OK]  Database "${dbName}" tersedia.`);
    }
  } catch (err) {
    die(describeError(err));
  } finally {
    await admin.end().catch(() => undefined);
  }

  // ── 2. Koneksi ke database target ─────────────────────────────────
  const db = new pg.Client(connConfig());
  try {
    await db.connect();
  } catch (err) {
    die(describeError(err));
  }

  const sql = process.argv.slice(2).join(" ").trim();

  try {
    if (sql) {
      const started = Date.now();
      const res = await db.query(sql);
      const ms = Date.now() - started;
      printTable(res.rows);
      log(`Selesai dalam ${ms} ms, ${res.rowCount} baris terpengaruh.`);
    } else {
      // Health check bila tidak diberi SQL.
      const ver = await db.query("SELECT version() AS versi");
      printTable(ver.rows);

      const tables = await db.query(
        "SELECT table_name AS tabel FROM information_schema.tables " +
          "WHERE table_schema = 'public' ORDER BY table_name",
      );
      log("");
      if (tables.rows.length > 0) {
        log("Tabel di schema public:");
        printTable(tables.rows);
      } else {
        log("Belum ada tabel. Langkah berikutnya:");
        log("  npm run db:generate   # buat SQL dari src/db/schema/");
        log("  npm run db:push       # terapkan ke database");
      }
    }
  } catch (err) {
    die(describeError(err));
  } finally {
    await db.end().catch(() => undefined);
  }
}

main().catch((err) => die(describeError(err)));
