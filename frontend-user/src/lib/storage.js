/**
 * Utilitas baca/tulis localStorage yang aman.
 * Dipakai AuthContext, CartContext, dan api.js. Selain session & keranjang,
 * semua data bisnis tinggal di backend.
 */

export function readJSON(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    // localStorage bisa gagal (private mode / quota penuh) — pakai fallback.
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // abaikan agar UI tidak crash kalau storage penuh
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // abaikan
  }
}

export const STORAGE_KEYS = {
  // Session login: { token, user }. Satu-satunya kredensial yang disimpan
  // di klien — password tidak pernah masuk localStorage.
  session: "schooldesk.auth.session",

  // Keranjang siswa masih lokal (keputusan §2: cart global, belum ikut server).
  cart: "schooldesk.cart",
};
