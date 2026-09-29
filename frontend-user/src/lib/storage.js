/**
 * Utilitas baca/tulis localStorage yang aman.
 * Dipakai oleh AuthContext, WalletContext, CartContext, dan OrderContext
 * supaya data tidak hilang saat user refresh browser atau buka URL langsung.
 *
 * CATATAN: ini masih placeholder untuk demo. Saat backend sudah jadi,
 * ganti dengan panggilan API (fetch/axios) — strukturnya dibuat sama
 * supaya perubahannya tinggal di satu file context.
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
  users: "schooldesk.auth.users",
  session: "schooldesk.auth.session",
  pending: "schooldesk.auth.pendingRegistration",
  otp: "schooldesk.auth.otpStore",
  balances: "schooldesk.wallet.balances",
  transactions: "schooldesk.wallet.transactions",
  cart: "schooldesk.cart",
  orders: "schooldesk.orders",
};
