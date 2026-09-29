/**
 * Utilitas baca/tulis localStorage yang aman.
 * Dipakai oleh AuthContext, MenuContext, OrderContext, dan WalletContext
 * supaya data tidak hilang saat seller refresh browser atau buka URL langsung.
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

/**
 * Isi data contoh HANYA saat key belum pernah ada (first run).
 * Supaya akun demo seller punya menu & pesanan untuk didemokan.
 */
export function ensureSeed(key, seedValue) {
  try {
    if (window.localStorage.getItem(key) === null) {
      window.localStorage.setItem(key, JSON.stringify(seedValue));
      return true;
    }
  } catch {
    // abaikan
  }
  return false;
}

export const STORAGE_KEYS = {
  // Akun seller (terpisah dari akun pembeli di frontend-user)
  users: "schooldesk.seller.auth.users",
  session: "schooldesk.seller.auth.session",
  pending: "schooldesk.seller.auth.pendingRegistration",
  otp: "schooldesk.seller.auth.otpStore",

  // Data toko & menu — khusus seller, bentuknya disamakan dengan menuData.js
  vendors: "schooldesk.seller.vendors",
  menus: "schooldesk.seller.menus",

  // Pesanan masuk, saldo, pendapatan & penarikan
  orders: "schooldesk.seller.orders",
  balances: "schooldesk.seller.balances",
  earnings: "schooldesk.seller.earnings",
  withdrawals: "schooldesk.seller.withdrawals",
};
