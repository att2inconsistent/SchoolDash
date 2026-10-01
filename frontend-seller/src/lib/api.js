import { STORAGE_KEYS, readJSON } from "./storage";

// Kosong = pakai proxy Vite (vite.config.js server.proxy), jadi request
// dikirim ke origin yang sama dengan app. Isi hanya kalau backend memang
// ada di host lain, mis. "http://192.168.1.5:4000".
const BASE = import.meta.env.VITE_API_URL ?? "";

function authToken() {
  const session = readJSON(STORAGE_KEYS.session, null);
  // Session sekarang masih menyimpan email (string). Setelah AuthContext
  // ditulis ulang isinya { token, user } — kedua bentuk harus aman dibaca.
  if (!session || typeof session !== "object") return null;
  return session.token ?? null;
}

/**
 * Panggil endpoint backend. Path ditulis tanpa prefix "/api".
 * Melempar Error dengan `pesan` dari server apa adanya — teks itu yang
 * ditampilkan frontend ke user, jadi jangan dibungkus ulang di sini.
 */
export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  // FormData harus lewat apa adanya: Content-Type-nya (termasuk boundary)
  // disetel browser, kalau kita isi manual multipart jadi rusak.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = authToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error("Tidak bisa menghubungi server. Pastikan backend sedang berjalan.");
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.pesan ?? "Terjadi kesalahan pada server.");
  return data;
}