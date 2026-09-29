/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { readJSON, writeJSON, ensureSeed, STORAGE_KEYS } from "../lib/storage";
import { SEED_VENDORS, SEED_MENUS } from "../data/seed";

const MenuContext = createContext(null);

/** Delay palsu supaya terasa seperti memanggil API (ganti dgn fetch nanti). */
const fakeLatency = (ms = 300) => new Promise((r) => setTimeout(r, ms));

/**
 * ==========================================================================
 *  PLACEHOLDER DATA TOKO — kantin (vendor) + daftar menu milik seller.
 *
 *  TODO(backend) — ganti isi fungsi-fungsi ini dengan API:
 *    addMenu       -> POST   /api/seller/menus
 *    updateMenu    -> PUT    /api/seller/menus/:id
 *    removeMenu    -> DELETE /api/seller/menus/:id
 *    toggleMenu    -> PATCH  /api/seller/menus/:id  { active }
 *    updateVendor  -> PUT    /api/seller/store
 *    pembacaan     -> GET    /api/seller/store & /api/seller/menus
 *
 *  Halaman-halaman TIDAK perlu diubah karena hanya memanggil context ini.
 * ==========================================================================
 */

export function MenuProvider({ children }) {
  const { user } = useAuth();

  // Seed data contoh saat pertama kali dibuka (kalau key belum pernah ada).
  const [vendors, setVendors] = useState(() => {
    ensureSeed(STORAGE_KEYS.vendors, SEED_VENDORS);
    return readJSON(STORAGE_KEYS.vendors, []);
  });
  const [menus, setMenus] = useState(() => {
    ensureSeed(STORAGE_KEYS.menus, SEED_MENUS);
    return readJSON(STORAGE_KEYS.menus, []);
  });

  useEffect(() => {
    writeJSON(STORAGE_KEYS.vendors, vendors);
  }, [vendors]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.menus, menus);
  }, [menus]);

  // Kantin milik seller yang sedang login (akun ↔ kantin lewat field `owner`).
  const myVendor = useMemo(
    () => (user ? vendors.find((v) => v.owner === user.email) ?? null : null),
    [vendors, user]
  );

  // Seller yang baru daftar otomatis punya kantin kosong sesuai storeName-nya.
  // Dilakukan saat render (pola derived-state React) supaya tidak ada
  // cascading render dari dalam effect.
  // TODO(backend): kantin dibuat oleh backend saat register — blok ini bisa
  // dihapus setelah API tersambung.
  if (user && !myVendor) {
    const nextId = vendors.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    setVendors((prev) => [
      ...prev,
      {
        id: nextId,
        name: user.storeName || user.name,
        tags: ["Menu baru"],
        rating: 5.0,
        time: "10-15 Menit",
        image: null,
        owner: user.email,
      },
    ]);
  }

  const myMenus = useMemo(
    () => (myVendor ? menus.filter((m) => m.vendorId === myVendor.id) : []),
    [menus, myVendor]
  );

  const stats = useMemo(
    () => ({
      menuCount: myMenus.length,
      activeMenuCount: myMenus.filter((m) => m.active).length,
    }),
    [myMenus]
  );

  async function addMenu(data) {
    await fakeLatency();
    if (!myVendor) throw new Error("Kantin belum ditemukan.");
    if (!data.name || data.name.trim().length < 3) {
      throw new Error("Nama menu minimal 3 karakter.");
    }
    if (!(Number(data.price) > 0)) {
      throw new Error("Harga harus lebih dari 0.");
    }

    const menu = {
      id: `${myVendor.id}-${Date.now().toString(36)}`,
      vendorId: myVendor.id,
      name: data.name.trim(),
      description: (data.description || "").trim(),
      price: Number(data.price),
      category: data.category || "berat",
      image: (data.image || "").trim() || null,
      active: data.active !== false,
    };
    setMenus((prev) => [menu, ...prev]);
    return menu;
  }

  async function updateMenu(id, data) {
    await fakeLatency();
    if (!data.name || data.name.trim().length < 3) {
      throw new Error("Nama menu minimal 3 karakter.");
    }
    if (!(Number(data.price) > 0)) {
      throw new Error("Harga harus lebih dari 0.");
    }

    setMenus((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              name: data.name.trim(),
              description: (data.description || "").trim(),
              price: Number(data.price),
              category: data.category || m.category,
              image: (data.image || "").trim() || null,
              active: data.active !== false,
            }
          : m
      )
    );
  }

  async function removeMenu(id) {
    await fakeLatency();
    setMenus((prev) => prev.filter((m) => m.id !== id));
  }

  async function toggleMenu(id) {
    await fakeLatency(150);
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  }

  async function updateVendor(patch) {
    await fakeLatency();
    if (!myVendor) throw new Error("Kantin belum ditemukan.");
    if (patch.name !== undefined && patch.name.trim().length < 3) {
      throw new Error("Nama kantin minimal 3 karakter.");
    }
    setVendors((prev) =>
      prev.map((v) =>
        v.id === myVendor.id
          ? {
              ...v,
              name: patch.name !== undefined ? patch.name.trim() : v.name,
              tags:
                patch.tags !== undefined
                  ? patch.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                  : v.tags,
            }
          : v
      )
    );
  }

  const value = {
    vendors,
    menus,
    myVendor,
    myMenus,
    ...stats,
    addMenu,
    updateMenu,
    removeMenu,
    toggleMenu,
    updateVendor,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("useMenu harus dipanggil di dalam <MenuProvider>");
  }
  return ctx;
}
