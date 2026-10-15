/**
 * Utilitas baca/tulis localStorage yang aman.
 * Dipakai AuthContext dan api.js — satu-satunya data klien yang disimpan
 * adalah session login. Semua data bisnis (kantin, menu, pesanan, saldo)
 * tinggal di backend.
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
  session: "schooldesk.seller.auth.session",
};
