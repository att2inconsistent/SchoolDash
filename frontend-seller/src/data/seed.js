/**
 * Data contoh (seed) untuk frontend-seller.
 *
 * Semua di sini HANYA dijalankan sekali saat pertama kali aplikasi dibuka
 * (lihat ensureSeed di context masing-masing) — supaya akun demo seller punya
 * kantin, menu, pesanan, dan saldo untuk langsung didemokan.
 *
 * TODO(backend): nanti semua ini diganti dengan isi database
 * (vendors, menus, orders, sellers, wallets).
 */

/** Kategori menu — disamakan dengan frontend-user. */
export const CATEGORIES = [
  { key: "semua", label: "Semua" },
  { key: "berat", label: "Makanan Berat" },
  { key: "minuman", label: "Minuman" },
  { key: "cemilan", label: "Cemilan" },
  { key: "sehat", label: "Sehat" },
];

export function getCategoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || "-";
}

/** Bank yang tersedia untuk penarikan dana (transfer antar bank). */
export const BANKS = [
  { code: "BCA", name: "Bank Central Asia" },
  { code: "MANDIRI", name: "Bank Mandiri" },
  { code: "BRI", name: "Bank Rakyat Indonesia" },
  { code: "BNI", name: "Bank Negara Indonesia" },
  { code: "BSI", name: "Bank Syariah Indonesia" },
];

const MINUTES = 60 * 1000;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const ago = (ms) => new Date(Date.now() - ms).toISOString();

/** Kantin — bentuknya sama dengan `vendors` di frontend-user. */
export const SEED_VENDORS = [
  {
    id: 1,
    name: "Konsinyasi",
    tags: ["Nasi kulit jeruk", "Nasi Goreng"],
    rating: 4.8,
    time: "10-15 Menit",
    image: null,
    owner: "konsinyasi@seller.test",
  },
  {
    id: 2,
    name: "Mie Ayam",
    tags: ["Mie ayam", "Mie yamin"],
    rating: 4.6,
    time: "5-10 Menit",
    image: null,
    owner: null, // kantin ini belum punya akun seller
  },
  {
    id: 3,
    name: "Kedai Jus",
    tags: ["Jus Buah", "Healthy"],
    rating: 4.9,
    time: "15-20 Menit",
    image: null,
    owner: "jus@seller.test",
  },
];

/** Menu — sama seperti menuData.js di frontend-user + field seller. */
export const SEED_MENUS = [
  { id: "1-1", vendorId: 1, name: "Nasi Kulit Jeruk", description: "Nasi + kulit ayam + daun jeruk", price: 12000, category: "berat", image: null, active: true },
  { id: "1-2", vendorId: 1, name: "Nasi Goreng", description: "Nasi yang di goreng", price: 10000, category: "berat", image: null, active: true },
  { id: "1-3", vendorId: 1, name: "Ayam Geprek", description: "Ayam crispy + sambal", price: 13000, category: "berat", image: null, active: true },
  { id: "1-4", vendorId: 1, name: "Pisang Goreng", description: "Pisang goreng renyah disiram madu", price: 5000, category: "cemilan", image: null, active: true },
  { id: "2-1", vendorId: 2, name: "Mie Ayam", description: "Mie + ayam cincang + pangsit goreng", price: 12000, category: "berat", image: null, active: true },
  { id: "2-2", vendorId: 2, name: "Mie Yamin", description: "Mie + ayam cincang + pangsit goreng + kecap", price: 12000, category: "berat", image: null, active: true },
  { id: "2-3", vendorId: 2, name: "Tahu Crispy", description: "Tahu renyah dengan bumbu balado", price: 6000, category: "cemilan", image: null, active: true },
  { id: "3-1", vendorId: 3, name: "Jus Alpukat", description: "Jus alpukat segar", price: 8000, category: "minuman", image: null, active: true },
  { id: "3-2", vendorId: 3, name: "Jus Jeruk", description: "Jus jeruk peras asli", price: 7000, category: "minuman", image: null, active: true },
  { id: "3-3", vendorId: 3, name: "Salad Buah", description: "Potongan buah segar + yogurt", price: 9000, category: "sehat", image: null, active: true },
];

