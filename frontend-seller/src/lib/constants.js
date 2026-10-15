/**
 * Konstanta statis UI seller — bukan data mock, hanya label & pilihan tetap.
 * Sumber data (kantin, menu, pesanan, saldo) sepenuhnya dari backend.
 */

/** Kategori menu — kunci sama dengan kategori backend (1..4) + "semua". */
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
