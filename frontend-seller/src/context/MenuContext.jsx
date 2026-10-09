/* eslint-disable react-refresh/only-export-components -- context: provider + hook memang diekspor bersama */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api";

const MenuContext = createContext(null);

/**
 * ==========================================================================
 *  MENU TOKO — kantin (vendor) + daftar menu milik seller.
 *
 *  Semua data diambil dari backend (bukan localStorage):
 *    pembacaan    -> GET    /api/seller/store & /api/seller/menus
 *    addMenu      -> POST   /api/seller/menus
 *    updateMenu   -> PUT    /api/seller/menus/:id
 *    removeMenu   -> DELETE /api/seller/menus/:id
 *    toggleMenu   -> PATCH  /api/seller/menus/:id  { active }
 *    updateVendor -> PUT    /api/seller/store
 *
 *  Validasi & pesan error datang dari server (Bahasa Indonesia, tampil
 *  verbatim di UI) — jangan divalidasi ulang di sini.
 * ==========================================================================
 */
export function MenuProvider({ children }) {
  const { user } = useAuth();

  // Data bertanda pemilik (`userKey`) lalu di-derive saat render: logout /
  // ganti akun otomatis menampilkan [] tanpa setState di dalam effect
  // (dilarang react-hooks/set-state-in-effect).
  const [store, setStore] = useState({
    userKey: null,
    vendors: [],
    menus: [],
  });

  const userKey = user?.email ?? null;
  const active = Boolean(userKey && store.userKey === userKey);
  const vendors = useMemo(
    () => (active ? store.vendors : []),
    [active, store]
  );
  const menus = useMemo(
    () => (active ? store.menus : []),
    [active, store]
  );

  // Kantin milik seller yang sedang login — backend mengambil kantin dari
  // sellers.id di token, jadi tidak perlu lagi mencocokkan email.
  const myVendor = useMemo(() => vendors[0] ?? null, [vendors]);

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

  useEffect(() => {
    if (!userKey) return;

    let alive = true;

    Promise.all([
      api("/seller/store"),
      api("/seller/menus?includeInactive=true"),
    ])
      .then(([result, list]) => {
        if (!alive) return;
        setStore({
          userKey,
          vendors: [result.vendor],
          menus: list.menus,
        });
      })
      .catch((err) => {
        // 404 "Kantin tidak ditemukan." = seller belum punya kantin —
        // bukan error fatal, halaman tetap render (myVendor null).
        console.error(err);
      });

    return () => {
      alive = false;
    };
  }, [userKey]);

  async function addMenu(data) {
    const res = await api("/seller/menus", { method: "POST", body: data });
    setStore((prev) => ({ ...prev, menus: [...prev.menus, res.menu] }));
    return res.menu;
  }

  async function updateMenu(id, data) {
    const res = await api(`/seller/menus/${id}`, { method: "PUT", body: data });
    setStore((prev) => ({
      ...prev,
      menus: prev.menus.map((m) => (m.id === id ? res.menu : m)),
    }));
    return res.menu;
  }

  async function removeMenu(id) {
    await api(`/seller/menus/${id}`, { method: "DELETE" });
    setStore((prev) => ({
      ...prev,
      menus: prev.menus.filter((m) => m.id !== id),
    }));
  }

  // MenuPage memanggil toggleMenu(menu.id) tanpa argumen aktif — keadaan
  // sekarang dibaca dari state lalu dikirim eksplisit ke server.
  async function toggleMenu(id) {
    const current = menus.find((m) => m.id === id);
    if (!current) throw new Error("Menu tidak ditemukan.");
    const res = await api(`/seller/menus/${id}`, {
      method: "PATCH",
      body: { active: !current.active },
    });
    setStore((prev) => ({
      ...prev,
      menus: prev.menus.map((m) => (m.id === id ? res.menu : m)),
    }));
  }

  async function updateVendor(patch) {
    const res = await api("/seller/store", { method: "PUT", body: patch });
    setStore((prev) => ({ ...prev, vendors: [res.vendor] }));
    return res.vendor;
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