/** Akun seller demo — password plaintext HANYA untuk demo lokal. */
export const SEED_SELLERS = [
  {
    name: "Andi Saputra",
    storeName: "Konsinyasi",
    email: "konsinyasi@seller.test",
    password: "password123",
  },
  {
    name: "Dewi Lestari",
    storeName: "Kedai Jus",
    email: "jus@seller.test",
    password: "password123",
  },
];

/** Pesanan masuk contoh (dari aplikasi pembeli). */
export const SEED_ORDERS = [
  {
    id: "ORD-K1A2",
    createdAt: ago(2 * DAYS),
    status: "Selesai",
    credited: true,
    vendorId: 1,
    vendor: "Konsinyasi",
    buyer: { name: "Budi Santoso", kelas: "XI-RPL" },
    items: [
      { id: "1-2", name: "Nasi Goreng", price: 10000, qty: 1 },
      { id: "1-3", name: "Ayam Geprek", price: 13000, qty: 1 },
    ],
    totalItems: 2,
    total: 23000,
  },
  {
    id: "ORD-M4X9",
    createdAt: ago(35 * MINUTES),
    status: "Menunggu",
    credited: false,
    vendorId: 1,
    vendor: "Konsinyasi",
    buyer: { name: "Siti Aminah", kelas: "X-TKJ" },
    items: [{ id: "1-1", name: "Nasi Kulit Jeruk", price: 12000, qty: 2 }],
    totalItems: 2,
    total: 24000,
  },
  {
    id: "ORD-J7B3",
    createdAt: ago(12 * MINUTES),
    status: "Menunggu",
    credited: false,
    vendorId: 3,
    vendor: "Kedai Jus",
    buyer: { name: "Rina Wijaya", kelas: "XII-DKV" },
    items: [{ id: "3-1", name: "Jus Alpukat", price: 8000, qty: 3 }],
    totalItems: 3,
    total: 24000,
  },
];

/** Riwayat "Dana masuk" dari pesanan yang sudah diterima. */
export const SEED_EARNINGS = [
  {
    id: "EAR-K1A2",
    email: "konsinyasi@seller.test",
    vendorId: 1,
    orderId: "ORD-K1A2",
    amount: 23000,
    note: "Pesanan ORD-K1A2",
    createdAt: ago(2 * DAYS),
  },
  {
    id: "EAR-K001",
    email: "konsinyasi@seller.test",
    vendorId: 1,
    orderId: null,
    amount: 52000,
    note: "Pesanan lama",
    createdAt: ago(5 * DAYS),
  },
  {
    id: "EAR-J001",
    email: "jus@seller.test",
    vendorId: 3,
    orderId: null,
    amount: 40000,
    note: "Pesanan lama",
    createdAt: ago(3 * DAYS),
  },
];

/** Riwayat penarikan dana (transfer antar bank). */
export const SEED_WITHDRAWALS = [
  {
    id: "WDR-K500",
    email: "konsinyasi@seller.test",
    bank: "BCA",
    accountName: "Andi Saputra",
    accountNumber: "1234567890",
    amount: 50000,
    status: "Selesai",
    createdAt: ago(1 * DAYS),
  },
];

/**
 * Saldo awal per email — dihitung dari earnings & withdrawals supaya selalu
 * konsisten: saldo = total pendapatan - total penarikan.
 */
export const SEED_BALANCES = SEED_SELLERS.reduce((balances, seller) => {
  const earned = SEED_EARNINGS.filter((e) => e.email === seller.email).reduce(
    (sum, e) => sum + e.amount,
    0
  );
  const withdrawn = SEED_WITHDRAWALS.filter(
    (w) => w.email === seller.email
  ).reduce((sum, w) => sum + w.amount, 0);
  balances[seller.email] = earned - withdrawn;
  return balances;
}, {});
