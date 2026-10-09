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
  // Session login: { token, user }. Satu-satunya kredensial yang disimpan
  // di klien — password tidak pernah masuk localStorage.
  session: "schooldesk.seller.auth.session",

  // Sisa key di bawah ini masih dipakai contextseller yang belum ditulis ulang
  // (MenuContext/OrderContext/WalletContext). Hapus bersama ensureSeed saat
  // context-nya migrated ke API — DB adalah sumber kebenaran sekarang.
  vendors: "schooldesk.seller.vendors",
  menus: "schooldesk.seller.menus",
  orders: "schooldesk.seller.orders",
  balances: "schooldesk.seller.balances",
  earnings: "schooldesk.seller.earnings",
  withdrawals: "schooldesk.seller.withdrawals",
};
