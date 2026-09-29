// Data vendor & menu contoh — pindah dari App.jsx supaya bisa dipakai
// oleh route /menu/:vendorId tanpa harus menyimpan state terpusat.
// TODO(backend): ganti dengan fetch ke API (/api/vendors, /api/menus).

/** Daftar kategori — dipakai tombol kategori & logika filter (satu sumber). */
export const CATEGORIES = [
  { key: "semua", label: "Semua" },
  { key: "berat", label: "Makanan Berat" },
  { key: "minuman", label: "Minuman" },
  { key: "cemilan", label: "Cemilan" },
  { key: "sehat", label: "Sehat" },
];

export const vendors = [
  {
    id: 1,
    name: "Konsinyasi",
    tags: ["Nasi kulit jeruk", "Nasi Goreng"],
    rating: 4.8,
    time: "10-15 Menit",
    image: null,
  },
  {
    id: 2,
    name: "Mie Ayam",
    tags: ["Mie ayam", "Mie yamin"],
    rating: 4.6,
    time: "5-10 Menit",
    image: null,
  },
  {
    id: 3,
    name: "Kedai Jus",
    tags: ["Jus Buah", "Healthy"],
    rating: 4.9,
    time: "15-20 Menit",
    image: null,
  },
];

// Tiap menu punya `category` yang salah satu dari key CATEGORIES di atas.
export const menuByVendor = {
  1: [
    {
      id: "1-1",
      name: "Nasi Kulit Jeruk",
      description: "Nasi + kulit ayam + daun jeruk",
      price: 12000,
      category: "berat",
      image: null,
    },
    {
      id: "1-2",
      name: "Nasi Goreng",
      description: "Nasi yang di goreng",
      price: 10000,
      category: "berat",
      image: null,
    },
    {
      id: "1-3",
      name: "Ayam Geprek",
      description: "Ayam crispy + sambal",
      price: 13000,
      category: "berat",
      image: null,
    },
    {
      id: "1-4",
      name: "Pisang Goreng",
      description: "Pisang goreng renyah disiram madu",
      price: 5000,
      category: "cemilan",
      image: null,
    },
  ],
  2: [
    {
      id: "2-1",
      name: "Mie Ayam",
      description: "Mie + ayam cincang + pangsit goreng",
      price: 12000,
      category: "berat",
      image: null,
    },
    {
      id: "2-2",
      name: "Mie Yamin",
      description: "Mie + ayam cincang + pangsit goreng + kecap",
      price: 12000,
      category: "berat",
      image: null,
    },
    {
      id: "2-3",
      name: "Tahu Crispy",
      description: "Tahu renyah dengan bumbu balado",
      price: 6000,
      category: "cemilan",
      image: null,
    },
  ],
  3: [
    {
      id: "3-1",
      name: "Jus Alpukat",
      description: "Jus alpukat segar",
      price: 8000,
      category: "minuman",
      image: null,
    },
    {
      id: "3-2",
      name: "Jus Jeruk",
      description: "Jus jeruk peras asli",
      price: 7000,
      category: "minuman",
      image: null,
    },
    {
      id: "3-3",
      name: "Salad Buah",
      description: "Potongan buah segar + yogurt",
      price: 9000,
      category: "sehat",
      image: null,
    },
  ],
};

export function getVendorById(id) {
  const numericId = Number(id);
  return vendors.find((v) => v.id === numericId) || null;
}

export function getMenuByVendor(id) {
  return menuByVendor[Number(id)] || [];
}

export function getCategoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || "Semua";
}

/* ==========================================================================
 *  LOGIKA PENCARIAN & FILTER
 *  Semua fungsi murni (tanpa React) supaya gampang diuji dan dipakai ulang.
 * ========================================================================== */

function normalize(text) {
  return String(text ?? "").toLowerCase().trim();
}

/** Cocokkan satu kata kunci ke banyak kandidat teks (case-insensitive). */
function matchesAny(query, candidates) {
  const q = normalize(query);
  if (!q) return true;
  return candidates.some((candidate) => normalize(candidate).includes(q));
}

/** Vendor punya minimal satu menu di kategori tersebut? */
function hasCategory(vendor, kategori) {
  if (!kategori || kategori === "semua") return true;
  return getMenuByVendor(vendor.id).some((item) => item.category === kategori);
}

/**
 * Filter daftar vendor.
 * Vendor tampil kalau: kategorinya sesuai DAN (nama/tags vendor ATAU
 * salah satu nama/deskripsi menunya) mengandung kata kunci pencarian.
 */
export function filterVendors({ query = "", kategori = "semua" } = {}) {
  return vendors.filter((vendor) => {
    if (!hasCategory(vendor, kategori)) return false;

    const menuTexts = getMenuByVendor(vendor.id).flatMap((item) => [
      item.name,
      item.description,
    ]);

    return matchesAny(query, [vendor.name, ...vendor.tags, ...menuTexts]);
  });
}

/**
 * Cari menu/makanan yang cocok — dipakai section "Menu Cocok".
 * Hasilnya sudah dilengkapi vendorId & vendorName supaya bisa langsung
 * menampilkan nama kantin dan tombol "Lihat Menu".
 */
export function searchMenuItems({ query = "", kategori = "semua" } = {}) {
  const results = [];

  for (const vendor of vendors) {
    for (const item of getMenuByVendor(vendor.id)) {
      if (kategori && kategori !== "semua" && item.category !== kategori) {
        continue;
      }

      const cocokTeks = matchesAny(query, [item.name, item.description]);
      const cocokVendor = matchesAny(query, [vendor.name, ...vendor.tags]);

      if (cocokTeks || cocokVendor) {
        results.push({
          ...item,
          vendorId: vendor.id,
          vendorName: vendor.name,
        });
      }
    }
  }

  return results;
}
