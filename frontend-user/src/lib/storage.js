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
  // Session login: { token, user }. Satu-satunya kredensial yang disimpan
  // di klien — password tidak pernah masuk localStorage.
  session: "schooldesk.auth.session",

  // Keranjang siswa masih lokal (keputusan §2: cart global, belum ikut server).
  cart: "schooldesk.cart",

  // Key di bawah ini masih dipakai OrderContext & WalletContext yang belum
  // ditulis ulang (masih localStorage + setTimeout). Hapus bareng pemindahan
  // context itu ke API — DB adalah sumber kebenaran sekarang.
  balances: "schooldesk.wallet.balances",
  transactions: "schooldesk.wallet.transactions",
  orders: "schooldesk.orders",
};
